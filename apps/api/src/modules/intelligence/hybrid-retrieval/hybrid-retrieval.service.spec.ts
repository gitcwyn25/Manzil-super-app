import { CacheService } from "../../cache/cache.service";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import type { RetrievalSource } from "../memory-engine";
import { HybridRetrievalService } from "./hybrid-retrieval.service";
import { RetrievalPipelineService } from "./retrieval-pipeline.service";
import { ContextAssemblyService } from "./context-assembly.service";
import {
  InProcessRetrievalCache,
  RetrievalCacheService,
  SharedRetrievalCache,
  UnavailableRetrievalCacheStore
} from "./retrieval-cache.service";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, payloadOf } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { retrieved } from "./retrieval-outcome";
import { CONTEXT_PACKAGE_SECTIONS, contextPackageSize } from "./context-package";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItemKind
} from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

class FakeClock implements RetrievalClock {
  private ticks = 0;
  private ids = 0;

  now(): string {
    return NOW;
  }

  newId(): string {
    this.ids += 1;
    return `id_${this.ids}`;
  }

  monotonicMs(): number {
    return this.ticks;
  }

  advance(ms: number): void {
    this.ticks += ms;
  }
}

class CountingEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "knowledge_graph";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.knowledge_graph;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.knowledge_graph;
  readonly itemKinds: readonly RetrievalItemKind[] = ["business", "service", "knowledge_node"];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary"];
  calls = 0;

  readonly availability: RetrievalEngineAvailability = {
    available: true,
    backend: "graph",
    unavailableReason: null,
    durable: true
  };

  constructor(
    clock: RetrievalClock,
    private readonly kinds: readonly RetrievalItemKind[] = ["business"]
  ) {
    super(clock);
  }

  protected async runSearch(): Promise<EngineRun> {
    return this.run();
  }

  protected async runLookup(): Promise<EngineRun> {
    return this.run();
  }

  private run(): EngineRun {
    this.calls += 1;

    const items = this.kinds.map((kind, index) =>
      buildItem({
        kind,
        entityId: `${kind}_${index}`,
        engineId: this.id,
        retrievalSource: this.retrievalSource,
        score: buildScore(0.7, ["graph_match"]),
        payload: payloadOf([{ key: "graph.type", value: kind }]),
        confidence: 0.7,
        generatedAt: NOW,
        now: NOW,
        ttlSeconds: null
      })
    );

    return { outcome: retrieved(items, 0.7) };
  }
}

function makeService(kinds?: readonly RetrievalItemKind[]) {
  const clock = new FakeClock();
  const engine = new CountingEngine(clock, kinds);
  const cache = new RetrievalCacheService(
    new InProcessRetrievalCache(),
    new SharedRetrievalCache(new CacheService()),
    clock,
    new UnavailableRetrievalCacheStore()
  );

  const service = new HybridRetrievalService(
    new RetrievalPipelineService([engine], clock, null),
    cache,
    new ContextAssemblyService(clock),
    [engine],
    clock
  );

  return { service, engine, clock };
}

describe("HybridRetrievalService", () => {
  const originalUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  });

  function intent() {
    return {
      kind: "find_provider",
      experienceType: "dinner" as const,
      subjectEntityIds: ["biz_1"],
      serviceIds: [],
      categoryIds: [],
      neighborhoodId: null,
      anchor: null,
      window: null,
      budget: null,
      partySize: null,
      requiredCapabilityKeys: [],
      locale: "en" as const
    };
  }

  it("fills the query defaults so a caller cannot forget the audience or the budget", () => {
    const { service } = makeService();
    const query = service.newQuery({ intent: intent() });

    expect(query.audience).toBe("customer");
    expect(query.budget.cacheEligible).toBe(true);
    expect(query.limits.perEngine).toBeGreaterThan(0);
    expect(query.retrievalId).not.toBe(query.queryId);
  });

  it("runs the pipeline once and serves the second identical question from L1", async () => {
    const { service, engine } = makeService();
    const first = service.newQuery({ intent: intent(), customerId: "cus_1" });
    const second = service.newQuery({ intent: intent(), customerId: "cus_1" });

    const a = await service.retrieve(first);
    const b = await service.retrieve(second);

    expect(engine.calls).toBe(1);
    expect(a.items.map((item) => item.entityId)).toEqual(b.items.map((item) => item.entityId));
  });

  it("rewrites cacheStatus to say how THIS answer was served", async () => {
    const { service } = makeService();
    const query = service.newQuery({ intent: intent(), customerId: "cus_1" });

    expect((await service.retrieve(query)).cacheStatus).toBe("miss");
    expect(
      (await service.retrieve(service.newQuery({ intent: intent(), customerId: "cus_1" }))).cacheStatus
    ).toBe("hit_l1");
  });

  it("does not cache across different questions", async () => {
    const { service, engine } = makeService();

    await service.retrieve(service.newQuery({ intent: intent(), customerId: "cus_1" }));
    await service.retrieve(service.newQuery({ intent: intent(), customerId: "cus_2" }));

    expect(engine.calls).toBe(2);
  });

  it("invalidate() makes the next retrieval run the pipeline again", async () => {
    const { service, engine } = makeService();

    await service.retrieve(service.newQuery({ intent: intent(), customerId: "cus_1" }));
    await service.invalidate();
    await service.retrieve(service.newQuery({ intent: intent(), customerId: "cus_1" }));

    expect(engine.calls).toBe(2);
  });

  it("sorts items into the twelve-box Context Package", async () => {
    const { service } = makeService(["business", "service", "knowledge_node"]);

    const result = await service.retrieveContext(
      service.newQuery({ intent: intent(), customerId: "cus_1" })
    );

    expect(result.context.businesses).toHaveLength(1);
    expect(result.context.services).toHaveLength(1);
    expect(result.context.knowledgeNodes).toHaveLength(1);
    expect(contextPackageSize(result.context)).toBe(result.package.items.length);
    for (const section of CONTEXT_PACKAGE_SECTIONS) {
      expect(Array.isArray(result.context[section])).toBe(true);
    }
  });

  it("assembles into a context window on request, with both halves visible", async () => {
    const { service } = makeService(["business", "service", "knowledge_node"]);

    const result = await service.retrieveAssembled(
      service.newQuery({ intent: intent(), customerId: "cus_1" }),
      { maxTokens: 100_000, reservedForResponseTokens: 1000 }
    );

    expect(result.assembly.truncatedItems).toEqual([]);
    expect(result.assembly.includedItems).toHaveLength(result.package.items.length);
    expect(result.assembly.plan.withinBudget).toBe(true);
  });

  it("reports health without running a retrieval", () => {
    const { service, engine } = makeService();
    const health = service.health();

    expect(health.engines).toHaveLength(1);
    expect(health.availableEngines).toBe(1);
    expect(health.cacheTiers).toEqual({ l1: true, l2: true, l3: false });
    expect(health.l2Shared).toBe(false);
    expect(engine.calls).toBe(0);
  });

  it("exposes the plan a query would run", () => {
    const { service } = makeService();
    const plan = service.plan(service.newQuery({ intent: intent(), customerId: "cus_1" }));

    expect(plan.steps.map((step) => step.engineId)).toEqual(["knowledge_graph"]);
    expect(plan.parallel).toBe(true);
  });
});
