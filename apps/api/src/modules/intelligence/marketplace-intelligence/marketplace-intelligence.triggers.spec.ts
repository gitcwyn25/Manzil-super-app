import type { IntelligenceEvent } from "../core";
import {
  JOB_FOR_KIND,
  MarketplaceIntelligenceTriggers,
  MAX_PLANNED_JOBS
} from "./marketplace-intelligence.triggers";
import { SummaryRepository } from "./summary.repository";
import { InProcessSummaryStore } from "./intelligence-summary.store";
import { SUMMARY_KINDS } from "./marketplace-intelligence.slots";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";

const NOW = "2026-08-07T09:00:00.000Z";
const LATER = "2026-08-09T09:00:00.000Z";

function makeClock(now = NOW): MarketplaceClock & { set(at: string): void } {
  let current = now;
  let sequence = 0;

  return {
    now: () => current,
    newId: () => `id_${(sequence += 1)}`,
    set: (at: string) => {
      current = at;
    }
  };
}

function makeTriggers(
  options: {
    businessIds?: string[];
    neighborhoodIds?: string[];
    serviceIds?: string[];
    customerIds?: string[];
    executor?: boolean;
    subscriber?: boolean;
  } = {}
) {
  const clock = makeClock();
  const store = new InProcessSummaryStore();
  const repository = new SummaryRepository(store);

  const projection = {
    businessIds: jest.fn().mockResolvedValue(options.businessIds ?? []),
    neighborhoodIds: jest.fn().mockResolvedValue(options.neighborhoodIds ?? []),
    serviceIds: jest.fn().mockResolvedValue(options.serviceIds ?? []),
    customerSubjectIds: jest.fn().mockResolvedValue(options.customerIds ?? [])
  };

  const executor = { enqueue: jest.fn().mockResolvedValue({ accepted: true }), status: jest.fn() };
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
  const subscriptions = new Map<string, (event: unknown) => Promise<void>>();
  const subscriber = {
    subscribe: jest.fn(async (type: string, handler: (event: unknown) => Promise<void>) => {
      subscriptions.set(type, handler);
      return { unsubscribe: async () => undefined };
    })
  };

  const triggers = new MarketplaceIntelligenceTriggers(
    projection as never,
    repository,
    clock,
    options.executor === false ? undefined : (executor as never),
    publisher,
    options.subscriber === false ? undefined : (subscriber as never)
  );

  return { triggers, repository, clock, projection, executor, publisher, subscriber, subscriptions };
}

const created: IntelligenceEvent<"BusinessCreated"> = {
  eventId: "evt_root",
  eventType: "BusinessCreated",
  eventVersion: 1,
  timestamp: NOW,
  aggregateId: "biz_1",
  correlationId: "corr_1",
  causationId: null,
  payload: { businessId: "biz_1" }
};

describe("the job map", () => {
  it("routes every summary kind to a job that refreshes it", () => {
    for (const kind of SUMMARY_KINDS) {
      expect(JOB_FOR_KIND[kind]).toBeTruthy();
    }
  });

  it("routes a kind and its feature vector to the same job", () => {
    expect(JOB_FOR_KIND.business_features).toBe(JOB_FOR_KIND.business);
    expect(JOB_FOR_KIND.customer_features).toBe(JOB_FOR_KIND.customer);
    expect(JOB_FOR_KIND.neighborhood_features).toBe(JOB_FOR_KIND.neighborhood);
    // Demand is measured by the district job, so it refreshes with the district.
    expect(JOB_FOR_KIND.demand).toBe(JOB_FOR_KIND.neighborhood);
  });
});

describe("event-triggered summarization", () => {
  it("continues the canonical chain: created → requested → job", async () => {
    const { triggers, publisher, executor } = makeTriggers();

    const result = await triggers.onBusinessCreated(created);

    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(publisher.publish.mock.calls[0]?.[0]).toMatchObject({
      eventType: "BusinessSummaryRequested",
      aggregateId: "biz_1",
      correlationId: "corr_1",
      causationId: "evt_root",
      payload: { businessId: "biz_1", trigger: "created" }
    });

    expect(result.enqueued).toBe(true);
    expect(executor.enqueue).toHaveBeenCalledTimes(1);
    expect(result.jobs[0]).toMatchObject({
      name: "SummarizeBusinessJob",
      payload: { businessId: "biz_1" },
      correlationId: "corr_1"
    });
  });

  it("announces reviews_changed, the most common reason a profile is wrong", async () => {
    const { triggers, publisher } = makeTriggers();

    await triggers.onReviewsChanged("biz_1");

    expect(publisher.publish.mock.calls[0]?.[0]).toMatchObject({
      eventType: "BusinessSummaryRequested",
      payload: { businessId: "biz_1", trigger: "reviews_changed" }
    });
  });

  it("refreshes health alone when a booking settles", async () => {
    const { triggers, executor } = makeTriggers();

    await triggers.onBookingSettled("biz_1");

    expect(executor.enqueue.mock.calls[0]?.[0]).toMatchObject({
      name: "RefreshBusinessHealthJob",
      payload: { businessId: "biz_1" }
    });
  });

  it("rebuilds a customer after activity, the moment doc 22 names", async () => {
    const { triggers, executor } = makeTriggers();

    await triggers.onCustomerActivity("usr_1");

    expect(executor.enqueue.mock.calls[0]?.[0]).toMatchObject({
      name: "SummarizeCustomerJob",
      payload: { customerId: "usr_1" }
    });
  });

  it("subscribes to the bus when Epic 03.5 provides one", async () => {
    const { triggers, subscriber, subscriptions, executor } = makeTriggers();

    await triggers.register();

    expect(subscriber.subscribe).toHaveBeenCalledTimes(2);
    expect([...subscriptions.keys()].sort()).toEqual([
      "BusinessCreated",
      "BusinessSummaryRequested"
    ]);

    await subscriptions.get("BusinessCreated")?.(created);
    expect(executor.enqueue).toHaveBeenCalled();
  });

  it("is a logged no-op without a subscriber, never a startup failure", async () => {
    const { triggers } = makeTriggers({ subscriber: false });

    await expect(triggers.register()).resolves.toBeUndefined();
  });
});

