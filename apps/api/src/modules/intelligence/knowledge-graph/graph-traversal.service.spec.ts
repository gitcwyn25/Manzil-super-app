import { GraphTraversalService, walk } from "./graph-traversal.service";
import { filterByDirection, mergeRelationships } from "./graph-relationship.service";
import { PROJECTION_CONFIDENCE, relationship } from "./knowledge-graph.relationships";
import type { AnyRelationship } from "../relationship-engine";
import type { GraphEdgeReader, TraversalDirection } from "./knowledge-graph.traversal";

const AT = "2026-08-01T10:00:00.000Z";

function edge(
  kind: "visited" | "belongs_to" | "located_in" | "provides",
  fromId: string,
  toId: string,
  confidence = PROJECTION_CONFIDENCE
): AnyRelationship {
  return relationship({
    kind,
    fromId,
    toId,
    attributes: {} as never,
    source: "merchant_input",
    confidence,
    updatedAt: AT
  });
}

/**
 * An in-memory graph, so traversal semantics are asserted without Prisma, a
 * cache, or Nest in the way:
 *
 *   customer:c1 →visited→ business:b1 →belongs_to→ category:k1
 *                          business:b1 →located_in→ neighborhood:n1
 *   customer:c1 →visited→ business:b2 →belongs_to→ category:k1   (a cycle back
 *                                                                through k1)
 */
const EDGES: readonly AnyRelationship[] = [
  edge("visited", "customer:c1", "business:b1"),
  edge("visited", "customer:c1", "business:b2"),
  edge("belongs_to", "business:b1", "category:k1"),
  edge("belongs_to", "business:b2", "category:k1"),
  edge("located_in", "business:b1", "neighborhood:n1", 0.4)
];

function makeReader(edges: readonly AnyRelationship[] = EDGES): GraphEdgeReader {
  return {
    async edgesOf(id: string, direction: TraversalDirection) {
      return filterByDirection(edges, id, direction);
    }
  };
}

describe("walk — breadth-first traversal", () => {
  it("reaches immediate neighbours at depth 1", async () => {
    const result = await walk(makeReader(), {
      startId: "customer:c1",
      direction: "both",
      maxDepth: 1,
      maxNodes: 50
    });

    expect(result.visitedIds).toEqual(["customer:c1", "business:b1", "business:b2"]);
    expect(result.steps.every((step) => step.depth === 1)).toBe(true);
  });

  it("expands to depth 2 and records the depth each edge was reached at", async () => {
    const result = await walk(makeReader(), {
      startId: "customer:c1",
      direction: "both",
      maxDepth: 2,
      maxNodes: 50
    });

    expect(result.visitedIds).toEqual([
      "customer:c1",
      "business:b1",
      "business:b2",
      "category:k1",
      "neighborhood:n1"
    ]);

    const byKind = new Map(result.steps.map((step) => [`${step.kind}:${step.toId}`, step.depth]));
    expect(byKind.get("visited:business:b1")).toBe(1);
    expect(byKind.get("belongs_to:category:k1")).toBe(2);
  });

  it("terminates on a cycle and still reports the closing edge", async () => {
    const result = await walk(makeReader(), {
      startId: "customer:c1",
      direction: "both",
      maxDepth: 4,
      maxNodes: 50
    });

    // b2 →belongs_to→ k1 closes the diamond: the node is not re-expanded, but
    // the connection is still part of the answer.
    const closing = result.steps.filter((step) => step.toId === "category:k1");
    expect(closing).toHaveLength(2);
    expect(result.visitedIds).toHaveLength(5);
  });

  it("follows only the kinds asked for", async () => {
    const result = await walk(makeReader(), {
      startId: "customer:c1",
      kinds: ["visited"],
      direction: "outgoing",
      maxDepth: 3,
      maxNodes: 50
    });

    expect(result.steps.every((step) => step.kind === "visited")).toBe(true);
    expect(result.visitedIds).toEqual(["customer:c1", "business:b1", "business:b2"]);
  });

  it("drops edges below the requested confidence", async () => {
    const result = await walk(makeReader(), {
      startId: "business:b1",
      direction: "outgoing",
      maxDepth: 1,
      maxNodes: 50,
      minConfidence: 0.9
    });

    // located_in sits at 0.4 and is excluded; belongs_to at 1.0 survives.
    expect(result.steps.map((step) => step.kind)).toEqual(["belongs_to"]);
  });

  it("respects the node budget and says it was truncated", async () => {
    const result = await walk(makeReader(), {
      startId: "customer:c1",
      direction: "both",
      maxDepth: 3,
      maxNodes: 2
    });

    expect(result.visitedIds).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it("honours direction", async () => {
    const incoming = await walk(makeReader(), {
      startId: "business:b1",
      direction: "incoming",
      maxDepth: 1,
      maxNodes: 50
    });

    expect(incoming.visitedIds).toEqual(["business:b1", "customer:c1"]);
  });
});

describe("GraphTraversalService.path", () => {
  const service = new GraphTraversalService({
    edgesOf: async (id: string, direction: TraversalDirection) =>
      filterByDirection(EDGES, id, direction)
  } as never);

  it("finds the shortest path regardless of edge direction", async () => {
    const path = await service.path("customer:c1", "neighborhood:n1", { maxDepth: 3 });

    expect(path?.map((step) => step.kind)).toEqual(["visited", "located_in"]);
    expect(path?.[0]?.toId).toBe("business:b1");
  });

  it("returns an empty path for a node to itself", async () => {
    expect(await service.path("customer:c1", "customer:c1")).toEqual([]);
  });

  it("returns null when no path exists inside the budget", async () => {
    expect(await service.path("customer:c1", "neighborhood:n1", { maxDepth: 1 })).toBeNull();
    expect(await service.path("customer:c1", "business:absent", { maxDepth: 3 })).toBeNull();
  });
});

describe("mergeRelationships", () => {
  it("keeps one statement per (kind, from, to), most confident wins", () => {
    const projected = [edge("belongs_to", "business:b1", "category:k1", 1)];
    const stored = [edge("belongs_to", "business:b1", "category:k1", 0.5)];

    const merged = mergeRelationships(projected, stored);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.confidence).toBe(1);
  });

  it("lets a more confident stored edge replace the projection", () => {
    const merged = mergeRelationships(
      [edge("visited", "customer:c1", "business:b1", 0.2)],
      [edge("visited", "customer:c1", "business:b1", 0.8)]
    );

    expect(merged[0]?.confidence).toBe(0.8);
  });

  it("orders deterministically by kind then target", () => {
    const merged = mergeRelationships(
      [
        edge("visited", "customer:c1", "business:b2"),
        edge("belongs_to", "business:b1", "category:k1"),
        edge("visited", "customer:c1", "business:b1")
      ],
      []
    );

    expect(merged.map((relation) => `${relation.kind}:${relation.toId}`)).toEqual([
      "belongs_to:category:k1",
      "visited:business:b1",
      "visited:business:b2"
    ]);
  });
});
