/**
 * Layer 4.5 (Hybrid Retrieval) — the Knowledge Graph engine.
 *
 * Structural knowledge: what a provider *is*, what it offers, where it sits,
 * what substitutes for it. ADR-006 ranks this above semantic similarity, and
 * the reason is visible here — a graph hit is a restatement of a row, so it is
 * either true or absent, and it never needs a threshold.
 *
 * **What this engine can and cannot do today, precisely.** The frozen
 * `KnowledgeGraphProvider` exposes four operations: `entity`, `entities`,
 * `related`, `providersOfService`. Three of them are keyed reads; the fourth
 * is a keyed read in disguise. There is **no open-ended search** — no "find
 * businesses in this category near this neighborhood" — because building one
 * would mean an index this platform has not built. So:
 *
 * - `lookup()` and service-anchored `search()` return **real graph data**;
 * - an unanchored `search()` returns `feature_unavailable`, naming the
 *   operation that does not exist rather than returning an empty list that
 *   would read as "the city has no restaurants".
 *
 * That refusal is the honest state of the platform and it is *visible* — the
 * planner marks this engine required, so the package says `partialResults`
 * and names the gap.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_KNOWLEDGE_GRAPH } from "../orchestrator-contracts/orchestrator.tokens";
import type { AnyGraphEntity, KnowledgeGraphProvider } from "../knowledge-graph";
import type { AnyRelationship } from "../relationship-engine";
import type { RetrievalSource } from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_FACT_KEYS, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** Edge kinds that make one provider a candidate substitute for another. */
export const SUBSTITUTE_EDGE_KINDS = ["substitutes_for", "recommended_with"] as const;

/** Edge kinds that expand a business into the services it offers. */
export const SERVICE_EDGE_KINDS = ["provides"] as const;

/** The featureKey reported when the graph has no operation for this question. */
export const GRAPH_OPEN_SEARCH_FEATURE = "retrieval.knowledge_graph.open_search";

/** The featureKey reported when the graph provider itself is not wired. */
export const GRAPH_PROVIDER_FEATURE = "retrieval.knowledge_graph.provider";

@Injectable()
export class KnowledgeGraphRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "knowledge_graph";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.knowledge_graph;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.knowledge_graph;
  readonly itemKinds: readonly RetrievalItemKind[] = [
    "business",
    "service",
    "experience",
    "knowledge_node",
    "alternative"
  ];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary", "services"];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_KNOWLEDGE_GRAPH)
    private readonly graph: KnowledgeGraphProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.graph !== null,
      backend: this.graph !== null ? "graph" : "none",
      unavailableReason: this.graph !== null ? null : GRAPH_PROVIDER_FEATURE,
      // The graph is projected from live Prisma rows on every read, so it is
      // durable in the only sense that matters: a restart loses nothing.
      durable: this.graph !== null
    };
  }

  /**
   * Service-anchored search: "who provides this?".
   *
   * The one search the frozen contract supports, and the one doc 21 designed
   * services as first-class objects to make trivial — "Haircut → provided by
   * 120 businesses" is `providersOfService`, not a query planner.
   */
  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    const graph = this.graph;
    const now = this.clock.now();

    if (graph === null) {
      return { outcome: refuseUnavailableFeature(GRAPH_PROVIDER_FEATURE, now) };
    }

    const serviceIds = query.intent.serviceIds;
    if (serviceIds.length === 0) {
      return { outcome: refuseUnavailableFeature(GRAPH_OPEN_SEARCH_FEATURE, now) };
    }

    const providerIds = new Set<EntityId>();
    for (const serviceId of serviceIds) {
      for (const providerId of await graph.providersOfService(serviceId)) {
        providerIds.add(providerId);
      }
    }

    const entities = await graph.entities([...providerIds, ...serviceIds]);
    const items = [...entities.values()].map((entity) =>
      this.toItem(entity, now, serviceIds.length > 0 ? "graph_match" : "graph_neighbour")
    );

    return { outcome: retrieved(items, graphConfidence(items)) };
  }

  /** Keyed read plus one hop: the named entities and what they connect to. */
  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const graph = this.graph;
    const now = this.clock.now();

    if (graph === null) {
      return { outcome: refuseUnavailableFeature(GRAPH_PROVIDER_FEATURE, now) };
    }
    if (ids.length === 0) return { outcome: retrieved([], 0) };

    const entities = await graph.entities(ids);
    const items: RetrievalItem[] = [...entities.values()].map((entity) =>
      this.toItem(entity, now, "graph_match")
    );

    // One hop out, for substitutes and neighbours. Depth one on purpose: the
    // traversal contract can walk further, and a retrieval that walked further
    // by default would return the marketplace.
    const neighbourIds = new Set<EntityId>();
    for (const id of ids) {
      const edges = await graph.related(id);
      for (const edge of substitutes(edges)) neighbourIds.add(edge.toId);
    }

    for (const id of ids) neighbourIds.delete(id);

    if (neighbourIds.size > 0) {
      const neighbours = await graph.entities([...neighbourIds]);
      for (const entity of neighbours.values()) {
        items.push(this.toItem(entity, now, "substitute_candidate", "alternative"));
      }
    }

    // `query` is read for its anchor when scoring, not here: retrieval finds,
    // scoring weighs, and folding the two together is how an engine ends up
    // silently filtering.
    void query;

    return { outcome: retrieved(items, graphConfidence(items)) };
  }

  /** Expands businesses into the services they provide — one real hop. */
  override async hydrate(
    items: readonly RetrievalItem[],
    level: HydrationLevel
  ): Promise<readonly RetrievalItem[]> {
    const graph = this.graph;
    if (graph === null || level === "summary") return items;

    const expanded: RetrievalItem[] = [];

    for (const item of items) {
      if (item.kind !== "business" || item.hydration !== "summary") {
        expanded.push(item);
        continue;
      }

      const edges = await graph.related(item.entityId, [...SERVICE_EDGE_KINDS]);
      const serviceIds = edges.map((edge) => edge.toId);

      expanded.push({
        ...item,
        hydration: "services",
        payload: {
          facts: [...item.payload.facts, { key: "graph.serviceCount", value: serviceIds.length }].sort(
            (left, right) => left.key.localeCompare(right.key)
          ),
          relatedEntityIds: [...new Set([...item.payload.relatedEntityIds, ...serviceIds])].sort()
        }
      });
    }

    return expanded;
  }

  /** One graph entity as a retrieval item, with facts read from its metadata. */
  private toItem(
    entity: AnyGraphEntity,
    now: string,
    reason: "graph_match" | "graph_neighbour" | "substitute_candidate",
    kindOverride?: RetrievalItemKind
  ): RetrievalItem {
    const kind = kindOverride ?? itemKindOf(entity);

    return buildItem({
      kind,
      entityId: entity.id,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(entity.confidence, [reason], {
        // The graph's own signal *is* its confidence: a projected edge either
        // restates a row or does not exist, so there is nothing else to weigh.
        graphScore: entity.confidence
      }),
      payload: payloadOf(factsOf(entity), relatedIdsOf(entity)),
      confidence: entity.confidence,
      generatedAt: entity.updatedAt,
      now,
      ttlSeconds: RETRIEVAL_TTL.knowledge_graph
    });
  }
}

