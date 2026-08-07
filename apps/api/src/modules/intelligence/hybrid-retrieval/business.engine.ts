/**
 * Layer 4.5 (Hybrid Retrieval) — the Business engine.
 *
 * The stored per-business AI profile (Epic 06): strengths, weaknesses, health,
 * popular services, typical customers, peak hours, suitable experiences, and
 * precomputed alternatives. Doc 22 is binding about *when* these are made —
 * "stored summaries, not regeneration" — so this engine only ever reads.
 *
 * **This engine is where lazy hydration is real.** A `BusinessSummary` is a
 * large object and a retrieval that returned all of it for 120 candidates
 * would spend its whole budget on the 115 that lose. So:
 *
 * ```text
 *   summary   → identity, health headline, verified, price band
 *   services  → + popular services, ranked
 *   reviews   → + strengths and weaknesses with their evidence counts
 *   analytics → + the full health block and typical customers
 * ```
 *
 * `campaigns` and `media` are declared absent rather than silently skipped:
 * the frozen `BusinessIntelligenceProvider` exposes neither, so this engine
 * says it cannot serve those levels and the pipeline records the gap.
 *
 * **Alternatives come back as their own kind.** `alternatives(businessId)` is
 * precomputed substitution — the thing that makes "replace the restaurant, keep
 * everything else" a lookup rather than a search — and it lands in the Context
 * Package's `alternativeCandidates` box, never mixed in with the businesses
 * that were actually asked for.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_BUSINESS } from "../orchestrator-contracts/orchestrator.tokens";
import type {
  BusinessIntelligenceProvider,
  BusinessSummary
} from "../business-intelligence";
import type { RetrievalSource } from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_FACT_KEYS, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore, mergeReasonCodes } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import { hydrationDepth } from "./hybrid-retrieval.types";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalFact,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** The featureKey reported when the business intelligence provider is not wired. */
export const BUSINESS_PROVIDER_FEATURE = "retrieval.business.provider";

/**
 * The featureKey reported for an unanchored search.
 *
 * Named `candidate_generation` on purpose: what is missing is not a business
 * summary, it is the *ability to enumerate candidates from a description*.
 * That is Layer 5's `CandidateGenerator` (Epic 08) plus an index this platform
 * has not built, and calling it anything else would have someone look for it
 * in the wrong module.
 */
export const CANDIDATE_GENERATION_FEATURE = "retrieval.candidate_generation";

