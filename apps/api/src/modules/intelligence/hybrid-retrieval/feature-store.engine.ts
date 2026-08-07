/**
 * Layer 4.5 (Hybrid Retrieval) — the Feature Store engine.
 *
 * Derived facts, computed once by the pipeline and reused everywhere (doc 23).
 * This engine does not compute anything — it reads the three vectors the
 * frozen `FeatureStoreProvider` exposes and turns whichever of their fields
 * survived Epic 06's evidence gate into keyed facts.
 *
 * **Absent fields are dropped, not zeroed.** Every field of a feature vector is
 * `FeatureValue<T> | null`, and null means the model refused for want of
 * evidence — Epic 06's floors, honestly applied. A retrieval layer that turned
 * `popularity: null` into `feature.popularity = 0` would rank a business the
 * platform knows nothing about below one it knows to be unpopular, which is a
 * fabrication with extra steps. So the fact is simply not emitted, the score
 * component stays `null`, and the weighted mean normalizes over what exists.
 *
 * At today's data volume most fields are null and this engine returns thin
 * items. That is the intended behaviour, and it is why `featureScore` is
 * nullable in `RetrievalScore`.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_FEATURE_STORE } from "../orchestrator-contracts/orchestrator.tokens";
import type {
  BusinessFeatures,
  CustomerFeatures,
  FeatureStoreProvider,
  NeighborhoodFeatures
} from "../feature-store";
import type { RetrievalSource } from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import {
  buildItem,
  fact,
  payloadOf,
  RETRIEVAL_FACT_KEYS,
  RETRIEVAL_TTL
} from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalFact,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** The featureKey reported when the feature store is not wired. */
export const FEATURE_STORE_PROVIDER_FEATURE = "retrieval.feature_store.provider";

