import { CacheService } from "../../cache/cache.service";
import {
  InProcessRetrievalCache,
  MAX_L1_ENTRIES,
  RETRIEVAL_CACHE_TTL,
  RetrievalCacheService,
  SharedRetrievalCache,
  UnavailableRetrievalCacheStore,
  retrievalCacheKey
} from "./retrieval-cache.service";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { DEFAULT_RETRIEVAL_LIMITS, type RetrievalPackage, type RetrievalQuery } from "./hybrid-retrieval.types";

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
      subjectEntityIds: ["biz_2", "biz_1"],
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

function pkg(retrievalId = "ret_1"): RetrievalPackage {
  return {
    retrievalId,
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: "wsp_1",
    items: [],
    diagnostics: {
      retrievalId,
      queryId: "qry_1",
      workspaceId: "wsp_1",
      customerId: "cus_1",
      enginesUsed: [],
      enginesSkipped: [],
      executionMs: 0,
      entitiesRetrieved: 0,
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

/**
 * Production runs with **no Redis provisioned**, so the in-memory fallback is
 * not a development convenience — it is the path that serves real traffic.
 * These tests run exactly that path, as Epics 05 and 06 do.
 */
describe("retrievalCacheKey — the question, never the call", () => {
  const originalUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  });

  it("ignores the ids that identify the call rather than the question", () => {
    expect(retrievalCacheKey(query({ retrievalId: "ret_9", queryId: "qry_9" }))).toBe(
      retrievalCacheKey(query())
    );
  });

  it("is stable under subject reordering — the same set is the same question", () => {
    const reordered = query({
      intent: { ...query().intent, subjectEntityIds: ["biz_1", "biz_2"] }
    });

    expect(retrievalCacheKey(reordered)).toBe(retrievalCacheKey(query()));
  });

  it("separates different customers", () => {
    expect(retrievalCacheKey(query({ customerId: "cus_2" }))).not.toBe(retrievalCacheKey(query()));
  });

  it("separates different audiences, because they may see different answers", () => {
    expect(retrievalCacheKey(query({ audience: "internal" }))).not.toBe(retrievalCacheKey(query()));
  });

  it("separates different budget priorities, because they produce different plans", () => {
    const interactive = query({ budget: { ...query().budget, priority: "interactive" } });

    expect(retrievalCacheKey(interactive)).not.toBe(retrievalCacheKey(query()));
  });

  it("canonicalizes the filter set so order cannot fork the cache", () => {
    const forward = query({
      filters: [
        { kind: "distance", mode: "hard", maxKm: 5 },
        { kind: "verified_only", mode: "hard" }
      ]
    });
    const backward = query({
      filters: [
        { kind: "verified_only", mode: "hard" },
        { kind: "distance", mode: "hard", maxKm: 5 }
      ]
    });

    expect(retrievalCacheKey(forward)).toBe(retrievalCacheKey(backward));
  });

  it("separates different filter parameters", () => {
    const near = query({ filters: [{ kind: "distance", mode: "hard", maxKm: 1 }] });
    const far = query({ filters: [{ kind: "distance", mode: "hard", maxKm: 50 }] });

    expect(retrievalCacheKey(near)).not.toBe(retrievalCacheKey(far));
  });
});

describe("L1 — in-process, bounded, TTL'd", () => {
  it("serves the second read from cache", () => {
    const l1 = new InProcessRetrievalCache();
    l1.write("k", pkg(), 60, 0);

    expect(l1.read("k", 0)).not.toBeNull();
  });

  it("expires entries, because a stale package is a confident wrong answer", () => {
    const l1 = new InProcessRetrievalCache();
    l1.write("k", pkg(), 60, 0);

    expect(l1.read("k", 61_000)).toBeNull();
  });

  it("evicts FIFO rather than growing without bound", () => {
    const l1 = new InProcessRetrievalCache();

    for (let index = 0; index <= MAX_L1_ENTRIES; index += 1) {
      l1.write(`k${index}`, pkg(`ret_${index}`), 60, 0);
    }

    expect(l1.size).toBe(MAX_L1_ENTRIES);
    expect(l1.read("k0", 0)).toBeNull();
  });

  it("refreshing an existing key does not cost another entry its slot", () => {
    const l1 = new InProcessRetrievalCache();

    for (let index = 0; index < MAX_L1_ENTRIES; index += 1) {
      l1.write(`k${index}`, pkg(), 60, 0);
    }
    l1.write("k0", pkg("ret_new"), 60, 0);

    expect(l1.size).toBe(MAX_L1_ENTRIES);
    expect(l1.read("k1", 0)).not.toBeNull();
  });
});

describe("L3 — the persistent tier, honestly absent until M1", () => {
  it("reports itself unavailable rather than throwing", async () => {
    const l3 = new UnavailableRetrievalCacheStore();

    expect(l3.available).toBe(false);
    expect(l3.durable).toBe(false);
    await expect(l3.read()).resolves.toBeNull();
    await expect(l3.write()).resolves.toBeUndefined();
    await expect(l3.invalidate()).resolves.toBeUndefined();
  });

  it("names a typed cause a caller could surface", () => {
    const failure = new UnavailableRetrievalCacheStore().failure(NOW);

    expect(failure.error.kind).toBe("tool_unavailable");
    expect(failure.retryable).toBe(false);
  });
});

describe("RetrievalCacheService", () => {
  const originalUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  });

  function makeService() {
    const clock = new FakeClock();
    const service = new RetrievalCacheService(
      new InProcessRetrievalCache(),
      new SharedRetrievalCache(new CacheService()),
      clock,
      new UnavailableRetrievalCacheStore()
    );
    return { service, clock };
  }

  it("reports which tiers actually exist — L3 is false until M1", () => {
    const { service } = makeService();

    expect(service.tiers).toEqual({ l1: true, l2: true, l3: false });
  });

  it("does not claim a shared L2 while Redis is absent", () => {
    const { service } = makeService();

    expect(service.l2Shared).toBe(false);
  });

  it("misses, then hits L1 after a write", async () => {
    const { service } = makeService();

    expect((await service.read(query())).status).toBe("miss");

    await service.write(query(), pkg());
    const second = await service.read(query());

    expect(second.status).toBe("hit_l1");
    expect(second.package).not.toBeNull();
  });

  it("expires the L1 entry after its TTL", async () => {
    const { service, clock } = makeService();
    await service.write(query(), pkg());

    clock.advance((RETRIEVAL_CACHE_TTL.package + 1) * 1000);

    expect((await service.read(query())).status).toBe("miss");
  });

  it("bypasses entirely when the caller declared itself cache-ineligible", async () => {
    const { service } = makeService();
    const ineligible = query({ budget: { ...query().budget, cacheEligible: false } });

    await service.write(ineligible, pkg());

    expect((await service.read(ineligible)).status).toBe("bypass");
  });

  it("keeps different questions apart", async () => {
    const { service } = makeService();
    await service.write(query(), pkg());

    expect((await service.read(query({ customerId: "cus_2" }))).status).toBe("miss");
  });

  it("serves engine candidate id lists through L2, read-through", async () => {
    const { service } = makeService();
    const loader = jest.fn().mockResolvedValue(["biz_1", "biz_2"]);

    const first = await service.readEngineIds("providers:haircut", 300, loader);
    const second = await service.readEngineIds("providers:haircut", 300, loader);

    expect(first).toEqual(second);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("invalidate() clears every tier and is idempotent", async () => {
    const { service } = makeService();
    await service.write(query(), pkg());

    await service.invalidate();
    await service.invalidate();

    expect((await service.read(query())).status).toBe("miss");
  });

  it("reports the entities a cached package covered", () => {
    expect(RetrievalCacheService.entityIdsOf(pkg())).toEqual([]);
  });
});
