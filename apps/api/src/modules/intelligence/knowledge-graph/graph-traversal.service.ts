/**
 * Layer 3 (Knowledge Graph) — traversal.
 *
 * Breadth-first, budgeted, cycle-safe, deterministic. Breadth-first because
 * the questions asked of this graph are proximity questions ("what is one hop
 * from this customer?"), and because BFS is what makes `path()` the shortest
 * path rather than merely a path — the one a person can be shown.
 *
 * The walk holds no database handle: it consumes a `GraphEdgeReader`, so the
 * same code walks projections today and stored edges after M1, and the tests
 * walk a hand-built graph.
 */
import { Injectable } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { AnyRelationship } from "../relationship-engine";
import { GraphRelationshipService } from "./graph-relationship.service";
import {
  DEFAULT_TRAVERSAL_DEPTH,
  DEFAULT_TRAVERSAL_NODES,
  MAX_TRAVERSAL_NODES,
  type GraphEdgeReader,
  type GraphTraversalContract,
  type TraversalRequest,
  type TraversalResult,
  type TraversalStep
} from "./knowledge-graph.traversal";

/** The far end of an edge, given the node it was reached from. */
function otherEnd(edge: AnyRelationship, from: EntityId): EntityId {
  return edge.fromId === from ? edge.toId : edge.fromId;
}

function toStep(edge: AnyRelationship, depth: number): TraversalStep {
  return {
    fromId: edge.fromId,
    toId: edge.toId,
    kind: edge.kind,
    source: edge.source,
    confidence: edge.confidence,
    updatedAt: edge.updatedAt,
    depth
  };
}

/**
 * The walk itself, over any edge reader.
 *
 * Exported as a free function so traversal semantics can be tested against an
 * in-memory graph with no Nest, no Prisma, and no cache in the way.
 */
export async function walk(
  reader: GraphEdgeReader,
  request: TraversalRequest
): Promise<TraversalResult> {
  const maxDepth = Math.max(1, Math.floor(request.maxDepth || DEFAULT_TRAVERSAL_DEPTH));
  const maxNodes = Math.min(
    Math.max(1, Math.floor(request.maxNodes || DEFAULT_TRAVERSAL_NODES)),
    MAX_TRAVERSAL_NODES
  );
  const wanted = request.kinds && request.kinds.length > 0 ? new Set<string>(request.kinds) : null;
  const minConfidence: Confidence = request.minConfidence ?? 0;

  const visited = new Set<EntityId>([request.startId]);
  const steps: TraversalStep[] = [];
  let frontier: EntityId[] = [request.startId];
  let truncated = false;

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: EntityId[] = [];

    for (const nodeId of frontier) {
      const edges = await reader.edgesOf(nodeId, request.direction);

      for (const edge of edges) {
        if (wanted && !wanted.has(edge.kind)) continue;
        if (edge.confidence < minConfidence) continue;

        const neighbour = otherEnd(edge, nodeId);
        if (visited.has(neighbour)) {
          // Cycles and re-discoveries: the edge is still part of the answer
          // (it is a real connection), the node is simply not re-expanded.
          steps.push(toStep(edge, depth));
          continue;
        }

        if (visited.size >= maxNodes) {
          truncated = true;
          break;
        }

        visited.add(neighbour);
        steps.push(toStep(edge, depth));
        next.push(neighbour);
      }

      if (truncated) break;
    }

    if (truncated) break;
    frontier = next;

    // The frontier is non-empty but the depth budget is spent: say so.
    if (depth === maxDepth && frontier.length > 0) {
      truncated = true;
    }
  }

  return {
    startId: request.startId,
    visitedIds: [...visited],
    steps: dedupeSteps(steps),
    truncated
  };
}

/**
 * One edge can be reached from both ends within a single walk; the answer
 * should state each connection once, at the depth it was first reached.
 */
function dedupeSteps(steps: readonly TraversalStep[]): readonly TraversalStep[] {
  const seen = new Map<string, TraversalStep>();

  for (const step of steps) {
    const key = `${step.kind}|${step.fromId}|${step.toId}`;
    const existing = seen.get(key);
    if (!existing || step.depth < existing.depth) {
      seen.set(key, step);
    }
  }

  return [...seen.values()];
}

@Injectable()
export class GraphTraversalService implements GraphTraversalContract {
  constructor(private readonly relationships: GraphRelationshipService) {}

  traverse(request: TraversalRequest): Promise<TraversalResult> {
    return walk(this.relationships, request);
  }

  /**
   * Shortest path between two nodes, edge directions ignored.
   *
   * "Ignored" is deliberate: the connection between a customer and a
   * neighbourhood runs customer →visited→ business →located_in→
   * neighbourhood, and insisting on a consistent direction would declare
   * that obviously-real connection nonexistent.
   */
  async path(
    fromId: EntityId,
    toId: EntityId,
    options?: { readonly maxDepth?: number; readonly maxNodes?: number }
  ): Promise<readonly TraversalStep[] | null> {
    if (fromId === toId) return [];

    const maxDepth = Math.max(1, Math.floor(options?.maxDepth ?? DEFAULT_TRAVERSAL_DEPTH));
    const maxNodes = Math.min(
      Math.max(1, Math.floor(options?.maxNodes ?? DEFAULT_TRAVERSAL_NODES)),
      MAX_TRAVERSAL_NODES
    );

    const cameFrom = new Map<EntityId, TraversalStep>();
    const visited = new Set<EntityId>([fromId]);
    let frontier: EntityId[] = [fromId];

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
      const next: EntityId[] = [];

      for (const nodeId of frontier) {
        const edges = await this.relationships.edgesOf(nodeId, "both");

        for (const edge of edges) {
          const neighbour = otherEnd(edge, nodeId);
          if (visited.has(neighbour)) continue;
          if (visited.size >= maxNodes) return null;

          visited.add(neighbour);
          cameFrom.set(neighbour, toStep(edge, depth));

          if (neighbour === toId) {
            return reconstruct(cameFrom, fromId, toId);
          }

          next.push(neighbour);
        }
      }

      frontier = next;
    }

    return null;
  }
}

/** Walks the predecessor map back to the start, then reverses it. */
function reconstruct(
  cameFrom: ReadonlyMap<EntityId, TraversalStep>,
  fromId: EntityId,
  toId: EntityId
): readonly TraversalStep[] {
  const reversed: TraversalStep[] = [];
  let cursor: EntityId | undefined = toId;

  while (cursor && cursor !== fromId) {
    const step: TraversalStep | undefined = cameFrom.get(cursor);
    if (!step) break;

    reversed.push(step);
    cursor = step.fromId === cursor ? step.toId : step.fromId;
  }

  return reversed.reverse();
}
