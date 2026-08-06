/**
 * Layer 3 (Knowledge Graph) — edge reads.
 *
 * One node's edges come from two places: the projection (what the relational
 * schema proves) and the store (what someone declared or the platform
 * inferred). This service is where they become one answer, deterministically
 * — same inputs, same order, always, because a traversal whose result depends
 * on map iteration order is a traversal nobody can debug.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type { AnyRelationship, RelationshipKind } from "../relationship-engine";
import { GraphCacheService, GRAPH_CACHE_TTL } from "./graph-cache.service";
import { GraphProjectionRepository } from "./graph-projection.repository";
import type { GraphRelationshipStore } from "./graph-relationship.store";
import { GRAPH_RELATIONSHIP_STORE } from "./knowledge-graph.tokens";
import {
  KNOWN_RELATIONSHIP_KINDS,
  PROJECTION_CONFIDENCE,
  relationshipKey
} from "./knowledge-graph.relationships";
import type { TraversalDirection } from "./knowledge-graph.traversal";
import { screenRelationships } from "./knowledge-graph.validation";

/**
 * Merges two edge sets into one statement per `(kind, from, to)`.
 *
 * Pure and exported so the resolution rule is testable on its own. The rule:
 * the more confident edge wins; on a tie the projection wins, because a
 * derived fact about existing rows outranks a stored claim about them. That
 * ordering is what stops an inferred `substitutes_for` at confidence 1.0 from
 * ever overwriting a `provides` the merchant's own catalogue proves.
 */
export function mergeRelationships(
  projected: readonly AnyRelationship[],
  stored: readonly AnyRelationship[]
): readonly AnyRelationship[] {
  const merged = new Map<string, AnyRelationship>();

  for (const edge of projected) {
    merged.set(relationshipKey(edge), edge);
  }

  for (const edge of stored) {
    const key = relationshipKey(edge);
    const existing = merged.get(key);

    if (!existing || edge.confidence > existing.confidence) {
      merged.set(key, edge);
    }
  }

  return [...merged.values()].sort(compareEdges);
}

/** Kind, then target, then source: a total order over edges. */
function compareEdges(left: AnyRelationship, right: AnyRelationship): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.toId.localeCompare(right.toId) ||
    left.fromId.localeCompare(right.fromId)
  );
}

/** Keeps the edges pointing the way the caller asked. */
export function filterByDirection(
  edges: readonly AnyRelationship[],
  id: EntityId,
  direction: TraversalDirection
): readonly AnyRelationship[] {
  switch (direction) {
    case "outgoing":
      return edges.filter((edge) => edge.fromId === id);
    case "incoming":
      return edges.filter((edge) => edge.toId === id);
    default:
      return edges.filter((edge) => edge.fromId === id || edge.toId === id);
  }
}

@Injectable()
export class GraphRelationshipService {
  constructor(
    private readonly projection: GraphProjectionRepository,
    private readonly cache: GraphCacheService,
    @Inject(GRAPH_RELATIONSHIP_STORE) private readonly store: GraphRelationshipStore
  ) {}

  /** True while explicit/inferred edges have nowhere to live (pre-M1). */
  get projectionOnly(): boolean {
    return !this.store.available;
  }

  /**
   * Every edge incident to a node, optionally filtered by kind — the frozen
   * `KnowledgeGraphProvider.related` contract.
   */
  async related(id: EntityId, kinds?: readonly RelationshipKind[]): Promise<readonly AnyRelationship[]> {
    const edges = await this.cache.read(`related:${id}`, GRAPH_CACHE_TTL.related, async () => {
      const [projected, stored] = await Promise.all([
        this.projection.edgesOf(id),
        this.store.edgesOf([id])
      ]);

      return mergeRelationships(
        screenRelationships(projected, { knownKinds: KNOWN_RELATIONSHIP_KINDS }).accepted,
        stored
      );
    });

    if (!kinds || kinds.length === 0) return edges;

    const wanted = new Set<string>(kinds);
    return edges.filter((edge) => wanted.has(edge.kind));
  }

  /** `GraphEdgeReader`: what a traversal walks over. */
  async edgesOf(id: EntityId, direction: TraversalDirection): Promise<readonly AnyRelationship[]> {
    return filterByDirection(await this.related(id), id, direction);
  }

  /**
   * Providers of a service, as ids — "Haircut → provided by 120 businesses".
   *
   * Confidence is not carried in the answer because every provider edge in it
   * is a projection at `PROJECTION_CONFIDENCE`; a caller needing provenance
   * asks `related()` for the `provides` edges themselves.
   */
  async providersOfService(serviceId: EntityId): Promise<readonly EntityId[]> {
    return this.cache.read(`providers:${serviceId}`, GRAPH_CACHE_TTL.providers, () =>
      this.projection.providersOfService(serviceId)
    );
  }

  /** The confidence every projected edge carries; re-exported for callers. */
  static get projectionConfidence(): number {
    return PROJECTION_CONFIDENCE;
  }
}
