import type { IntelligenceJob } from "../core";
import { MarketplaceIntelligenceJobs } from "./marketplace-intelligence.jobs";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";

const NOW = "2026-08-07T09:00:00.000Z";

function makeClock(): MarketplaceClock {
  let sequence = 0;

  return {
    now: () => NOW,
    newId: () => `evt_${(sequence += 1)}`
  };
}

/** A summarizer stub whose result the test dictates. */
function summarizer(changed: boolean, extras: Record<string, unknown> = {}) {
  return {
    summarize: jest.fn().mockResolvedValue({
      writes: changed
        ? [{ slot: { kind: "business" }, outcome: "written", failure: null }]
        : [{ slot: { kind: "business" }, outcome: "unchanged", failure: null }],
      changed,
      gaps: [],
      profile: { updatedAt: NOW },
      summary: changed ? {} : null,
      trends: changed ? [{}] : [],
      write: { slot: { kind: "campaign" }, outcome: changed ? "written" : "unchanged", failure: null },
      ...extras
    }),
    refreshHealth: jest.fn().mockResolvedValue({
      writes: [{ slot: { kind: "business" }, outcome: changed ? "written" : "unchanged", failure: null }],
      changed,
      gaps: [],
      profile: { updatedAt: NOW }
    })
  };
}

function makeJobs(options: { changed?: boolean; publisher?: boolean; metrics?: boolean } = {}) {
  const changed = options.changed ?? true;
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
  const metrics = { record: jest.fn() };

  const business = summarizer(changed);
  const customer = summarizer(changed);
  const neighborhood = summarizer(changed);
  const service = summarizer(changed);
  const trends = summarizer(changed);
  const campaign = summarizer(changed);
  const workspace = {
    summarize: jest.fn().mockResolvedValue({
      workspaceId: "wsp_1",
      summary: null,
      write: null,
      changed: false,
      gaps: [
        {
          model: "workspace_plan",
          failure: {
            error: { kind: "knowledge_missing", entityId: "wsp_1", missingKey: "workspace" },
            retryable: false,
            occurredAt: NOW
          },
          observations: 0,
          required: 1
        }
      ]
    })
  };

  const jobs = new MarketplaceIntelligenceJobs(
    business as never,
    customer as never,
    neighborhood as never,
    service as never,
    trends as never,
    campaign as never,
    workspace as never,
    makeClock(),
    options.publisher === false ? undefined : publisher,
    options.metrics === false ? undefined : metrics
  );

  return { jobs, business, customer, neighborhood, service, trends, campaign, workspace, publisher, metrics };
}

const summarizeBusiness: IntelligenceJob<"SummarizeBusinessJob"> = {
  jobId: "job_1",
  name: "SummarizeBusinessJob",
  payload: { businessId: "biz_1" },
  idempotencyKey: "SummarizeBusinessJob:biz_1:2026-08-07",
  correlationId: "corr_1",
  causationEventId: "evt_root",
  requestedAt: NOW
};

describe("SummarizeBusinessJob", () => {
  it("announces BusinessSummaryCompleted in the doc 23 §3 envelope", async () => {
    const { jobs, publisher } = makeJobs();

    const result = await jobs.summarizeBusiness(summarizeBusiness);

    expect(result.published).toBe(true);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(result.events[0]).toEqual({
      eventId: "evt_1",
      eventType: "BusinessSummaryCompleted",
      eventVersion: 1,
      timestamp: NOW,
      aggregateId: "biz_1",
      correlationId: "corr_1",
      causationId: "evt_root",
      payload: { businessId: "biz_1", summaryUpdatedAt: NOW }
    });
  });

  it("announces nothing when the same rows produced the same summary", async () => {
    const { jobs, publisher } = makeJobs({ changed: false });

    const result = await jobs.summarizeBusiness(summarizeBusiness);

    expect(result.events).toEqual([]);
    expect(result.updatedKinds).toEqual([]);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("is idempotent: the same job twice replays, effects included", async () => {
    const { jobs, publisher, business } = makeJobs();

    const first = await jobs.summarizeBusiness(summarizeBusiness);
    const second = await jobs.summarizeBusiness(summarizeBusiness);

    expect(second.deduplicated).toBe(true);
    // Identical down to the event id — a replay, not a re-run.
    expect(second.events).toEqual(first.events);
    expect(business.summarize).toHaveBeenCalledTimes(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("converges beneath the ledger: a new key re-derives and announces nothing", async () => {
    const { jobs, business } = makeJobs({ changed: false });

    const rerun = await jobs.summarizeBusiness({
      ...summarizeBusiness,
      idempotencyKey: "SummarizeBusinessJob:biz_1:2026-08-08"
    });

    expect(rerun.deduplicated).toBe(false);
    expect(rerun.events).toEqual([]);
    expect(business.summarize).toHaveBeenCalledTimes(1);
  });

  it("measures execution time and summary freshness (doc 23 §8)", async () => {
    const { jobs, metrics } = makeJobs();

    await jobs.summarizeBusiness(summarizeBusiness);

    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "execution_time", operation: "SummarizeBusinessJob" })
    );
    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "freshness", subject: "summary", entityId: "biz_1" })
    );
  });

  it("still builds the event chain when no publisher is bound (Epic 03.5 pending)", async () => {
    const { jobs } = makeJobs({ publisher: false });

    const result = await jobs.summarizeBusiness(summarizeBusiness);

    expect(result.events).toHaveLength(1);
    expect(result.published).toBe(false);
  });
});

