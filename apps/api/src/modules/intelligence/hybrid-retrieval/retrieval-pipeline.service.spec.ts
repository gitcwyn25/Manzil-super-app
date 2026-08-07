import type { EntityId, IntelligenceMetric } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import type { RetrievalSource } from "../memory-engine";
import { RetrievalPipelineService } from "./retrieval-pipeline.service";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, payloadOf, RETRIEVAL_FACT_KEYS } from "./retrieval-item";
import { buildScore, mergeReasonCodes } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import {
  DEFAULT_RETRIEVAL_LIMITS,
  type HydrationLevel,
  type RetrievalEngineId,
  type RetrievalItem,
  type RetrievalItemKind,
  type RetrievalQuery,
  type RetrievalScalar
} from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

class FakeClock implements RetrievalClock {
  private ticks = 0;

  now(): string {
    return NOW;
  }

  newId(): string {
    return "id_1";
  }

  monotonicMs(): number {
    this.ticks += 1;
    return this.ticks;
  }
}

interface FakeEngineOptions {
  readonly id: RetrievalEngineId;
  readonly entityIds?: readonly EntityId[];
  readonly kind?: RetrievalItemKind;
  readonly available?: boolean;
  readonly refuse?: boolean;
  readonly throws?: boolean;
  readonly score?: number;
  readonly facts?: Readonly<Record<string, RetrievalScalar | readonly RetrievalScalar[]>>;
  readonly hydrationLevels?: readonly HydrationLevel[];
  /** Adds a trust score to every business item — the cross-engine scoring case. */
  readonly addsTrust?: number;
}

class FakeEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId;
  readonly retrievalSource: RetrievalSource | null;
  readonly contextSection: ContextSection;
  readonly itemKinds: readonly RetrievalItemKind[];
  readonly hydrationLevels: readonly HydrationLevel[];
  searchCalls = 0;
  lookupCalls = 0;
  hydrateCalls = 0;

  constructor(
    clock: RetrievalClock,
    private readonly options: FakeEngineOptions
  ) {
    super(clock);
    this.id = options.id;
    this.retrievalSource = ENGINE_RETRIEVAL_SOURCE[options.id];
    this.contextSection = ENGINE_CONTEXT_SECTION[options.id];
    this.itemKinds = [options.kind ?? "business"];
    this.hydrationLevels = options.hydrationLevels ?? ["summary"];
  }

  get availability(): RetrievalEngineAvailability {
    const available = this.options.available !== false;
    return {
      available,
      backend: available ? "graph" : "none",
      unavailableReason: available ? null : `test.${this.id}`,
      durable: false
    };
  }

  protected async runSearch(): Promise<EngineRun> {
    this.searchCalls += 1;
    return this.run();
  }

  protected async runLookup(): Promise<EngineRun> {
    this.lookupCalls += 1;
    return this.run();
  }

  override async hydrate(
    items: readonly RetrievalItem[],
    level: HydrationLevel
  ): Promise<readonly RetrievalItem[]> {
    this.hydrateCalls += 1;
    return items.map((item) => ({ ...item, hydration: level }));
  }

  override async score(items: readonly RetrievalItem[]): Promise<readonly RetrievalItem[]> {
    const trust = this.options.addsTrust;
    if (trust === undefined) return items;

    return items.map((item) =>
      item.kind === "business"
        ? {
            ...item,
            score: {
              ...item.score,
              businessTrustScore: trust,
              reasonCodes: mergeReasonCodes(item.score.reasonCodes, ["trusted_provider"])
            }
          }
        : item
    );
  }

  private run(): EngineRun {
    if (this.options.throws) throw new Error("boom");
    if (this.options.refuse) {
      return { outcome: refuseUnavailableFeature(`test.${this.id}`, NOW) };
    }

    const items = (this.options.entityIds ?? []).map((entityId) =>
      buildItem({
        kind: this.options.kind ?? "business",
        entityId,
        engineId: this.id,
        retrievalSource: this.retrievalSource,
        score: buildScore(this.options.score ?? 0.5, ["graph_match"]),
        payload: payloadOf(
          Object.entries(this.options.facts ?? {}).map(([key, value]) => ({ key, value }))
        ),
        confidence: 0.5,
        generatedAt: NOW,
        now: NOW,
        ttlSeconds: null
      })
    );

    return { outcome: retrieved(items, 0.5) };
  }
}

