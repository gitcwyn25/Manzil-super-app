import {
  InProcessMemoryObjectStore,
  MEMORY_STORE_ENV,
  PrismaMemoryObjectStore,
  resolveMemoryObjectDelegate,
  selectMemoryObjectStore,
  type StoredMemoryRecord
} from "./memory-object.store";
import type { PrismaService } from "../../prisma.service";

const NOW = "2026-08-07T09:00:00.000Z";

function record(overrides: Partial<StoredMemoryRecord> = {}): StoredMemoryRecord {
  return {
    tier: "mission_context",
    subjectId: "cus_1",
    memoryId: "memory:mission_context:cus_1",
    source: "conversation",
    confidence: 0.8,
    knowledge: { customerId: "cus_1" },
    created: NOW,
    updated: NOW,
    expires: "2026-08-08T09:00:00.000Z",
    retrievalPriority: 1,
    ...overrides
  };
}

describe("InProcessMemoryObjectStore — the pre-M1 store", () => {
  it("is honest about what it is: real storage, not durable storage", () => {
    const store = new InProcessMemoryObjectStore();

    expect(store.available).toBe(true);
    expect(store.durable).toBe(false);
    expect(store.backend).toBe("memory");
  });

  it("reads back what it wrote, by scope", async () => {
    const store = new InProcessMemoryObjectStore();
    await store.write([record()]);

    const found = await store.read([{ tier: "mission_context", subjectId: "cus_1" }]);

    expect(found).toEqual([record()]);
  });

  it("keeps tiers apart: one subject, six independent slots", async () => {
    const store = new InProcessMemoryObjectStore();

    await store.write([
      record(),
      record({
        tier: "preference_context",
        memoryId: "memory:preference_context:cus_1",
        retrievalPriority: 3,
        expires: null
      })
    ]);

    const missionOnly = await store.read([{ tier: "mission_context", subjectId: "cus_1" }]);

    expect(missionOnly).toHaveLength(1);
    expect(missionOnly[0]?.tier).toBe("mission_context");
    expect(store.size).toBe(2);
  });

  it("upserts on (tier, subject): writing the same memory twice is one row", async () => {
    const store = new InProcessMemoryObjectStore();

    await store.write([record()]);
    await store.write([record({ confidence: 0.95 })]);

    expect(store.size).toBe(1);
    expect((await store.read([{ tier: "mission_context", subjectId: "cus_1" }]))[0]?.confidence).toBe(0.95);
  });

  it("forgets a scope and reports whether anything was there", async () => {
    const store = new InProcessMemoryObjectStore();
    await store.write([record()]);

    expect(await store.forget([{ tier: "mission_context", subjectId: "cus_1" }])).toBe(1);
    expect(await store.forget([{ tier: "mission_context", subjectId: "cus_1" }])).toBe(0);
  });

  it("sweeps what has aged out and names the scopes it removed", async () => {
    const store = new InProcessMemoryObjectStore();
    await store.write([record(), record({ tier: "preference_context", memoryId: "memory:preference_context:cus_1", expires: null })]);

    const swept = await store.sweepExpired("2026-08-09T00:00:00.000Z");

    expect(swept).toEqual([{ tier: "mission_context", subjectId: "cus_1" }]);
    expect(store.size).toBe(1);
  });
});

describe("the M1 gate", () => {
  const prisma = {} as PrismaService;

  const delegate = {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 })
  };

  const withDelegate = { memoryObject: delegate } as unknown as PrismaService;

  it("stays in process while the deployment has not opted in", () => {
    const store = selectMemoryObjectStore(withDelegate, {});

    expect(store).toBeInstanceOf(InProcessMemoryObjectStore);
  });

  it("stays in process when the env var is set but the delegate does not exist", () => {
    // `prisma generate` mints the delegate on every image build once the model
    // is in schema.prisma — long before the table exists. That is why one
    // signal is never enough, in either direction.
    const store = selectMemoryObjectStore(prisma, { [MEMORY_STORE_ENV]: "prisma" });

    expect(store).toBeInstanceOf(InProcessMemoryObjectStore);
  });

  it("switches to Postgres only when both signals agree", () => {
    const store = selectMemoryObjectStore(withDelegate, { [MEMORY_STORE_ENV]: "prisma" });

    expect(store).toBeInstanceOf(PrismaMemoryObjectStore);
    expect(store.durable).toBe(true);
    expect(store.backend).toBe("prisma");
  });

  it("recognises the delegate structurally, without importing a type that does not exist yet", () => {
    expect(resolveMemoryObjectDelegate(withDelegate)).toBe(delegate);
    expect(resolveMemoryObjectDelegate(prisma)).toBeNull();
    expect(resolveMemoryObjectDelegate({ memoryObject: { findMany: jest.fn() } } as unknown as PrismaService)).toBeNull();
  });
});

describe("PrismaMemoryObjectStore", () => {
  function makeDelegate() {
    return {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 })
    };
  }

  it("upserts on (tier, subject), so a redelivered write is one row", async () => {
    const delegate = makeDelegate();
    const store = new PrismaMemoryObjectStore(delegate);

    const outcome = await store.write([record()]);

    expect(outcome).toEqual({ persisted: true, written: 1 });
    expect(delegate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tier_subjectId: { tier: "mission_context", subjectId: "cus_1" } }
      })
    );
  });

  it("maps rows back into the contract envelope", async () => {
    const delegate = makeDelegate();
    delegate.findMany.mockResolvedValue([
      {
        tier: "mission_context",
        subjectId: "cus_1",
        memoryId: "memory:mission_context:cus_1",
        source: "conversation",
        confidence: 0.8,
        knowledge: { customerId: "cus_1" },
        createdAt: new Date(NOW),
        updatedAt: new Date(NOW),
        expiresAt: new Date("2026-08-08T09:00:00.000Z"),
        retrievalPriority: 1
      }
    ]);

    const found = await new PrismaMemoryObjectStore(delegate).read([
      { tier: "mission_context", subjectId: "cus_1" }
    ]);

    expect(found).toEqual([record()]);
  });

  it("reports the scopes a sweep removed, not just a count", async () => {
    const delegate = makeDelegate();
    delegate.findMany.mockResolvedValue([
      { tier: "mission_context", subjectId: "cus_1", memoryId: "m", source: "conversation", confidence: 1, knowledge: {}, createdAt: new Date(NOW), updatedAt: new Date(NOW), expiresAt: new Date(NOW), retrievalPriority: 1 }
    ]);

    const swept = await new PrismaMemoryObjectStore(delegate).sweepExpired("2026-08-09T00:00:00.000Z");

    expect(swept).toEqual([{ tier: "mission_context", subjectId: "cus_1" }]);
    expect(delegate.deleteMany).toHaveBeenCalled();
  });
});
