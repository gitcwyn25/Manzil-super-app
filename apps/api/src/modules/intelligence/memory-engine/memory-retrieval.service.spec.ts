import type { MemoryClock } from "./memory-engine.clock";
import { InProcessMemoryObjectStore } from "./memory-object.store";
import { stampMemory } from "./memory.lifecycle";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService } from "./memory-retrieval.service";
import type { AnyMemoryObject, PreferenceKnowledge } from "./memory.tiers";
import type { CustomerActivity } from "./memory-projection.repository";

const MARCH = "2026-03-01T00:00:00.000Z";
const NOW = "2026-08-07T09:00:00.000Z";

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

const emptyActivity: CustomerActivity = { customers: [], visits: [], businesses: [] };

const activityWithVisits: CustomerActivity = {
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

function makeService(activity: CustomerActivity = emptyActivity, clock = makeClock()) {
  const store = new InProcessMemoryObjectStore();
  const repository = new MemoryRepository(store, clock);
  const projection = { activityOf: jest.fn().mockResolvedValue(activity) };
  // The real cache is exercised in memory-cache.service.spec.ts; here it is a
  // pass-through so retrieval assertions are about retrieval.
  const cache = {
    read: jest.fn((_key: string, _ttl: number, loader: () => Promise<unknown>) => loader()),
    invalidate: jest.fn()
  };

  const service = new MemoryRetrievalService(repository, projection as never, cache as never, clock);

  return { service, repository, store, projection, cache, clock };
}

function tierMemory(tier: AnyMemoryObject["tier"], subjectId: string, knowledge: object, at = NOW): AnyMemoryObject {
  return stampMemory({ tier, subjectId, source: "workspace", confidence: 0.9, knowledge, now: at }) as AnyMemoryObject;
}

describe("retrieval order", () => {
  it("consults the tiers in the binding order, plan first", async () => {
    const { service, repository } = makeService();

    await repository.write(tierMemory("mission_context", "cus_1", { customerId: "cus_1" }));
    await repository.write(tierMemory("preference_context", "cus_1", { customerId: "cus_1", preferences: [], budget: null, dietary: [], favoriteBusinessIds: [] }));
    await repository.write(tierMemory("relationship_context", "cus_1", { customerId: "cus_1", companions: [] }));
    await repository.write(tierMemory("workspace_timeline", "ws_1", { workspaceId: "ws_1", experienceId: null, entries: [] }));
    await repository.write(tierMemory("business_context", "cus_1", { summaries: [] }));
    await repository.write(tierMemory("marketplace_context", "marketplace", { trends: [], demand: [], cityEventIds: [] }));

    const result = await service.recallOrdered({ customerId: "cus_1", workspaceId: "ws_1" });

    expect(result.memories.map((memory) => memory.tier)).toEqual([
      "workspace_timeline",
      "mission_context",
      "relationship_context",
      "preference_context",
      "business_context",
      "marketplace_context"
    ]);
  });

  it("names the memories it consulted, in order (doc 23 §9)", async () => {
    const { service, repository } = makeService();
    await repository.write(tierMemory("mission_context", "cus_1", { customerId: "cus_1" }));
    await repository.write(tierMemory("workspace_timeline", "ws_1", { workspaceId: "ws_1", experienceId: null, entries: [] }));

    const result = await service.recallOrdered({ customerId: "cus_1", workspaceId: "ws_1" });

    expect(result.consultedMemoryIds).toEqual([
      "memory:workspace_timeline:ws_1",
      "memory:mission_context:cus_1"
    ]);
  });

  it("fills the bundle by tier, so reasoning code states what it expected", async () => {
    const { service, repository } = makeService();
    await repository.write(tierMemory("mission_context", "cus_1", { customerId: "cus_1" }));

    const bundle = await service.recall("cus_1", null);

    expect(bundle.mission?.tier).toBe("mission_context");
    expect(bundle.preferences).toBeNull();
    expect(bundle.workspaceTimeline).toBeNull();
    expect(bundle.marketplaceContext).toBeNull();
  });
});

describe("honest absence", () => {
  it("reports a typed cause for every tier that had nothing to say", async () => {
    const { service } = makeService();

    const result = await service.recallOrdered({ customerId: "cus_1", workspaceId: null });

    expect(result.memories).toEqual([]);
    expect(result.missing).toHaveLength(6);
    expect(result.missing).toContainEqual({
      kind: "memory_missing",
      tier: "workspace_timeline",
      customerId: "cus_1"
    });
  });

  it("a customer with no workspace has no timeline, and that is an absence with a cause", async () => {
    const { service, repository } = makeService();
    await repository.write(tierMemory("workspace_timeline", "ws_1", { workspaceId: "ws_1", experienceId: null, entries: [] }));

    const result = await service.recallOrdered({ customerId: "cus_1", workspaceId: null });

    expect(result.bundle.workspaceTimeline).toBeNull();
    expect(result.missing.some((error) => "tier" in error && error.tier === "workspace_timeline")).toBe(true);
  });

  it("stops serving an expired mission, so recall degrades rather than lies", async () => {
    const clock = makeClock();
    const { service, repository } = makeService(emptyActivity, clock);
    await repository.write(tierMemory("mission_context", "cus_1", { customerId: "cus_1" }));

    clock.set("2026-08-09T00:00:00.000Z");
    const result = await service.recallOrdered({ customerId: "cus_1", workspaceId: null });

    expect(result.bundle.mission).toBeNull();
    expect(result.missing).toContainEqual({
      kind: "memory_missing",
      tier: "mission_context",
      customerId: "cus_1"
    });
  });
});

describe("the preference overlay", () => {
  it("projects preferences from behaviour when nothing was ever written", async () => {
    const { service } = makeService(activityWithVisits);

    const bundle = await service.recall("usr_1", null);

    expect(bundle.preferences?.source).toBe("platform_inference");
    expect((bundle.preferences?.knowledge as PreferenceKnowledge).favoriteBusinessIds).toEqual(["biz_1"]);
    // Stamped as of the last visit, not as of the read.
    expect(bundle.preferences?.updated).toBe("2026-07-20T00:00:00.000Z");
  });

  it("lets what the customer said outrank what the platform noticed", async () => {
    const { service, repository } = makeService(activityWithVisits);

    await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "usr_1",
        source: "conversation",
        confidence: 0.85,
        knowledge: {
          customerId: "usr_1",
          preferences: [
            { dimension: "category", fact: { value: "barber", source: "conversation" as const, confidence: 0.85, observedAt: NOW } }
          ],
          budget: null,
          dietary: [],
          favoriteBusinessIds: ["biz_7"]
        },
        now: NOW
      })
    );

    const bundle = await service.recall("usr_1", null);
    const knowledge = bundle.preferences?.knowledge as PreferenceKnowledge;

    expect(knowledge.preferences.find((entry) => entry.dimension === "category")?.fact.value).toBe("barber");
    // …while keeping what behaviour proved and the statement never denied.
    expect([...knowledge.favoriteBusinessIds].sort()).toEqual(["biz_1", "biz_7"]);
    expect(knowledge.preferences.some((entry) => entry.dimension === "price_tier")).toBe(true);
  });

  it("keeps an explicit memory when there is no activity to project from", async () => {
    const { service, repository } = makeService(emptyActivity);
    await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "cus_1",
        source: "onboarding",
        confidence: 0.8,
        knowledge: { customerId: "cus_1", preferences: [], budget: null, dietary: [], favoriteBusinessIds: ["biz_5"] },
        now: MARCH
      })
    );

    const bundle = await service.recall("cus_1", null);

    expect((bundle.preferences?.knowledge as PreferenceKnowledge).favoriteBusinessIds).toEqual(["biz_5"]);
  });

  it("caches the projection read rather than the memory itself", async () => {
    const { service, cache, projection } = makeService(activityWithVisits);

    await service.recall("usr_1", null);

    expect(cache.read).toHaveBeenCalledWith("activity:usr_1", expect.any(Number), expect.any(Function));
    expect(projection.activityOf).toHaveBeenCalledWith("usr_1");
  });

  it("loads every tier in one store read, not six", async () => {
    const { service, store } = makeService();
    const read = jest.spyOn(store, "read");

    await service.recallOrdered({ customerId: "cus_1", workspaceId: "ws_1" });

    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0]?.[0]).toHaveLength(6);
  });
});