function query(overrides: Partial<RetrievalQuery> = {}): RetrievalQuery {
  return {
    retrievalId: "ret_1",
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: "wsp_1",
    reasoningSessionId: null,
    audience: "customer",
    intent: {
      kind: "find_provider",
      experienceType: "dinner",
      subjectEntityIds: ["biz_1"],
      serviceIds: [],
      categoryIds: [],
      neighborhoodId: null,
      anchor: null,
      window: null,
      budget: null,
      partySize: null,
      requiredCapabilityKeys: [],
      locale: "en"
    },
    filters: [],
    limits: DEFAULT_RETRIEVAL_LIMITS,
    budget: {
      estimatedTokens: null,
      estimatedLatencyMs: null,
      estimatedCost: null,
      cacheEligible: true,
      priority: "background"
    },
    requestedAt: NOW,
    ...overrides
  };
}

function pipelineOf(engines: readonly FakeEngine[], metrics?: IntelligenceMetric[]) {
  const sink = metrics ? { record: (metric: IntelligenceMetric) => void metrics.push(metric) } : null;
  return new RetrievalPipelineService(engines, new FakeClock(), sink);
}

describe("fan-out", () => {
  it("calls every planned engine and merges their answers", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1", "biz_2"]
    });
    const business = new FakeEngine(new FakeClock(), { id: "business", entityIds: ["biz_2"] });

    const result = await pipelineOf([graph, business]).run(query());

    expect(graph.lookupCalls).toBe(1);
    expect(business.lookupCalls).toBe(1);
    expect(result.items.map((item) => item.entityId).sort()).toEqual(["biz_1", "biz_2"]);
  });

  it("dedupes across engines — one entity, one item, two contributors", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", entityIds: ["biz_1"] });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.items).toHaveLength(1);
    expect([...result.items[0]!.contributingEngineIds].sort()).toEqual([
      "business",
      "knowledge_graph"
    ]);
  });

  it("ranks the merged list by source priority, not by score", async () => {
    const memory = new FakeEngine(new FakeClock(), {
      id: "memory",
      entityIds: ["mem_1"],
      kind: "mission",
      score: 0.1
    });
    const business = new FakeEngine(new FakeClock(), {
      id: "business",
      entityIds: ["biz_1"],
      score: 0.99
    });

    const result = await pipelineOf([memory, business]).run(query());

    expect(result.items.map((item) => item.entityId)).toEqual(["mem_1", "biz_1"]);
  });

  it("caps the merged list at limits.total", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["a", "b", "c", "d"]
    });

    const result = await pipelineOf([graph]).run(
      query({ limits: { ...DEFAULT_RETRIEVAL_LIMITS, total: 2 } })
    );

    expect(result.items).toHaveLength(2);
  });
});

describe("failure handling — continue with the rest", () => {
  it("keeps the answers of the engines that worked", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", refuse: true });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.items).toHaveLength(1);
    expect(result.failedEngines.map((entry) => entry.engineId)).toEqual(["business"]);
  });

  it("marks the package partial and warns with a typed cause", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", refuse: true });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.partialResults).toBe(true);
    expect(result.warnings.some((warning) => warning.engineId === "business")).toBe(true);
    expect(result.failedEngines[0]!.failure.error.kind).toBe("feature_unavailable");
  });

  it("survives an engine that throws, recording a reasoning_failure", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", throws: true });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.items).toHaveLength(1);
    expect(result.failedEngines[0]!.failure.error.kind).toBe("reasoning_failure");
  });

  it("records the failure to the metrics sink by taxonomy kind, never by message", async () => {
    const metrics: IntelligenceMetric[] = [];
    const business = new FakeEngine(new FakeClock(), { id: "business", throws: true });

    await pipelineOf([business], metrics).run(query());

    const failures = metrics.filter((metric) => metric.kind === "failure");
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ operation: "retrieval.business", errorKind: "reasoning_failure" });
  });

  it("does not mark a package partial when every planned engine answered", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", entityIds: ["biz_1"] });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.partialResults).toBe(false);
    expect(result.failedEngines).toEqual([]);
  });

  it("skips an unavailable engine at plan time rather than calling it", async () => {
    const semantic = new FakeEngine(new FakeClock(), { id: "semantic", available: false });
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });

    const result = await pipelineOf([graph, semantic]).run(query());

    expect(semantic.searchCalls).toBe(0);
    expect(result.diagnostics.enginesSkipped).toContain("semantic");
    // A planned skip is not a failure.
    expect(result.failedEngines).toEqual([]);
  });
});