describe("the nightly plan", () => {
  it("covers subjects that exist but have never been summarized", async () => {
    const { triggers } = makeTriggers({
      businessIds: ["biz_1"],
      neighborhoodIds: ["neighborhood:Tashkent:Yunusobod"],
      serviceIds: ["service-market:haircut"],
      customerIds: ["usr_1"]
    });

    const planned = await triggers.plan(NOW);
    const names = planned.map((job) => `${job.name}:${job.subjectId}`);

    expect(names).toEqual(
      expect.arrayContaining([
        "SummarizeBusinessJob:biz_1",
        "SummarizeCampaignJob:biz_1",
        "RefreshMarketplaceTrendsJob:biz_1",
        "SummarizeNeighborhoodJob:neighborhood:Tashkent:Yunusobod",
        "SummarizeServiceJob:service-market:haircut",
        "SummarizeCustomerJob:usr_1"
      ])
    );
    expect(planned.every((job) => job.reason === "never_summarized")).toBe(true);
  });

  it("covers stored summaries that have aged past their own TTL", async () => {
    const { triggers, repository, clock } = makeTriggers();

    await repository.write({
      slot: { kind: "business", subjectId: "biz_1" },
      value: { businessId: "biz_1" },
      confidence: 0.5,
      sampleSize: 10,
      window: null,
      source: "platform_inference",
      computedAt: NOW
    });

    expect(await triggers.plan(NOW)).toEqual([]);

    clock.set(LATER);
    const planned = await triggers.plan(LATER);

    expect(planned).toEqual([
      { name: "SummarizeBusinessJob", subjectId: "biz_1", reason: "nightly_refresh" }
    ]);
  });

  it("plans one job per subject even when two halves both name it", async () => {
    const { triggers, repository } = makeTriggers({ businessIds: ["biz_1"] });

    await repository.write({
      slot: { kind: "business", subjectId: "biz_1" },
      value: { businessId: "biz_1" },
      confidence: 0.5,
      sampleSize: 10,
      window: null,
      source: "platform_inference",
      computedAt: NOW
    });

    const planned = await triggers.plan(LATER);
    const summarize = planned.filter((job) => job.name === "SummarizeBusinessJob");

    expect(summarize).toHaveLength(1);
    // The stale half is seen first, so its reason wins.
    expect(summarize[0]?.reason).toBe("nightly_refresh");
  });

  it("is bounded, so one pass cannot run away with the marketplace", async () => {
    const { triggers } = makeTriggers({
      businessIds: Array.from({ length: 500 }, (_, index) => `biz_${index}`)
    });

    expect((await triggers.plan(NOW)).length).toBe(MAX_PLANNED_JOBS);
  });
});

describe("enqueueing", () => {
  it("keys idempotency by day, so two reviews an hour apart are one rebuild", async () => {
    const { triggers } = makeTriggers();

    const first = await triggers.onReviewsChanged("biz_1");
    const second = await triggers.onReviewsChanged("biz_1");

    expect(first.jobs[0]?.idempotencyKey).toBe("SummarizeBusinessJob:biz_1:2026-08-07");
    expect(second.jobs[0]?.idempotencyKey).toBe(first.jobs[0]?.idempotencyKey);
  });

  it("gives each job name the payload its catalog entry expects", async () => {
    const { triggers } = makeTriggers({
      businessIds: ["biz_1"],
      neighborhoodIds: ["neighborhood:Tashkent:Yunusobod"],
      serviceIds: ["service-market:haircut"],
      customerIds: ["usr_1"]
    });

    const result = await triggers.nightly(NOW);
    const byName = new Map(result.jobs.map((job) => [job.name, job.payload]));

    expect(byName.get("SummarizeBusinessJob")).toEqual({ businessId: "biz_1" });
    expect(byName.get("SummarizeCustomerJob")).toEqual({ customerId: "usr_1" });
    expect(byName.get("SummarizeNeighborhoodJob")).toEqual({
      neighborhoodId: "neighborhood:Tashkent:Yunusobod"
    });
    expect(byName.get("SummarizeServiceJob")).toEqual({ serviceId: "service-market:haircut" });
    expect(byName.get("RefreshMarketplaceTrendsJob")).toEqual({ subjectEntityId: "biz_1" });
  });

  it("still returns the plan when no executor is bound (Epic 03.5 pending)", async () => {
    const { triggers } = makeTriggers({ businessIds: ["biz_1"], executor: false });

    const result = await triggers.nightly(NOW);

    expect(result.enqueued).toBe(false);
    expect(result.jobs.length).toBeGreaterThan(0);
  });
});