@Injectable()
export class BusinessRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "business";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.business;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.business;
  readonly itemKinds: readonly RetrievalItemKind[] = ["business", "service", "alternative"];
  readonly hydrationLevels: readonly HydrationLevel[] = [
    "summary",
    "services",
    "reviews",
    "analytics"
  ];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_BUSINESS)
    private readonly businesses: BusinessIntelligenceProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.businesses !== null,
      backend: this.businesses !== null ? "summaries" : "none",
      unavailableReason: this.businesses !== null ? null : BUSINESS_PROVIDER_FEATURE,
      // Epic 06 stores summaries in process until M1 applies its migration.
      durable: false
    };
  }

  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    const now = this.clock.now();

    if (this.businesses === null) {
      return { outcome: refuseUnavailableFeature(BUSINESS_PROVIDER_FEATURE, now) };
    }

    if (query.intent.subjectEntityIds.length > 0) {
      return this.runLookup(query.intent.subjectEntityIds, query);
    }

    return { outcome: refuseUnavailableFeature(CANDIDATE_GENERATION_FEATURE, now) };
  }

  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const provider = this.businesses;
    const now = this.clock.now();

    if (provider === null) {
      return { outcome: refuseUnavailableFeature(BUSINESS_PROVIDER_FEATURE, now) };
    }
    if (ids.length === 0) return { outcome: retrieved([], 0) };

    const summaries = await provider.summaries(ids);
    const items: RetrievalItem[] = [];

    for (const summary of summaries.values()) {
      items.push(this.toItem(summary, "summary", now, query));
    }

    // Precomputed substitutes for each named subject — the replacement flow's
    // whole reason for existing (doc 16: "keeps every requirement, adds outdoor
    // seating"). Only for ids the query actually named, never for their
    // alternatives in turn: substitution is one hop, or it is the marketplace.
    for (const id of ids) {
      for (const alternative of await provider.alternatives(id)) {
        items.push(
          buildItem({
            kind: "alternative",
            entityId: alternative.businessId,
            engineId: this.id,
            retrievalSource: this.retrievalSource,
            score: buildScore(alternative.constraintOverlap, ["substitute_candidate"], {
              graphScore: alternative.constraintOverlap
            }),
            payload: payloadOf(
              [
                fact("alternative.replaces", id),
                fact("alternative.constraintOverlap", alternative.constraintOverlap),
                fact("alternative.gainedCapabilityKeys", alternative.gainedCapabilityKeys),
                fact("alternative.lostCapabilityKeys", alternative.lostCapabilityKeys)
              ],
              [id]
            ),
            confidence: alternative.constraintOverlap,
            generatedAt: now,
            now,
            ttlSeconds: RETRIEVAL_TTL.business
          })
        );
      }
    }

    return { outcome: retrieved(items, summaryConfidence(items)) };
  }

  /**
   * Expands a business item to a deeper level by re-reading its summary.
   *
   * Re-reading rather than caching the summary from `search`: the store is the
   * one place that knows the current profile, and holding a copy across two
   * calls is how a retrieval starts serving a summary that was superseded by a
   * job in between.
   */
  override async hydrate(
    items: readonly RetrievalItem[],
    level: HydrationLevel
  ): Promise<readonly RetrievalItem[]> {
    const provider = this.businesses;
    if (provider === null || level === "summary") return items;

    const expandable = items.filter(
      (item) =>
        item.kind === "business" &&
        this.canServe(level) &&
        hydrationDepth(item.hydration) < hydrationDepth(level)
    );
    if (expandable.length === 0) return items;

    const summaries = await provider.summaries(expandable.map((item) => item.entityId));
    const byId = new Map(expandable.map((item) => [item.entityId, item]));
    const now = this.clock.now();

    return items.map((item) => {
      if (!byId.has(item.entityId)) return item;

      const summary = summaries.get(item.entityId);
      return summary ? this.toItem(summary, level, now, null, item) : item;
    });
  }

  /** True when this engine can actually serve a level (`campaigns`/`media` cannot). */
  private canServe(level: HydrationLevel): boolean {
    return this.hydrationLevels.includes(level);
  }

  /**
   * Attaches the trust signal to any business item, whoever retrieved it.
   *
   * This is why `score()` is a separate method on the contract: the graph
   * engine finds a provider and knows nothing about its health, and folding
   * scoring into retrieval would leave that signal unread on a merged item.
   */
  override async score(
    items: readonly RetrievalItem[],
    _query: RetrievalQuery
  ): Promise<readonly RetrievalItem[]> {
    const provider = this.businesses;
    if (provider === null) return items;

    const targets = items.filter(
      (item) => item.kind === "business" && item.score.businessTrustScore === null
    );
    if (targets.length === 0) return items;

    const summaries = await provider.summaries(targets.map((item) => item.entityId));

    return items.map((item) => {
      const summary = summaries.get(item.entityId);
      if (!summary || item.kind !== "business") return item;

      const trust = summary.health.overall / 100;

      return {
        ...item,
        score: {
          ...item.score,
          businessTrustScore: Math.round(Math.min(1, Math.max(0, trust)) * 10_000) / 10_000,
          reasonCodes: mergeReasonCodes(item.score.reasonCodes, ["trusted_provider"])
        }
      };
    });
  }

  /**
   * One stored summary as an item at the requested depth.
   *
   * `previous` carries the identity of an item being hydrated, so an expansion
   * keeps the engine and score it was retrieved under.
   */
  private toItem(
    summary: BusinessSummary,
    level: HydrationLevel,
    now: string,
    query: RetrievalQuery | null,
    previous?: RetrievalItem
  ): RetrievalItem {
    const depth = hydrationDepth(level);
    const facts: (RetrievalFact | null)[] = [
      fact("business.summaryUpdatedAt", summary.updatedAt),
      fact("health.overall", summary.health.overall),
      fact("health.bookingTrend", summary.health.bookingTrend),
      fact(RETRIEVAL_FACT_KEYS.status, summary.health.listingStale ? "stale" : "active"),
      fact(
        "business.suitableExperiences",
        summary.suitableExperiences.map((entry) => entry.experienceType)
      ),
      fact(RETRIEVAL_FACT_KEYS.priceMinorUnits, summary.averageSpend?.amountMinor),
      fact(RETRIEVAL_FACT_KEYS.currency, summary.averageSpend?.currency)
    ];

    if (depth >= hydrationDepth("services")) {
      facts.push(
        fact(
          "business.popularServiceIds",
          summary.popularServices.map((service) => service.serviceId)
        )
      );
    }

    if (depth >= hydrationDepth("reviews")) {
      facts.push(
        fact("business.strengths", summary.strengths.map((entry) => entry.aspect)),
        fact("business.weaknesses", summary.weaknesses.map((entry) => entry.aspect)),
        fact(
          "business.strengthEvidence",
          summary.strengths.reduce((total, entry) => total + entry.evidenceCount, 0)
        )
      );
    }

    if (depth >= hydrationDepth("analytics")) {
      facts.push(
        fact("health.responseRate", summary.health.responseRate),
        fact("health.cancellationRate", summary.health.cancellationRate),
        fact("health.reviewFreshnessDays", summary.health.reviewFreshnessDays),
        fact("business.typicalSegments", summary.typicalCustomers.map((entry) => entry.segment)),
        fact("business.peakIntensity", summary.peakHours.peakIntensity)
      );
    }

    // The experience fit the mission asks about, when it asks about one.
    const experienceType = query?.intent.experienceType ?? null;
    const fit = experienceType
      ? (summary.suitableExperiences.find((entry) => entry.experienceType === experienceType)?.fit ??
        null)
      : null;

    const trust = summary.health.overall / 100;

    return {
      ...buildItem({
        kind: "business",
        entityId: summary.businessId,
        engineId: this.id,
        retrievalSource: this.retrievalSource,
        score: buildScore(fit ?? trust, ["business_knowledge"], {
          businessTrustScore: trust,
          featureScore: fit
        }),
        payload: payloadOf(
          facts,
          summary.popularServices.map((service) => service.serviceId)
        ),
        confidence: trust,
        hydration: level,
        generatedAt: summary.updatedAt,
        now,
        ttlSeconds: RETRIEVAL_TTL.business
      }),
      // A hydration keeps whatever the original retrieval scored it at: the
      // merge step already decided this item's standing, and re-scoring it
      // deeper in the pipeline would silently reorder a ranked list.
      ...(previous
        ? {
            score: previous.score,
            contributingEngineIds: previous.contributingEngineIds,
            cacheStatus: previous.cacheStatus
          }
        : {})
    };
  }
}

/** Confidence of a business result set: the mean item confidence. */
function summaryConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round((total / items.length) * 100) / 100;
}