/** Substitute-ish edges out of one entity. */
function substitutes(edges: readonly AnyRelationship[]): readonly AnyRelationship[] {
  const kinds = new Set<string>(SUBSTITUTE_EDGE_KINDS);
  return edges.filter((edge) => kinds.has(edge.kind));
}

/** The retrieval kind of a graph node — the graph's fifteen, narrowed to ours. */
function itemKindOf(entity: AnyGraphEntity): RetrievalItemKind {
  switch (entity.type) {
    case "business":
      return "business";
    case "service":
      return "service";
    case "experience":
      return "experience";
    case "workspace":
      return "workspace";
    case "customer":
      return "related_customer";
    case "campaign":
      return "campaign";
    default:
      // Categories, locations, neighborhoods, events, reviews, stories,
      // bookings, organizations and relationship nodes are all structural
      // context rather than candidates, and the package has one box for them.
      return "knowledge_node";
  }
}

/** The keyed facts one node contributes, by node type. */
function factsOf(entity: AnyGraphEntity) {
  const base = [
    fact("graph.type", entity.type),
    fact("graph.updatedAt", entity.updatedAt),
    fact("graph.relationshipCount", entity.relationships.length)
  ];

  switch (entity.type) {
    case "business":
      return [
        ...base,
        fact("business.name", entity.metadata.name),
        fact("business.slug", entity.metadata.slug),
        fact(RETRIEVAL_FACT_KEYS.priceLevel, entity.metadata.priceTier),
        fact(RETRIEVAL_FACT_KEYS.verified, entity.metadata.verified),
        fact(
          RETRIEVAL_FACT_KEYS.categoryIds,
          entity.metadata.categoryId ? [entity.metadata.categoryId] : []
        ),
        fact("location.neighborhoodId", entity.metadata.neighborhoodId),
        fact(
          RETRIEVAL_FACT_KEYS.capabilityKeys,
          entity.metadata.capabilities.map((capability) => capability.key)
        ),
        fact(
          RETRIEVAL_FACT_KEYS.openWindows,
          entity.metadata.openingHours.map(
            (window) => `${window.day}|${window.startLocalTime}|${window.endLocalTime}`
          )
        )
      ];
    case "service":
      return [
        ...base,
        fact("service.name", entity.metadata.name),
        fact("service.durationMinutes", entity.metadata.typicalDurationMinutes),
        fact(
          RETRIEVAL_FACT_KEYS.categoryIds,
          entity.metadata.categoryId ? [entity.metadata.categoryId] : []
        )
      ];
    case "experience":
      return [
        ...base,
        fact("experience.type", entity.metadata.experienceType),
        fact(RETRIEVAL_FACT_KEYS.status, entity.metadata.status),
        fact(RETRIEVAL_FACT_KEYS.workspaceId, entity.metadata.workspaceId),
        fact("experience.guestCount", entity.metadata.guestCount)
      ];
    default:
      return base;
  }
}

/** Ids this node points at, from its own edge list. */
function relatedIdsOf(entity: AnyGraphEntity): readonly EntityId[] {
  return entity.relationships.map((edge) => edge.toId);
}

/**
 * Confidence of a graph result set: the mean node confidence.
 *
 * Zero for an empty set, which is correct and not a refusal — "the graph knows
 * of nothing here" is a real answer, and it is reported as `retrieved` with no
 * items so a caller can tell it apart from "the graph could not be asked".
 */
function graphConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round((total / items.length) * 100) / 100;
}
