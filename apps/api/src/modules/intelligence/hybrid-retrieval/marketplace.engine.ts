/**
 * Layer 4.5 (Hybrid Retrieval) — the Marketplace engine.
 *
 * City-and-market awareness: trends, demand pressure, neighborhood character,
 * service-level market facts. The knowledge that makes an answer *about
 * Tashkent on a Friday* rather than about a database.
 *
 * **This is the one engine the frozen retrieval order cannot rank.** The AI
 * Bible v1.2's seven sources predate the marketplace-context tier (v1.3 added
 * the tier and left the retrieval list verbatim), so `ENGINE_RETRIEVAL_SOURCE`
 * maps it to `null` and `retrieval-priority.ts` reports the gap for the v1.4
 * amendment — the same discipline Epic 05 applied to `relationship_context`
 * rather than editing a frozen file to fit a later epic's need.
 *
 * **It is also the one engine an interactive budget drops.** Marketplace
 * context improves an answer; its absence does not invalidate one. When a
 * person is waiting, `planRetrieval` skips it and says so.
 *
 * Everything here is a `MarketplaceFact` from Epic 06, which means it already
 * carries its own sample size and window — so the confidence this engine
 * publishes is the confidence Layer 2 computed under its evidence floors, never
 * a number invented at retrieval time.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_MARKETPLACE } from "../orchestrator-contracts/orchestrator.tokens";
import type {
  DemandSummary,
  MarketplaceIntelligenceProvider,
  NeighborhoodSummary,
  ServiceSummary,
  TrendSummary
} from "../marketplace-intelligence";
import type { RetrievalSource } from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** The featureKey reported when the marketplace provider is not wired. */
export const MARKETPLACE_PROVIDER_FEATURE = "retrieval.marketplace.provider";

