import { CONTEXT_ASSEMBLY_PRIORITY } from "../orchestrator-contracts/context-window.contract";
import {
  ASSEMBLY_SAFETY_FACTOR,
  ContextAssemblyService,
  assignableTokens,
  estimateSectionTokens,
  estimateTokens,
  itemTokenCosts,
  toSectionInputs
} from "./context-assembly.service";
import { buildItem, payloadOf } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import type {
  RetrievalEngineId,
  RetrievalItem,
  RetrievalPackage
} from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

const clock: RetrievalClock = {
  now: () => NOW,
  newId: () => "id_1",
  monotonicMs: () => 0
};

function item(id: string, engineId: RetrievalEngineId, factCount = 1): RetrievalItem {
  return buildItem({
    kind: "business",
    entityId: id,
    engineId,
    retrievalSource: null,
    score: buildScore(0.5, ["graph_match"]),
    payload: payloadOf(
      Array.from({ length: factCount }, (_, index) => ({
        key: `fact.${index}`,
        value: "x".repeat(40)
      }))
    ),
    confidence: 0.5,
    generatedAt: NOW,
    now: NOW,
    ttlSeconds: null
  });
}

function pkg(items: readonly RetrievalItem[]): RetrievalPackage {
  return {
    retrievalId: "ret_1",
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: "wsp_1",
    items,
    diagnostics: {
      retrievalId: "ret_1",
      queryId: "qry_1",
      workspaceId: "wsp_1",
      customerId: "cus_1",
      enginesUsed: [],
      enginesSkipped: [],
      executionMs: 0,
      entitiesRetrieved: items.length,
      cacheHits: 0,
      cacheMisses: 0,
      rankingMs: 0,
      hydrationMs: 0
    },
    warnings: [],
    partialResults: false,
    failedEngines: [],
    generatedAt: NOW,
    cacheStatus: "miss"
  };
}

describe("token estimation — an estimate that says it is one", () => {
  it("never returns zero for an item that exists", () => {
    expect(estimateTokens(item("a", "business", 0))).toBeGreaterThan(0);
  });

  it("grows with the payload", () => {
    expect(estimateTokens(item("a", "business", 8))).toBeGreaterThan(
      estimateTokens(item("a", "business", 1))
    );
  });

  it("sums a section from its items", () => {
    const items = [item("a", "business"), item("b", "business")];

    expect(estimateSectionTokens(items)).toBe(items.reduce((n, i) => n + estimateTokens(i), 0));
  });

  it("holds back a safety margin, because the estimate is optimistic for Cyrillic", () => {
    expect(assignableTokens({ maxTokens: 1000, reservedForResponseTokens: 0 })).toBe(
      Math.floor(1000 * ASSEMBLY_SAFETY_FACTOR)
    );
  });

  it("never makes the response reservation assignable", () => {
    expect(assignableTokens({ maxTokens: 100, reservedForResponseTokens: 200 })).toBe(0);
  });

  it("exposes per-item costs so a caller can audit an allocation", () => {
    const costs = itemTokenCosts(pkg([item("a", "business")]));

    expect(costs.get("a")).toBe(estimateTokens(item("a", "business")));
  });
});

describe("toSectionInputs — the package projected into the eight sections", () => {
  it("maps each engine's items into its declared section", () => {
    const sections = toSectionInputs(
      pkg([item("w", "workspace"), item("b", "business"), item("f", "feature_store")])
    );

    expect(sections.map((section) => section.section)).toEqual([
      "workspace",
      "business",
      "summaries"
    ]);
  });

  it("orders sections by the frozen assembly priority", () => {
    const sections = toSectionInputs(
      pkg([item("s", "semantic"), item("w", "workspace"), item("m", "memory")])
    );

    expect(sections.map((section) => section.section)).toEqual(["workspace", "memory", "llm"]);
  });
});