@Injectable()
export class FeatureStoreRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "feature_store";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.feature_store;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.feature_store;
  readonly itemKinds: readonly RetrievalItemKind[] = ["feature"];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary", "analytics"];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_FEATURE_STORE)
    private readonly features: FeatureStoreProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.features !== null,
      backend: this.features !== null ? "features" : "none",
      unavailableReason: this.features !== null ? null : FEATURE_STORE_PROVIDER_FEATURE,
      durable: false
    };
  }

  /**
   * The feature store has no search operation and should not have one.
   *
   * `FeatureStoreProvider` is three keyed reads by contract, deliberately: a
   * store you can *scan* is a store people scan instead of computing features
   * for the entity they actually care about. Search delegates to the ids the
   * query names.
   */
  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    const ids = [
      ...(query.customerId ? [query.customerId] : []),
      ...query.intent.subjectEntityIds,
      ...(query.intent.neighborhoodId ? [query.intent.neighborhoodId] : [])
    ];

    return this.runLookup(ids, query);
  }

  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const store = this.features;
    const now = this.clock.now();

    if (store === null) {
      return { outcome: refuseUnavailableFeature(FEATURE_STORE_PROVIDER_FEATURE, now) };
    }

    const items: RetrievalItem[] = [];

    // The customer vector, when the query has a customer. Asked for by id
    // rather than inferred from the id list, because a customer id and a
    // business id are indistinguishable strings and asking the wrong store the
    // wrong question is how a null becomes "no features".
    if (query.customerId && ids.includes(query.customerId)) {
      const vector = await store.customerFeatures(query.customerId);
      if (vector) items.push(this.customerItem(vector, now));
    }

    for (const id of ids) {
      if (id === query.customerId) continue;

      const business = await store.businessFeatures(id);
      if (business) {
        items.push(this.businessItem(business, now));
        continue;
      }

      const neighborhood = await store.neighborhoodFeatures(id);
      if (neighborhood) items.push(this.neighborhoodItem(neighborhood, now));
    }

    return { outcome: retrieved(items, featureConfidence(items)) };
  }

  private businessItem(vector: BusinessFeatures, now: string): RetrievalItem {
    const facts: (RetrievalFact | null)[] = [
      fact(RETRIEVAL_FACT_KEYS.popularity, vector.popularity?.value),
      fact(RETRIEVAL_FACT_KEYS.trustScore, vector.trust?.value),
      fact("feature.familyScore", vector.familyScore?.value),
      fact("feature.luxuryScore", vector.luxuryScore?.value),
      fact("feature.averageVisitMinutes", vector.averageVisitMinutes?.value),
      fact("feature.noise", vector.noise?.value),
      fact("feature.priceStability", vector.priceStability?.value),
      fact(
        RETRIEVAL_FACT_KEYS.openWindows,
        vector.peakHours?.value.map(
          (window) => `${window.day}|${window.startLocalTime}|${window.endLocalTime}`
        )
      ),
      fact("feature.vector", "business")
    ];

    // Family friendliness is a *derived* score, so it becomes the boolean the
    // filter reads only when the model was confident enough to publish it.
    const family = vector.familyScore?.value;
    if (family !== undefined) {
      facts.push(fact(RETRIEVAL_FACT_KEYS.familyFriendly, family >= 0.5));
    }

    const popularity = vector.popularity?.value ?? null;
    const trust = vector.trust?.value ?? null;

    return buildItem({
      kind: "feature",
      entityId: vector.businessId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(popularity ?? confidenceOf(vector), ["feature_match"], {
        featureScore: popularity,
        businessTrustScore: trust
      }),
      payload: payloadOf(facts),
      confidence: confidenceOf(vector),
      generatedAt: vector.computedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.feature_store
    });
  }

  private customerItem(vector: CustomerFeatures, now: string): RetrievalItem {
    const pattern = vector.activityPattern?.value;

    return buildItem({
      kind: "feature",
      entityId: vector.customerId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(vector.birthdayProbability?.confidence ?? 0.5, ["feature_match"], {
        featureScore: vector.birthdayProbability?.value ?? null
      }),
      payload: payloadOf([
        fact("feature.vector", "customer"),
        fact("feature.travelRadiusKm", vector.travelRadiusKm?.value),
        fact("feature.cuisineRanking", vector.cuisineRanking?.value),
        fact("feature.birthdayProbability", vector.birthdayProbability?.value),
        fact("feature.budgetMinMinor", vector.budgetPreference?.value.min?.amountMinor ?? undefined),
        fact("feature.budgetMaxMinor", vector.budgetPreference?.value.max?.amountMinor ?? undefined),
        fact("feature.morningShare", pattern?.morningShare),
        fact("feature.eveningShare", pattern?.eveningShare)
      ]),
      confidence: vector.birthdayProbability?.confidence ?? 0.5,
      generatedAt: vector.computedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.feature_store
    });
  }

  private neighborhoodItem(vector: NeighborhoodFeatures, now: string): RetrievalItem {
    return buildItem({
      kind: "feature",
      entityId: vector.neighborhoodId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(vector.familyFriendliness?.value ?? 0.5, ["feature_match"], {
        featureScore: vector.familyFriendliness?.value ?? null
      }),
      payload: payloadOf([
        fact("feature.vector", "neighborhood"),
        fact("feature.morningActivity", vector.morningActivity?.value),
        fact("feature.nightActivity", vector.nightActivity?.value),
        fact("feature.parkingAvailability", vector.parkingAvailability?.value),
        fact("feature.walkability", vector.walkability?.value),
        fact("feature.demandTrend", vector.demandTrend?.value)
      ]),
      confidence: vector.familyFriendliness?.confidence ?? 0.5,
      generatedAt: vector.computedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.feature_store
    });
  }
}

/**
 * Confidence of a business vector: the mean of the confidences that exist.
 *
 * Absent fields do not participate — for the same reason absent score
 * components do not. A vector with one well-evidenced field is more trustworthy
 * about that field than a vector with eight weak ones, and averaging in seven
 * zeros would say the opposite.
 */
function confidenceOf(vector: BusinessFeatures): Confidence {
  const present = [
    vector.popularity,
    vector.trust,
    vector.familyScore,
    vector.luxuryScore,
    vector.averageVisitMinutes,
    vector.peakHours,
    vector.noise,
    vector.priceStability
  ].filter((value): value is NonNullable<typeof value> => value !== null);

  if (present.length === 0) return 0;

  const total = present.reduce((sum, value) => sum + value.confidence, 0);
  return Math.round((total / present.length) * 100) / 100;
}

/** Confidence of a feature result set: the mean item confidence. */
function featureConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round((total / items.length) * 100) / 100;
}
