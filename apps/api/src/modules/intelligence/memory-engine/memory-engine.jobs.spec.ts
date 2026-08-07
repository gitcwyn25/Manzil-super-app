import type { IntelligenceJob } from "../core";
import type { MemoryClock } from "./memory-engine.clock";
import { MemoryEngineJobs } from "./memory-engine.jobs";
import { InProcessMemoryObjectStore } from "./memory-object.store";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService } from "./memory-retrieval.service";
import { MemoryWriterService } from "./memory-writer.service";
import { stampMemory } from "./memory.lifecycle";
import type { CustomerActivity } from "./memory-projection.repository";

const NOW = "2026-08-07T09:00:00.000Z";
const TOMORROW = "2026-08-09T00:00:00.000Z";

function makeClock(now = NOW): MemoryClock & { set(at: string): void } {
  let current = now;
  let sequence = 0;

  return {
    now: () => current,
    newId: () => `evt_${(sequence += 1)}`,
    set: (at: string) => {
      current = at;
    }
  };
}

const activity: CustomerActivity = {
  customers: [
    {
      id: "cus_1",
      businessId: "biz_1",
      userId: "usr_1",
      phone: "+998901234567",
      visitCount: 4,
      totalSpend: { toString: () => "1200000.00" },
      lastVisitAt: new Date("2026-07-20T00:00:00.000Z"),
      updatedAt: new Date("2026-07-20T00:00:00.000Z")
    }
  ],
  visits: [
    { customerId: "cus_1", businessId: "biz_1", occurredAt: new Date("2026-07-01T00:00:00.000Z") },
    { customerId: "cus_1", businessId: "biz_1", occurredAt: new Date("2026-07-20T00:00:00.000Z") }
  ],
  businesses: [{ id: "biz_1", categoryId: "cat_1", categorySlug: "coffee", priceTier: "mid" }]
};

const noActivity: CustomerActivity = { customers: [], visits: [], businesses: [] };

/** A volatile mission, so expiry has something real to destroy. */
function missionFor(customerId: string) {
  return stampMemory({
    tier: "mission_context" as const,
    subjectId: customerId,
    source: "conversation" as const,
    confidence: 0.8,
    knowledge: {
      customerId,
      experienceType: "birthday" as const,
      targetDate: "2026-08-08",
      guestCount: 6,
      budget: null,
      nearNeighborhoodId: null,
      requiredCapabilityKeys: [],
      workspaceId: null
    },
    now: NOW
  });
}

/** A durable preference, so a sweep can be shown not to touch it. */
function preferenceFor(customerId: string) {
  return stampMemory({
    tier: "preference_context" as const,
    subjectId: customerId,
    source: "onboarding" as const,
    confidence: 0.8,
    knowledge: {
      customerId,
      preferences: [],
      budget: null,
      dietary: [],
      favoriteBusinessIds: []
    },
    now: NOW
  });
}

function makeJobs(
  options: { activity?: CustomerActivity; publisher?: boolean; metrics?: boolean; clock?: ReturnType<typeof makeClock> } = {}
) {
  const clock = options.clock ?? makeClock();
  const store = new InProcessMemoryObjectStore();
  const repository = new MemoryRepository(store, clock);
  const projection = { activityOf: jest.fn().mockResolvedValue(options.activity ?? activity) };
  const cache = {
    read: jest.fn((_key: string, _ttl: number, loader: () => Promise<unknown>) => loader()),
    invalidate: jest.fn().mockResolvedValue(undefined)
  };
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
  const metrics = { record: jest.fn() };

  const retrieval = new MemoryRetrievalService(repository, projection as never, cache as never, clock);
  const writer = new MemoryWriterService(
    repository,
    clock,
    options.publisher === false ? undefined : publisher,
    options.metrics === false ? undefined : metrics
  );

  const jobs = new MemoryEngineJobs(
    repository,
    retrieval,
    writer,
    cache as never,
    clock,
    options.metrics === false ? undefined : metrics
  );

  return { jobs, repository, store, cache, publisher, metrics, clock, projection };
}

const updateJob: IntelligenceJob<"UpdateCustomerMemoryJob"> = {
  jobId: "job_1",
  name: "UpdateCustomerMemoryJob",
  payload: { customerId: "usr_1" },
  idempotencyKey: "memory:usr_1",
  correlationId: "corr_1",
  causationEventId: "evt_root",
  requestedAt: NOW
};

const expireJob: IntelligenceJob<"ExpireMemoryJob"> = {
  jobId: "job_2",
  name: "ExpireMemoryJob",
  payload: { customerId: null },
  idempotencyKey: "expire:all",
  correlationId: "corr_2",
  causationEventId: null,
  requestedAt: NOW
};

