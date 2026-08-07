import {
  CONTEXT_PACKAGE_SECTION,
  CONTEXT_PACKAGE_SECTIONS,
  contextPackageSize,
  emptyContextPackage,
  sectionItems,
  toContextPackage
} from "./context-package";
import { buildItem, payloadOf, retrievalItemId, parseRetrievalItemId, freshnessOf } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import type { RetrievalItem, RetrievalItemKind } from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

function item(kind: RetrievalItemKind, id: string, score = 0.5): RetrievalItem {
  return buildItem({
    kind,
    entityId: id,
    engineId: "knowledge_graph",
    retrievalSource: "business_knowledge",
    score: buildScore(score, ["graph_match"]),
    payload: payloadOf([{ key: "graph.type", value: kind }]),
    confidence: 0.5,
    generatedAt: NOW,
    now: NOW,
    ttlSeconds: null
  });
}

describe("the Context Package has exactly the twelve sections the epic names", () => {
  it("maps every item kind to a home section", () => {
    const kinds = Object.keys(CONTEXT_PACKAGE_SECTION) as RetrievalItemKind[];

    expect(kinds).toHaveLength(12);
    for (const kind of kinds) {
      expect(CONTEXT_PACKAGE_SECTIONS).toContain(CONTEXT_PACKAGE_SECTION[kind]);
    }
  });

  it("uses each section exactly once", () => {
    const sections = Object.values(CONTEXT_PACKAGE_SECTION);

    expect(new Set(sections).size).toBe(sections.length);
    expect(CONTEXT_PACKAGE_SECTIONS).toHaveLength(12);
  });

  it("starts every section present and empty, never undefined", () => {
    const empty = emptyContextPackage("ret_1", NOW);

    for (const section of CONTEXT_PACKAGE_SECTIONS) {
      expect(empty[section]).toEqual([]);
    }
    expect(contextPackageSize(empty)).toBe(0);
  });

  it("sorts items into their boxes", () => {
    const pkg = toContextPackage(
      "ret_1",
      [
        item("business", "biz_1"),
        item("alternative", "biz_2"),
        item("mission", "mis_1"),
        item("feature", "feat_1")
      ],
      NOW
    );

    expect(pkg.businesses.map((entry) => entry.entityId)).toEqual(["biz_1"]);
    expect(pkg.alternativeCandidates.map((entry) => entry.entityId)).toEqual(["biz_2"]);
    expect(pkg.missionContext.map((entry) => entry.entityId)).toEqual(["mis_1"]);
    expect(pkg.featureValues.map((entry) => entry.entityId)).toEqual(["feat_1"]);
    expect(contextPackageSize(pkg)).toBe(4);
  });

  it("preserves the ranked order inside each section", () => {
    const pkg = toContextPackage(
      "ret_1",
      [item("business", "best", 0.9), item("business", "worst", 0.1)],
      NOW
    );

    expect(pkg.businesses.map((entry) => entry.entityId)).toEqual(["best", "worst"]);
    expect(sectionItems(pkg, "businesses")).toBe(pkg.businesses);
  });
});

describe("item identity and freshness", () => {
  it("derives identity from kind and entity, so two engines collide", () => {
    expect(retrievalItemId("business", "biz_1")).toBe("business:biz_1");
    expect(item("business", "biz_1").retrievalItemId).toBe("business:biz_1");
  });

  it("round-trips an item id", () => {
    expect(parseRetrievalItemId("business:biz_1")).toEqual({ kind: "business", entityId: "biz_1" });
    expect(parseRetrievalItemId("nocolon")).toBeNull();
    expect(parseRetrievalItemId(":leading")).toBeNull();
    expect(parseRetrievalItemId("trailing:")).toBeNull();
  });

  it("keeps ids with colons in them intact — only the first separator counts", () => {
    expect(parseRetrievalItemId("business:urn:biz:1")).toEqual({
      kind: "business",
      entityId: "urn:biz:1"
    });
  });

  it("measures freshness against a declared TTL, and reports null for sources that do not rot", () => {
    const fresh = freshnessOf(NOW, NOW, 60);
    expect(fresh.ageSeconds).toBe(0);
    expect(fresh.stale).toBe(false);

    const stale = freshnessOf("2026-08-07T11:00:00.000Z", NOW, 60);
    expect(stale.ageSeconds).toBe(3600);
    expect(stale.stale).toBe(true);

    const structural = freshnessOf("2020-01-01T00:00:00.000Z", NOW, null);
    expect(structural.stale).toBe(false);
    expect(structural.ttlSeconds).toBeNull();
  });

  it("does not go negative or NaN on an unparseable timestamp", () => {
    expect(freshnessOf("not-a-date", NOW, 60).ageSeconds).toBe(0);
    expect(freshnessOf(NOW, "2020-01-01T00:00:00.000Z", 60).ageSeconds).toBe(0);
  });

  it("sorts payload facts so an item does not depend on the order it was learned", () => {
    const payload = payloadOf(
      [
        { key: "z.last", value: 1 },
        null,
        { key: "a.first", value: 2 }
      ],
      ["b", "a", "b"]
    );

    expect(payload.facts.map((entry) => entry.key)).toEqual(["a.first", "z.last"]);
    expect(payload.relatedEntityIds).toEqual(["a", "b"]);
  });
});