@Injectable()
export class MarketplaceRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "marketplace";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.marketplace;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.marketplace;
  readonly itemKinds: readonly RetrievalItemKind[] = ["knowledge_node", "service", "availability"];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary", "analytics"];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_MARKETPLACE)
    private readonly marketplace: MarketplaceIntelligenceProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.marketplace !== null,
      backend: this.marketplace !== null ? "summaries" : "none",
      unavailableReason: this.marketplace !== null ? null : MARKETPLACE_PROVIDER_FEATURE,
      durable: false
    };
  }

  /**
   * City context for the query's own coordinates: its neighborhood, its
   * services, and the trend around whatever it named.
   *
   * Never "everything happening in the city" — an engine that returned the
   * marketplace would flood a context window with facts about places the query
   * has nothing to do with, and the assembly step would then truncate them
   * back out at a cost.
   */
  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    const provider = this.marketplace;
    const now = this.clock.now();

    if (provider === null) {
      return { outcome: refuseUnavailableFeature(MARKETPLACE_PROVIDER_FEATURE, now) };
    }

    const items: RetrievalItem[] = [];
    const neighborhoodId = query.intent.neighborhoodId;

    if (neighborhoodId) {
      const neighborhood = await provider.neighborhood(neighborhoodId);
      if (neighborhood) items.push(this.neighborhoodItem(neighborhood, now));
    }

    for (const serviceId of query.intent.serviceIds) {
      const service = await provider.service(serviceId);
      if (service) items.push(this.serviceItem(service, now));

      const demand = await provider.demand(serviceId, neighborhoodId);
      if (demand) items.push(this.demandItem(demand, now));
    }

    const subjects = [...query.intent.subjectEntityIds, ...query.intent.categoryIds];
    if (subjects.length > 0) {
      for (const trend of await provider.trends(subjects)) items.push(this.trendItem(trend, now));
    }

    return { outcome: retrieved(items, marketplaceConfidence(items)) };
  }

  /** Trends and relationship patterns for entities the query already named. */
  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const provider = this.marketplace;
    const now = this.clock.now();

    if (provider === null) {
      return { outcome: refuseUnavailableFeature(MARKETPLACE_PROVIDER_FEATURE, now) };
    }
    if (ids.length === 0) return { outcome: retrieved([], 0) };

    const items: RetrievalItem[] = [];

    for (const trend of await provider.trends(ids)) items.push(this.trendItem(trend, now));

    for (const id of ids) {
      const relationships = await provider.relationships(id);
      for (const relationship of relationships) {
        items.push(
          buildItem({
            kind: "knowledge_node",
            entityId: relationship.toEntityId,
            engineId: this.id,
            retrievalSource: this.retrievalSource,
            score: buildScore(relationship.strength.confidence, ["marketplace_signal"], {
              graphScore: relationship.strength.value
            }),
            payload: payloadOf(
              [
                fact("relationship.pattern", relationship.pattern),
                fact("relationship.strength", relationship.strength.value),
                fact("relationship.sampleSize", relationship.strength.sampleSize)
              ],
              [relationship.fromEntityId]
            ),
            confidence: relationship.strength.confidence,
            generatedAt: relationship.strength.generatedAt,
            now,
            ttlSeconds: RETRIEVAL_TTL.marketplace
          })
        );
      }
    }

    void query;
    return { outcome: retrieved(items, marketplaceConfidence(items)) };
  }

  private neighborhoodItem(summary: NeighborhoodSummary, now: string): RetrievalItem {
    return buildItem({
      kind: "knowledge_node",
      entityId: summary.neighborhoodId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(summary.businessCount.confidence, ["marketplace_signal"], {}),
      payload: payloadOf([
        fact("neighborhood.businessCount", summary.businessCount.value),
        fact("neighborhood.underservedServiceIds", summary.underservedServiceIds),
        fact("neighborhood.averagePriceLevel", summary.averagePriceLevel?.value),
        fact("neighborhood.sampleSize", summary.businessCount.sampleSize)
      ]),
      confidence: summary.businessCount.confidence,
      generatedAt: summary.generatedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.marketplace
    });
  }

  private serviceItem(summary: ServiceSummary, now: string): RetrievalItem {
    return buildItem({
      kind: "service",
      entityId: summary.serviceId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(summary.providerCount.confidence, ["marketplace_signal"], {}),
      payload: payloadOf(
        [
          fact("service.providerCount", summary.providerCount.value),
          fact("service.medianPriceMinor", summary.medianPrice?.value.amountMinor),
          fact("service.medianLeadHours", summary.medianBookingLeadHours?.value),
          fact("service.sampleSize", summary.providerCount.sampleSize)
        ],
        summary.frequentlyBookedWithServiceIds
      ),
      confidence: summary.providerCount.confidence,
      generatedAt: summary.generatedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.marketplace
    });
  }

  /**
   * Demand pressure lands in the `availability` box, not `knowledgeNodes`.
   *
   * Pressure > 1 means more demand than supply, which is the retrieval-time
   * answer to "will they get a table?" — the same question availability
   * answers, one level of aggregation up.
   */
  private demandItem(summary: DemandSummary, now: string): RetrievalItem {
    const pressure = summary.pressure.value;

    return buildItem({
      kind: "availability",
      entityId: summary.serviceOrCategoryId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(summary.pressure.confidence, ["marketplace_signal"], {
        // High pressure is *low* availability; the score is the inversion, and
        // it saturates rather than going negative.
        availabilityScore: pressure > 0 ? Math.min(1, 1 / pressure) : null
      }),
      payload: payloadOf([
        fact("demand.volume", summary.demandVolume.value),
        fact("demand.supplyCount", summary.supplyCount.value),
        fact("demand.pressure", pressure),
        fact("demand.windowStart", summary.window.start),
        fact("demand.windowEnd", summary.window.end),
        fact("demand.neighborhoodId", summary.neighborhoodId)
      ]),
      confidence: summary.pressure.confidence,
      generatedAt: summary.pressure.generatedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.marketplace
    });
  }

  private trendItem(summary: TrendSummary, now: string): RetrievalItem {
    return buildItem({
      kind: "knowledge_node",
      entityId: summary.subjectEntityId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(summary.changeRate.confidence, ["marketplace_signal"], {}),
      payload: payloadOf([
        fact("trend.direction", summary.direction),
        fact("trend.metric", summary.metric),
        fact("trend.changeRate", summary.changeRate.value),
        fact("trend.sampleSize", summary.changeRate.sampleSize)
      ]),
      confidence: summary.changeRate.confidence,
      generatedAt: summary.changeRate.generatedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.marketplace
    });
  }
}

/** Confidence of a marketplace result set: the mean item confidence. */
function marketplaceConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round((total / items.length) * 100) / 100;
}