describe("RefreshBusinessHealthJob", () => {
  it("patches health without asking the summarizer for a full rebuild", async () => {
    const { jobs, business } = makeJobs();

    const result = await jobs.refreshBusinessHealth({
      jobId: "job_2",
      name: "RefreshBusinessHealthJob",
      payload: { businessId: "biz_1" },
      idempotencyKey: "health:biz_1",
      correlationId: "corr_2",
      causationEventId: null,
      requestedAt: NOW
    });

    expect(business.refreshHealth).toHaveBeenCalledWith("biz_1");
    expect(business.summarize).not.toHaveBeenCalled();
    expect(result.events[0]?.eventType).toBe("BusinessSummaryCompleted");
  });
});

describe("the six declaration-merged jobs", () => {
  it("announces a customer rebuild on its own event type", async () => {
    const { jobs, customer } = makeJobs();

    const result = await jobs.summarizeCustomer({
      jobId: "job_3",
      name: "SummarizeCustomerJob",
      payload: { customerId: "usr_1" },
      idempotencyKey: "customer:usr_1",
      correlationId: "corr_3",
      causationEventId: null,
      requestedAt: NOW
    });

    expect(customer.summarize).toHaveBeenCalledWith("usr_1");
    expect(result.events[0]).toMatchObject({
      eventType: "CustomerSummaryCompleted",
      aggregateId: "usr_1",
      payload: { customerId: "usr_1", summaryUpdatedAt: NOW }
    });
  });

  it("uses one marketplace event for neighborhoods, services, trends and campaigns", async () => {
    const { jobs } = makeJobs();

    const neighborhood = await jobs.summarizeNeighborhood({
      jobId: "job_4",
      name: "SummarizeNeighborhoodJob",
      payload: { neighborhoodId: "neighborhood:Tashkent:Yunusobod" },
      idempotencyKey: "n:1",
      correlationId: "corr_4",
      causationEventId: null,
      requestedAt: NOW
    });

    const service = await jobs.summarizeService({
      jobId: "job_5",
      name: "SummarizeServiceJob",
      payload: { serviceId: "service-market:haircut" },
      idempotencyKey: "s:1",
      correlationId: "corr_5",
      causationEventId: null,
      requestedAt: NOW
    });

    const campaign = await jobs.summarizeCampaign({
      jobId: "job_6",
      name: "SummarizeCampaignJob",
      payload: { businessId: "biz_1" },
      idempotencyKey: "c:1",
      correlationId: "corr_6",
      causationEventId: null,
      requestedAt: NOW
    });

    const trend = await jobs.refreshMarketplaceTrends({
      jobId: "job_7",
      name: "RefreshMarketplaceTrendsJob",
      payload: { subjectEntityId: "biz_1" },
      idempotencyKey: "t:1",
      correlationId: "corr_7",
      causationEventId: null,
      requestedAt: NOW
    });

    for (const [result, kind] of [
      [neighborhood, "neighborhood"],
      [service, "service"],
      [campaign, "campaign"],
      [trend, "trend"]
    ] as const) {
      expect(result.events[0]).toMatchObject({
        eventType: "MarketplaceSummaryCompleted",
        payload: { kind }
      });
    }
  });
});

describe("SummarizeWorkspaceJob", () => {
  it("succeeds at saying it cannot, and announces nothing", async () => {
    const { jobs, publisher, metrics } = makeJobs();

    const result = await jobs.summarizeWorkspace({
      jobId: "job_8",
      name: "SummarizeWorkspaceJob",
      payload: { workspaceId: "wsp_1" },
      idempotencyKey: "w:1",
      correlationId: "corr_8",
      causationEventId: null,
      requestedAt: NOW
    });

    // A gap is not a job failure: the job did exactly its job.
    expect(result.failure).toBeNull();
    expect(result.events).toEqual([]);
    expect(result.updatedKinds).toEqual([]);
    expect(publisher.publish).not.toHaveBeenCalled();

    expect(result.gaps[0]?.failure.error).toMatchObject({
      kind: "knowledge_missing",
      missingKey: "workspace"
    });

    // Measured as a typed cause, so a dashboard can see which models the
    // marketplace is still too small (or too unmodelled) for.
    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "failure",
        operation: "SummarizeWorkspaceJob.workspace_plan",
        errorKind: "knowledge_missing"
      })
    );
  });
});