describe("plan — priority-ordered, budget-aware, auditable", () => {
  const service = new ContextAssemblyService(clock);

  it("returns an allocation for every one of the eight sections, in the frozen order", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      budget: { maxTokens: 10_000, reservedForResponseTokens: 1000 },
      sections: []
    });

    expect(plan.allocations.map((allocation) => allocation.section)).toEqual([
      ...CONTEXT_ASSEMBLY_PRIORITY
    ]);
  });

  it("gives an offered section everything it asked for when the budget allows", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      budget: { maxTokens: 10_000, reservedForResponseTokens: 0 },
      sections: [{ section: "business", itemIds: ["a", "b"], estimatedTokens: 100 }]
    });

    const business = plan.allocations.find((allocation) => allocation.section === "business")!;

    expect(business.includedItemIds).toEqual(["a", "b"]);
    expect(business.truncatedItemIds).toEqual([]);
    expect(plan.withinBudget).toBe(true);
  });

  it("truncates from the END of the priority list — the LLM's latitude goes first", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      // Assignable = floor(120 * 0.9) = 108: enough for workspace, not for llm.
      budget: { maxTokens: 120, reservedForResponseTokens: 0 },
      sections: [
        { section: "workspace", itemIds: ["w1", "w2"], estimatedTokens: 100 },
        { section: "llm", itemIds: ["l1", "l2"], estimatedTokens: 100 }
      ]
    });

    const workspace = plan.allocations.find((a) => a.section === "workspace")!;
    const llm = plan.allocations.find((a) => a.section === "llm")!;

    expect(workspace.truncatedItemIds).toEqual([]);
    expect(llm.includedItemIds).toEqual([]);
    expect(llm.truncatedItemIds).toEqual(["l1", "l2"]);
  });

  it("never sacrifices the workspace to fit a later section", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      budget: { maxTokens: 100, reservedForResponseTokens: 0 },
      sections: [
        { section: "workspace", itemIds: ["w1"], estimatedTokens: 90 },
        { section: "memory", itemIds: ["m1"], estimatedTokens: 90 }
      ]
    });

    expect(plan.allocations.find((a) => a.section === "workspace")!.includedItemIds).toEqual(["w1"]);
    expect(plan.allocations.find((a) => a.section === "memory")!.truncatedItemIds).toEqual(["m1"]);
  });

  it("keeps the best half of a partially-fitting section, and names the dropped half", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      // Assignable = floor(100 * 0.9) = 90; four items at 25 each ⇒ three fit.
      budget: { maxTokens: 100, reservedForResponseTokens: 0 },
      sections: [{ section: "business", itemIds: ["a", "b", "c", "d"], estimatedTokens: 100 }]
    });

    const business = plan.allocations.find((a) => a.section === "business")!;

    expect(business.includedItemIds).toEqual(["a", "b", "c"]);
    expect(business.truncatedItemIds).toEqual(["d"]);
  });

  it("reports every section, including the two no engine fills", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      budget: { maxTokens: 1000, reservedForResponseTokens: 0 },
      sections: [{ section: "business", itemIds: ["a"], estimatedTokens: 10 }]
    });

    const history = plan.allocations.find((a) => a.section === "history")!;

    expect(history.allocatedTokens).toBe(0);
    expect(history.includedItemIds).toEqual([]);
  });

  it("stays within the assignable budget it reports", async () => {
    const plan = await service.plan({
      reasoningSessionId: "rsn_1",
      budget: { maxTokens: 200, reservedForResponseTokens: 0 },
      sections: CONTEXT_ASSEMBLY_PRIORITY.map((section) => ({
        section,
        itemIds: ["x", "y"],
        estimatedTokens: 100
      }))
    });

    expect(plan.totalAllocatedTokens).toBeLessThanOrEqual(
      assignableTokens({ maxTokens: 200, reservedForResponseTokens: 0 })
    );
    expect(plan.withinBudget).toBe(true);
  });
});

describe("assemble — a package fitted to a window, with both halves visible", () => {
  const service = new ContextAssemblyService(clock);

  it("returns the included items and the truncated ones separately", async () => {
    const items = [item("w1", "workspace", 6), item("s1", "semantic", 6)];
    const result = await service.assemble(
      pkg(items),
      { maxTokens: estimateTokens(items[0]!) + 2, reservedForResponseTokens: 0 },
      "rsn_1"
    );

    expect(result.truncatedItems.map((entry) => entry.entityId)).toContain("s1");
    expect(result.includedItems.length + result.truncatedItems.length).toBe(items.length);
  });

  it("fits everything when the window is generous", async () => {
    const items = [item("w1", "workspace"), item("b1", "business")];
    const result = await service.assemble(
      pkg(items),
      { maxTokens: 100_000, reservedForResponseTokens: 1000 },
      null
    );

    expect(result.truncatedItems).toEqual([]);
    expect(result.includedItems).toHaveLength(2);
  });

  it("falls back to the retrieval id when there is no reasoning session", async () => {
    const result = await service.assemble(
      pkg([item("b1", "business")]),
      { maxTokens: 100_000, reservedForResponseTokens: 0 },
      null
    );

    expect(result.plan.reasoningSessionId).toBe("ret_1");
    expect(result.assembledAt).toBe(NOW);
  });
});
