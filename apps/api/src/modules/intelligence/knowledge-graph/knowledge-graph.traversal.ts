/**
 * Layer 3 (Knowledge Graph) — traversal contracts.
 *
 * Traversal is where "connected structured facts, not rows behind a search
 * box" (doc 22) becomes an operation: from one node, follow typed edges to
 * the neighbourhood the reasoning layer needs — providers of a service,
 * substitutes for a provider, the businesses one customer keeps returning to.
 *
 * Every request is **budgeted**. A graph query without a depth and a node
 * budget is an unbounded scan waiting for the marketplace to grow into it, so
 * both are required and results say honestly whether they were `truncated`.
 */
import type { Confidence, EntityId, IsoDateTime, KnowledgeSource } from "../core";
import type { AnyRelationship, RelationshipKind } from "../relationship-engine";

/** Which way edges are followed from the start node. */
export type TraversalDirection = "outgoing" | "incoming" | "both";

export interface TraversalRequest {
  readonly startId: EntityId;
  /** Edge kinds to follow; omitted means every kind. */
  readonly kinds?: readonly RelationshipKind[];
  readonly direction: TraversalDirection;
  /** Hops from the start node; 1 = immediate neighbours. */
  readonly maxDepth: number;
  /** Hard ceiling on nodes visited, the start node included. */
  readonly maxNodes: number;
  /** Drops edges the platform is less sure of than this. */
  readonly minConfidence?: Confidence;
}

/** One followed edge, with the depth at which it was reached. */
export interface TraversalStep {
  readonly fromId: EntityId;
  readonly toId: EntityId;
  readonly kind: RelationshipKind;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly updatedAt: IsoDateTime;
  /** 1 for edges out of the start node. */
  readonly depth: number;
}

export interface TraversalResult {
  readonly startId: EntityId;
  /** Every node reached, start node first, then discovery order. */
  readonly visitedIds: readonly EntityId[];
  readonly steps: readonly TraversalStep[];
  /** True when a budget stopped the walk before the frontier was exhausted. */
  readonly truncated: boolean;
}

/**
 * Query API of graph traversal. Separate from `KnowledgeGraphProvider` (which
 * frozen Epic 03 defines) so the read contract stays exactly what it was
 * while Epic 04 adds walking on top of it.
 */
export interface GraphTraversalContract {
  traverse(request: TraversalRequest): Promise<TraversalResult>;
  /**
   * Shortest path between two nodes, or null when none exists inside the
   * budget. Shortest rather than "a path": the reasoning layer explains
   * connections to people, and the shortest one is the explainable one.
   */
  path(
    fromId: EntityId,
    toId: EntityId,
    options?: { readonly maxDepth?: number; readonly maxNodes?: number }
  ): Promise<readonly TraversalStep[] | null>;
}

/**
 * The edge supply a traversal walks over. A narrow port so traversal logic is
 * testable against an in-memory graph, and so the same walk works over
 * projections today and stored edges after M1.
 */
export interface GraphEdgeReader {
  edgesOf(id: EntityId, direction: TraversalDirection): Promise<readonly AnyRelationship[]>;
}

/** Depth budget when a caller does not state one. */
export const DEFAULT_TRAVERSAL_DEPTH = 2;

/** Node budget when a caller does not state one. */
export const DEFAULT_TRAVERSAL_NODES = 200;

/** Ceiling no request may exceed, whatever it asks for. */
export const MAX_TRAVERSAL_NODES = 2000;
