import { CacheService } from "../../cache/cache.service";
import type { AnyIntelligenceEvent, IntelligenceJob, IntelligenceMetric } from "../core";
import {
  HybridRetrievalJobs,
  RETRIEVAL_INVALIDATION_TRIGGERS
} from "./hybrid-retrieval.jobs";
import {
  InProcessRetrievalCache,
  RetrievalCacheService,
  SharedRetrievalCache,
  UnavailableRetrievalCacheStore
} from "./retrieval-cache.service";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { DEFAULT_RETRIEVAL_LIMITS, type RetrievalPackage, type RetrievalQuery } from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

class FakeClock implements RetrievalClock {
  private ids = 0;

  now(): string {
    return NOW;
  }

  newId(): string {
    this.ids += 1;
    return `evt_${this.ids}`;
  }

  monotonicMs(): number {
    return 0;
  }
}

function job(key = "idem_1"): IntelligenceJob<"InvalidateRetrievalCacheJob"> {
  return {
    jobId: "job_1",
    name: "InvalidateRetrievalCacheJob",
    payload: { scope: "entities", entityIds: ["biz_1"] },
    idempotencyKey: key,
    correlationId: "cor_1",
    causationEventId: "cause_1",
    requestedAt: NOW
  };
}

function query(): RetrievalQuery {
  return {
    retrievalId: "ret_1",
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: null,
    reasoningSessionId: null,
    audience: "customer",
    intent: {
      kind: "find_provider",
      experienceType: null,
      subjectEntityIds: [],
      serviceIds: [],
      categoryIds: [],
      neighborhoodId: null,
      anchor: null,
      window: null,
      budget: null,
      partySize: null,
      requiredCapabilityKeys: [],
      locale: null
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
    requestedAt: NOW
  };
}

function pkg(): RetrievalPackage {
  return {
    retrievalId: "ret_1",
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: null,
    items: [],
    diagnostics: {
      retrievalId: "ret_1",
      queryId: "qry_1",
      workspaceId: null,
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

describe("InvalidateRetrievalCacheJob", () => {
  const originalUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  });

  function makeJobs() {
    const clock = new FakeClock();
    const cache = new RetrievalCacheService(
      new InProcessRetrievalCache(),
      new SharedRetrievalCache(new CacheService()),
      clock,
      new UnavailableRetrievalCacheStore()
    );
    const published: AnyIntelligenceEvent[] = [];
    const metrics: IntelligenceMetric[] = [];

    const jobs = new HybridRetrievalJobs(
      cache,
      clock,
      {
        publish: async (event) => void published.push(event as AnyIntelligenceEvent)
      },
      { record: (metric) => void metrics.push(metric) }
    );

    return { jobs, cache, published, metrics };
  }

  it("actually drops the cache", async () => {
    const { jobs, cache } = makeJobs();
    await cache.write(query(), pkg());

    await jobs.invalidate(job());

    expect((await cache.read(query())).status).toBe("miss");
  });

  it("announces rather than delivers — ids and a timestamp, never the packages", async () => {
    const { jobs, published } = makeJobs();
    const result = await jobs.invalidate(job());

    expect(published).toHaveLength(1);
    expect(result.event.eventType).toBe("RetrievalCacheInvalidated");
    expect(result.event.eventVersion).toBe(1);
    expect(result.event.correlationId).toBe("cor_1");
    expect(result.event.causationId).toBe("cause_1");
    expect(result.event.payload).toEqual({
      scope: "entities",
      entityIds: ["biz_1"],
      invalidatedAt: NOW
    });
  });

  it("replays on redelivery instead of publishing a second event (doc 23 §4)", async () => {
    const { jobs, published } = makeJobs();

    const first = await jobs.invalidate(job());
    const second = await jobs.invalidate(job());

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.event.eventId).toBe(first.event.eventId);
    expect(published).toHaveLength(1);
  });

  it("treats a different idempotency key as a different operation", async () => {
    const { jobs, published } = makeJobs();

    await jobs.invalidate(job("idem_1"));
    await jobs.invalidate(job("idem_2"));

    expect(published).toHaveLength(2);
  });

  it("records execution time", async () => {
    const { jobs, metrics } = makeJobs();
    await jobs.invalidate(job());

    expect(metrics.some((metric) => metric.kind === "execution_time")).toBe(true);
  });

  it("runs without a publisher, because Epic 03.5 has not shipped", async () => {
    const clock = new FakeClock();
    const cache = new RetrievalCacheService(
      new InProcessRetrievalCache(),
      new SharedRetrievalCache(new CacheService()),
      clock,
      new UnavailableRetrievalCacheStore()
    );

    const jobs = new HybridRetrievalJobs(cache, clock);
    const result = await jobs.invalidate(job());

    // The event is still built, so the chain is asserted today and turns on
    // the moment a publisher is bound.
    expect(result.event.eventType).toBe("RetrievalCacheInvalidated");
  });
});

describe("invalidation triggers, as data", () => {
  it("covers the tail of the canonical chain", () => {
    expect([...RETRIEVAL_INVALIDATION_TRIGGERS]).toEqual([
      "KnowledgeGraphUpdated",
      "MemoryUpdated",
      "RecommendationsInvalidated"
    ]);
  });

  it("does not double-invalidate on BusinessSummaryCompleted", () => {
    // It is followed by KnowledgeGraphUpdated in the canonical chain, so acting
    // on both would invalidate twice for one change.
    expect(HybridRetrievalJobs.invalidatesRetrieval("BusinessSummaryCompleted")).toBe(false);
    expect(HybridRetrievalJobs.invalidatesRetrieval("MemoryUpdated")).toBe(true);
  });
});