describe("UpdateCustomerMemoryJob", () => {
  it("refreshes the preference tier from activity and announces the change", async () => {
    const { jobs, publisher, repository } = makeJobs();

    const result = await jobs.updateCustomerMemory(updateJob);

    expect(result.updatedTiers).toEqual(["preference_context"]);
    expect(result.published).toBe(true);
    expect(publisher.publish).toHaveBeenCalledTimes(1);

    // The doc 23 §3 envelope, field for field.
    expect(result.events[0]).toEqual({
      eventId: "evt_1",
      eventType: "MemoryUpdated",
      eventVersion: 1,
      timestamp: NOW,
      aggregateId: "usr_1",
      correlationId: "corr_1",
      causationId: "evt_root",
      payload: { customerId: "usr_1", updatedTiers: ["preference_context"] }
    });

    expect(await repository.read({ tier: "preference_context", subjectId: "usr_1" })).not.toBeNull();
  });

  it("drops the cached derivation first, because behaviour is what changed", async () => {
    const { jobs, cache } = makeJobs();

    await jobs.updateCustomerMemory(updateJob);

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
  });

  it("announces nothing when there is no activity to remember", async () => {
    const { jobs, publisher } = makeJobs({ activity: noActivity });

    const result = await jobs.updateCustomerMemory(updateJob);

    expect(result.updatedTiers).toEqual([]);
    expect(result.events).toEqual([]);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("is idempotent: the same job twice yields the identical result and one set of effects", async () => {
    const { jobs, publisher } = makeJobs();

    const first = await jobs.updateCustomerMemory(updateJob);
    const second = await jobs.updateCustomerMemory(updateJob);

    expect(second.deduplicated).toBe(true);
    // Identical down to the event id — a replay, not a re-run.
    expect(second.events).toEqual(first.events);
    expect(second.updatedTiers).toEqual(first.updatedTiers);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("converges beneath the ledger: a different key re-derives the same memory and announces nothing", async () => {
    const { jobs, publisher } = makeJobs();

    await jobs.updateCustomerMemory(updateJob);
    const rerun = await jobs.updateCustomerMemory({ ...updateJob, idempotencyKey: "memory:usr_1:again" });

    expect(rerun.deduplicated).toBe(false);
    // Same rows ⇒ same knowledge ⇒ nothing changed ⇒ nothing announced.
    expect(rerun.updatedTiers).toEqual([]);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("expires what has aged out for that customer while it is looking at them", async () => {
    const clock = makeClock();
    const { jobs, repository, publisher } = makeJobs({ clock, activity: noActivity });

    await repository.write(missionFor("usr_1"));

    clock.set(TOMORROW);
    const result = await jobs.updateCustomerMemory(updateJob);

    expect(result.updatedTiers).toEqual(["mission_context"]);
    expect(result.expiredScopes).toEqual([{ tier: "mission_context", subjectId: "usr_1" }]);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("measures execution time and memory freshness (doc 23 §8)", async () => {
    const { jobs, metrics } = makeJobs();

    await jobs.updateCustomerMemory(updateJob);

    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "execution_time", operation: "UpdateCustomerMemoryJob" })
    );
    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "freshness", subject: "memory", entityId: "usr_1" })
    );
  });

  it("still builds the event chain when no publisher is bound (Epic 03.5 pending)", async () => {
    const { jobs } = makeJobs({ publisher: false });

    const result = await jobs.updateCustomerMemory(updateJob);

    expect(result.events).toHaveLength(1);
    expect(result.published).toBe(false);
  });
});

describe("ExpireMemoryJob", () => {
  it("destroys volatile memory even though nobody read it", async () => {
    const clock = makeClock();
    const { jobs, repository, store, publisher } = makeJobs({ clock, activity: noActivity });

    await repository.write(missionFor("usr_1"));
    await repository.write(preferenceFor("usr_1"));

    clock.set(TOMORROW);
    const result = await jobs.expireMemory(expireJob);

    expect(result.updatedTiers).toEqual(["mission_context"]);
    expect(result.expiredScopes).toEqual([{ tier: "mission_context", subjectId: "usr_1" }]);
    // The persistent tier is untouched: a finished mission is not amnesia.
    expect(store.size).toBe(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("announces nothing when nothing had aged out", async () => {
    const { jobs, publisher } = makeJobs({ activity: noActivity });

    const result = await jobs.expireMemory(expireJob);

    expect(result.expiredScopes).toEqual([]);
    expect(result.events).toEqual([]);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("is idempotent, and convergent beneath the ledger", async () => {
    const clock = makeClock();
    const { jobs, repository, publisher } = makeJobs({ clock, activity: noActivity });

    await repository.write(missionFor("usr_1"));

    clock.set(TOMORROW);
    const first = await jobs.expireMemory(expireJob);
    const replay = await jobs.expireMemory(expireJob);
    const fresh = await jobs.expireMemory({ ...expireJob, idempotencyKey: "expire:all:again" });

    expect(replay.deduplicated).toBe(true);
    expect(replay.events).toEqual(first.events);
    // Nothing left to expire, so the second real run announces nothing.
    expect(fresh.expiredScopes).toEqual([]);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("scopes a sweep to one customer when asked", async () => {
    const clock = makeClock();
    const { jobs, repository } = makeJobs({ clock, activity: noActivity });

    for (const subjectId of ["usr_1", "usr_2"]) {
      await repository.write(missionFor(subjectId));
    }

    clock.set(TOMORROW);
    const result = await jobs.expireMemory({ ...expireJob, payload: { customerId: "usr_1" } });

    expect(result.expiredScopes).toEqual([{ tier: "mission_context", subjectId: "usr_1" }]);
    expect(result.customerId).toBe("usr_1");
  });
});
