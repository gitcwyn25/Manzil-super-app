import {
  compareRetrievalItems,
  contributingEngines,
  dedupeItems,
  duplicateCount,
  entityIdsOf,
  itemPriorityRank,
  mergeAndRank,
  mergeItems,
  ownerOf,
  rankItems
} from "./retrieval-ranking";
import { buildItem, payloadOf } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import type { RetrievalSource } from "../memory-engine";
import type {
  RetrievalEngineId,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalReasonCode
} from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

function item(input: {
  id: string;
  engineId: RetrievalEngineId;
  source: RetrievalSource | null;
  score?: number;
  kind?: RetrievalItemKind;
  reason?: RetrievalReasonCode;
  facts?: readonly (readonly [string, string | number | boolean])[];
  confidence?: number;
  generatedAt?: string;
}): RetrievalItem {
  return buildItem({
    kind: input.kind ?? "business",
    entityId: input.id,
    engineId: input.engineId,
    retrievalSource: input.source,
    score: buildScore(input.score ?? 0.5, [input.reason ?? "graph_match"]),
    payload: payloadOf((input.facts ?? []).map(([key, value]) => ({ key, value }))),
    confidence: input.confidence ?? 0.5,
    generatedAt: input.generatedAt ?? NOW,
    now: NOW,
    ttlSeconds: null
  });
}

describe("itemPriorityRank — the binding order, three cases", () => {
  it("uses the item's own source when the Bible names one", () => {
    expect(itemPriorityRank(item({ id: "a", engineId: "memory", source: "mission_context" }))).toBe(1);
    expect(
      itemPriorityRank(item({ id: "a", engineId: "memory", source: "persistent_preferences" }))
    ).toBe(2);
  });

  it("places an unnamed item half a step below its engine — Epic 05's amendment", () => {
    // Relationship memory: no source in the Bible's seven, so it sorts between
    // mission_context (1) and persistent_preferences (2).
    const relationship = item({ id: "a", engineId: "memory", source: null });

    expect(itemPriorityRank(relationship)).toBe(1.5);
  });

  it("places an unranked engine below business knowledge and above the model's own", () => {
    const marketplace = item({ id: "a", engineId: "marketplace", source: null });

    expect(itemPriorityRank(marketplace)).toBeGreaterThan(5);
    expect(itemPriorityRank(marketplace)).toBeLessThan(6);
  });
});

describe("ranking — priority beats score, always", () => {
  it("keeps a weak workspace item above a perfect semantic one", () => {
    const workspace = item({
      id: "w1",
      engineId: "workspace",
      source: "workspace_timeline",
      score: 0.01,
      kind: "workspace"
    });
    const semantic = item({
      id: "s1",
      engineId: "semantic",
      source: "general_llm_knowledge",
      score: 1,
      reason: "semantic_similarity"
    });

    expect(rankItems([semantic, workspace])[0]).toBe(workspace);
  });

  it("keeps memory above business knowledge whatever the scores say", () => {
    const memory = item({ id: "m", engineId: "memory", source: "mission_context", score: 0.1, kind: "mission" });
    const business = item({ id: "b", engineId: "business", source: "business_knowledge", score: 0.99 });

    expect(rankItems([business, memory]).map((entry) => entry.entityId)).toEqual(["m", "b"]);
  });

  it("uses the score inside a priority band", () => {
    const weak = item({ id: "b1", engineId: "business", source: "business_knowledge", score: 0.2 });
    const strong = item({ id: "b2", engineId: "business", source: "business_knowledge", score: 0.8 });

    expect(rankItems([weak, strong]).map((entry) => entry.entityId)).toEqual(["b2", "b1"]);
  });

  it("breaks a full tie deterministically by entity id", () => {
    const left = item({ id: "zzz", engineId: "business", source: "business_knowledge" });
    const right = item({ id: "aaa", engineId: "business", source: "business_knowledge" });

    expect(compareRetrievalItems(left, right)).toBeGreaterThan(0);
    expect(rankItems([left, right]).map((entry) => entry.entityId)).toEqual(["aaa", "zzz"]);
  });
});