describe("filters and permissions", () => {
  it("drops items a hard filter rejects", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1"],
      facts: { [RETRIEVAL_FACT_KEYS.distanceKm]: 40 }
    });

    const result = await pipelineOf([graph]).run(
      query({ filters: [{ kind: "distance", mode: "hard", maxKm: 5 }] })
    );

    expect(result.items).toEqual([]);
  });

  it("refuses the whole query when a customer sets an internal-only filter", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });

    const result = await pipelineOf([graph]).run(
      query({ filters: [{ kind: "premium_only", mode: "hard" }] })
    );

    expect(result.items).toEqual([]);
    expect(result.partialResults).toBe(true);
    expect(result.cacheStatus).toBe("uncacheable");
    expect(result.warnings[0]!.failure.error.kind).toBe("permission_denied");
    // Never a partial answer: the difference would leak the filter's shape.
    expect(graph.lookupCalls).toBe(0);
  });

  it("permits the same filter for an internal principal", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1"],
      facts: { [RETRIEVAL_FACT_KEYS.premium]: true }
    });

    const result = await pipelineOf([graph]).run(
      query({ audience: "internal", filters: [{ kind: "premium_only", mode: "hard" }] })
    );

    expect(result.items).toHaveLength(1);
  });
});

describe("cross-engine scoring", () => {
  it("lets one engine score another's find — the reason score() is on the contract", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), { id: "business", addsTrust: 0.82 });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.items[0]!.score.businessTrustScore).toBe(0.82);
    expect(result.items[0]!.score.reasonCodes).toContain("trusted_provider");
  });

  it("does not ask an unavailable engine to score", async () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const business = new FakeEngine(new FakeClock(), {
      id: "business",
      available: false,
      addsTrust: 0.9
    });

    const result = await pipelineOf([graph, business]).run(query());

    expect(result.items[0]!.score.businessTrustScore).toBeNull();
  });
});

describe("hydration", () => {
  it("expands only when a deeper level was asked for", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1"],
      hydrationLevels: ["summary", "services"]
    });

    await pipelineOf([graph]).run(query());
    expect(graph.hydrateCalls).toBe(0);

    await pipelineOf([graph]).run(
      query({ limits: { ...DEFAULT_RETRIEVAL_LIMITS, hydrateTo: "services" } })
    );
    expect(graph.hydrateCalls).toBe(1);
  });

  it("asks only engines that declare the level, and warns when nothing could expand", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1"],
      hydrationLevels: ["summary"]
    });

    const result = await pipelineOf([graph]).run(
      query({ limits: { ...DEFAULT_RETRIEVAL_LIMITS, hydrateTo: "analytics" } })
    );

    expect(graph.hydrateCalls).toBe(0);
    expect(result.warnings.some((warning) => warning.scopeKey === "hydration:analytics")).toBe(true);
  });
});

describe("diagnostics", () => {
  it("reports the full observability record the epic specifies", async () => {
    const graph = new FakeEngine(new FakeClock(), {
      id: "knowledge_graph",
      entityIds: ["biz_1", "biz_2"]
    });

    const result = await pipelineOf([graph]).run(query());

    expect(result.diagnostics).toMatchObject({
      retrievalId: "ret_1",
      queryId: "qry_1",
      workspaceId: "wsp_1",
      customerId: "cus_1",
      entitiesRetrieved: 2
    });
    expect(result.diagnostics.enginesUsed).toContain("knowledge_graph");
    expect(result.diagnostics.executionMs).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.cacheHits + result.diagnostics.cacheMisses).toBeGreaterThan(0);
  });

  it("records an execution_time metric for the whole run", async () => {
    const metrics: IntelligenceMetric[] = [];
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });

    await pipelineOf([graph], metrics).run(query());

    expect(metrics.some((metric) => metric.kind === "execution_time")).toBe(true);
  });

  it("exposes the plan without running it", () => {
    const graph = new FakeEngine(new FakeClock(), { id: "knowledge_graph", entityIds: ["biz_1"] });
    const pipeline = pipelineOf([graph]);

    expect(pipeline.plan(query()).steps.map((step) => step.engineId)).toEqual(["knowledge_graph"]);
    expect(graph.lookupCalls).toBe(0);
    expect(pipeline.installedEngines).toHaveLength(1);
  });
});