describe("dedupe and merge", () => {
  const graphView = item({
    id: "biz_1",
    engineId: "knowledge_graph",
    source: "business_knowledge",
    score: 0.6,
    facts: [["graph.type", "business"]],
    confidence: 0.6
  });
  const businessView = item({
    id: "biz_1",
    engineId: "business",
    source: "business_knowledge",
    score: 0.9,
    reason: "business_knowledge",
    facts: [["health.overall", 82]],
    confidence: 0.82
  });

  it("collapses two engines' views of one entity into one item", () => {
    const merged = dedupeItems([graphView, businessView]);

    expect(merged).toHaveLength(1);
    expect([...merged[0]!.contributingEngineIds].sort()).toEqual(["business", "knowledge_graph"]);
  });

  it("unions the facts, with the owner winning on a key collision", () => {
    const merged = mergeItems(graphView, businessView);
    const keys = merged.payload.facts.map((entry) => entry.key);

    expect(keys).toContain("graph.type");
    expect(keys).toContain("health.overall");
  });

  it("gives ownership to the earlier engine in the binding order, not the higher score", () => {
    // Both speak for `business_knowledge`; the graph is earlier in
    // ENGINE_RETRIEVAL_ORDER, so it owns the merged item despite scoring lower.
    expect(ownerOf(graphView, businessView).engineId).toBe("knowledge_graph");
    expect(ownerOf(businessView, graphView).engineId).toBe("knowledge_graph");
  });

  it("is independent of the order engines happened to answer in", () => {
    const forward = dedupeItems([graphView, businessView])[0]!;
    const backward = dedupeItems([businessView, graphView])[0]!;

    expect(forward.engineId).toBe(backward.engineId);
    expect(forward.score.overallScore).toBe(backward.score.overallScore);
    expect(forward.payload.facts).toEqual(backward.payload.facts);
  });

  it("reports a cache miss when either view was live", () => {
    expect(mergeItems(graphView, businessView).cacheStatus).toBe("miss");
  });

  it("keeps the older freshness reading, so a merge cannot look fresher than its inputs", () => {
    const old = item({
      id: "biz_2",
      engineId: "business",
      source: "business_knowledge",
      generatedAt: "2026-08-01T00:00:00.000Z"
    });
    const fresh = item({ id: "biz_2", engineId: "knowledge_graph", source: "business_knowledge" });

    expect(mergeItems(old, fresh).freshness.ageSeconds).toBeGreaterThan(0);
  });

  it("counts duplicates before collapsing them", () => {
    expect(duplicateCount([graphView, businessView])).toBe(1);
    expect(duplicateCount([graphView])).toBe(0);
  });

  it("keeps different kinds of the same entity apart — a business is not its alternative", () => {
    const asAlternative = item({
      id: "biz_1",
      engineId: "business",
      source: "business_knowledge",
      kind: "alternative"
    });

    expect(dedupeItems([graphView, asAlternative])).toHaveLength(2);
  });
});

describe("mergeAndRank", () => {
  it("dedupes, ranks, then caps in that order", () => {
    const items = [
      item({ id: "b1", engineId: "business", source: "business_knowledge", score: 0.2 }),
      item({ id: "b1", engineId: "knowledge_graph", source: "business_knowledge", score: 0.3 }),
      item({ id: "m1", engineId: "memory", source: "mission_context", kind: "mission" }),
      item({ id: "b2", engineId: "business", source: "business_knowledge", score: 0.9 })
    ];

    const ranked = mergeAndRank(items, 2);

    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.entityId).toBe("m1");
  });

  it("returns everything when the cap is zero or negative", () => {
    const items = [item({ id: "b1", engineId: "business", source: "business_knowledge" })];

    expect(mergeAndRank(items, 0)).toHaveLength(1);
  });

  it("reports the engines and entities behind a merged list", () => {
    const items = mergeAndRank(
      [
        item({ id: "b1", engineId: "business", source: "business_knowledge" }),
        item({ id: "b1", engineId: "knowledge_graph", source: "business_knowledge" })
      ],
      10
    );

    expect([...contributingEngines(items)].sort()).toEqual(["business", "knowledge_graph"]);
    expect(entityIdsOf(items)).toEqual(["b1"]);
  });
});
