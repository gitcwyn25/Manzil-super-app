import type { MemoryClock } from "./memory-engine.clock";
import { InProcessMemoryObjectStore, type MemoryObjectStore } from "./memory-object.store";
import { stampMemory } from "./memory.lifecycle";
import { knowledgeEquals, MemoryRepository, toMemoryObject, toStoredRecord } from "./memory.repository";
import type { AnyMemoryObject, MissionKnowledge, PreferenceKnowledge } from "./memory.tiers";

const MARCH = "2026-03-01T00:00:00.000Z";
const NOW = "2026-08-07T09:00:00.000Z";
const TOMORROW = "2026-08-08T10:00:00.000Z";

/** Time as a dependency: expiry is only assertable without a wall clock. */
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

const missionKnowledge: MissionKnowledge = {
  customerId: "cus_1",
  experienceType: "birthday",
  targetDate: "2026-08-08",
  guestCount: 6,
  budget: null,
  nearNeighborhoodId: null,
  requiredCapabilityKeys: [],
  workspaceId: "ws_1"
};

const preferenceKnowledge: PreferenceKnowledge = {
  customerId: "cus_1",
  preferences: [
    { dimension: "cuisine", fact: { value: "italian", source: "onboarding", confidence: 0.8, observedAt: MARCH } }
  ],
  budget: null,
  dietary: [],
  favoriteBusinessIds: ["biz_1"]
};

function mission(at = NOW, confidence = 0.8): AnyMemoryObject {
  return stampMemory({
    tier: "mission_context",
    subjectId: "cus_1",
    source: "conversation",
    confidence,
    knowledge: missionKnowledge,
    now: at
  });
}

function preference(at = MARCH, knowledge = preferenceKnowledge, confidence = 0.8): AnyMemoryObject {
  return stampMemory({
    tier: "preference_context",
    subjectId: "cus_1",
    source: "onboarding",
    confidence,
    knowledge,
    now: at
  });
}

function makeRepository(store: MemoryObjectStore = new InProcessMemoryObjectStore(), clock = makeClock()) {
  return { repository: new MemoryRepository(store, clock), store, clock };
}

describe("tier isolation", () => {
  it("never serves one tier's memory as another's", async () => {
    const { repository } = makeRepository();
    await repository.write(mission());

    expect(await repository.read({ tier: "mission_context", subjectId: "cus_1" })).not.toBeNull();
    expect(await repository.read({ tier: "preference_context", subjectId: "cus_1" })).toBeNull();
    expect(await repository.read({ tier: "relationship_context", subjectId: "cus_1" })).toBeNull();
  });

  it("never serves one subject's memory to another", async () => {
    const { repository } = makeRepository();
    await repository.write(mission());

    expect(await repository.read({ tier: "mission_context", subjectId: "cus_2" })).toBeNull();
  });

  it("forgets exactly one slot", async () => {
    const { repository } = makeRepository();
    await repository.write(mission());
    await repository.write(preference());

    expect(await repository.forget({ tier: "mission_context", subjectId: "cus_1" })).toBe(true);
    expect(await repository.read({ tier: "preference_context", subjectId: "cus_1" })).not.toBeNull();
    expect(await repository.forget({ tier: "mission_context", subjectId: "cus_1" })).toBe(false);
  });
});

describe("expiry on read", () => {
  it("stops serving a mission the moment it is due, without waiting for a sweep", async () => {
    const clock = makeClock();
    const { repository, store } = makeRepository(new InProcessMemoryObjectStore(), clock);
    await repository.write(mission());

    clock.set(TOMORROW);

    expect(await repository.read({ tier: "mission_context", subjectId: "cus_1" })).toBeNull();
    // Discovered expired, deleted there and then.
    expect((store as InProcessMemoryObjectStore).size).toBe(0);
  });

  it("keeps serving a preference no matter how long it sits", async () => {
    const clock = makeClock();
    const { repository } = makeRepository(new InProcessMemoryObjectStore(), clock);
    await repository.write(preference());

    clock.set("2030-01-01T00:00:00.000Z");

    expect(await repository.read({ tier: "preference_context", subjectId: "cus_1" })).not.toBeNull();
  });

  it("sweeps expired slots and names the tiers that changed", async () => {
    const clock = makeClock();
    const { repository } = makeRepository(new InProcessMemoryObjectStore(), clock);
    await repository.write(mission());
    await repository.write(preference());

    clock.set(TOMORROW);
    const swept = await repository.sweepExpired();

    expect(swept).toEqual([{ tier: "mission_context", subjectId: "cus_1" }]);
    expect(MemoryRepository.tiersOf(swept)).toEqual(["mission_context"]);
    expect(MemoryRepository.subjectsOf(swept)).toEqual(["cus_1"]);
  });
});

describe("writes resolve conflicts instead of overwriting", () => {
  it("lets a fresher statement supersede an equally-sure one", async () => {
    const clock = makeClock(MARCH);
    const { repository } = makeRepository(new InProcessMemoryObjectStore(), clock);

    await repository.write(preference(MARCH));

    clock.set(NOW);
    const result = await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "cus_1",
        source: "conversation",
        confidence: 0.8,
        knowledge: {
          ...preferenceKnowledge,
          preferences: [
            { dimension: "cuisine", fact: { value: "japanese", source: "conversation" as const, confidence: 0.8, observedAt: NOW } }
          ]
        },
        now: NOW
      })
    );

    expect(result.outcome).toBe("written");
    expect(result.resolution).toEqual({ winner: "incoming", reason: "recency" });

    const stored = (await repository.read({ tier: "preference_context", subjectId: "cus_1" })) as AnyMemoryObject;
    expect((stored.knowledge as PreferenceKnowledge).preferences[0]?.fact.value).toBe("japanese");
    // The birth of the belief survives the change.
    expect(stored.created).toBe(MARCH);
  });

  it("refuses to let a guess displace knowledge", async () => {
    const clock = makeClock(MARCH);
    const { repository } = makeRepository(new InProcessMemoryObjectStore(), clock);
    await repository.write(preference(MARCH, preferenceKnowledge, 0.9));

    clock.set(NOW);
    const result = await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "cus_1",
        source: "platform_inference",
        confidence: 0.1,
        knowledge: { ...preferenceKnowledge, favoriteBusinessIds: [] },
        now: NOW
      })
    );

    expect(result.resolution).toEqual({ winner: "existing", reason: "confidence_floor" });
    const stored = (await repository.read({ tier: "preference_context", subjectId: "cus_1" })) as AnyMemoryObject;
    expect((stored.knowledge as PreferenceKnowledge).favoriteBusinessIds).toEqual(["biz_1"]);
  });

  it("merges preferences per dimension rather than replacing the bag", async () => {
    const { repository } = makeRepository();
    await repository.write(preference(MARCH));

    await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "cus_1",
        source: "conversation",
        confidence: 0.8,
        knowledge: {
          ...preferenceKnowledge,
          preferences: [
            { dimension: "seating", fact: { value: "outdoor", source: "conversation" as const, confidence: 0.8, observedAt: NOW } }
          ],
          favoriteBusinessIds: ["biz_9"]
        },
        now: NOW
      })
    );

    const stored = (await repository.read({ tier: "preference_context", subjectId: "cus_1" })) as AnyMemoryObject;
    const knowledge = stored.knowledge as PreferenceKnowledge;

    expect(knowledge.preferences.map((entry) => entry.dimension).sort()).toEqual(["cuisine", "seating"]);
    expect([...knowledge.favoriteBusinessIds].sort()).toEqual(["biz_1", "biz_9"]);
  });
});

describe("idempotency", () => {
  it("writing the same memory twice changes nothing the second time", async () => {
    const { repository, store } = makeRepository();
    const memory = mission();

    const first = await repository.write(memory);
    const second = await repository.write(memory);

    expect(first.outcome).toBe("written");
    expect(second.outcome).toBe("kept_existing");
    expect(second.resolution).toEqual({ winner: "existing", reason: "stable_tie" });
    expect((store as InProcessMemoryObjectStore).size).toBe(1);
    // `updated` did not move, so a replay cannot make memory look fresher
    // than the knowledge in it.
    expect(second.memory?.updated).toBe(first.memory?.updated);
  });

  it("a redelivered write does not resurrect knowledge a later write replaced", async () => {
    const clock = makeClock(MARCH);
    const { repository } = makeRepository(new InProcessMemoryObjectStore(), clock);
    const early = mission(MARCH);

    await repository.write(early);
    clock.set(NOW);
    await repository.write(mission(NOW, 0.9));

    const replay = await repository.write(early);

    expect(replay.outcome).toBe("kept_existing");
    expect(replay.memory?.confidence).toBe(0.9);
  });
});

describe("degrade, never throw", () => {
  it("refuses raw conversation with a typed cause and stores nothing", async () => {
    const { repository, store } = makeRepository();

    const result = await repository.write({
      ...mission(),
      knowledge: { ...missionKnowledge, transcript: "so I said…" }
    } as unknown as AnyMemoryObject);

    expect(result.outcome).toBe("rejected");
    expect(result.errors[0]).toEqual({
      kind: "policy_violation",
      ruleId: "memory.no_raw_conversation:transcript"
    });
    expect((store as InProcessMemoryObjectStore).size).toBe(0);
  });

  it("drops a stored memory this build cannot honour instead of serving it", async () => {
    const store = new InProcessMemoryObjectStore();
    await store.write([{ ...toStoredRecord(mission()), confidence: 42 }]);

    const { repository } = makeRepository(store);

    expect(await repository.read({ tier: "mission_context", subjectId: "cus_1" })).toBeNull();
  });

  it("reports a typed failure when storage cannot serve at all", async () => {
    const unavailable: MemoryObjectStore = {
      available: false,
      durable: false,
      backend: "memory",
      read: async () => [],
      write: async () => ({ persisted: true, written: 0 }),
      forget: async () => 0,
      sweepExpired: async () => []
    };

    const { repository } = makeRepository(unavailable);
    const result = await repository.write(mission());

    expect(result.outcome).toBe("rejected");
    expect(result.failure?.error).toEqual({
      kind: "tool_unavailable",
      toolId: "memory-engine.memory-object-store"
    });
    expect(result.failure?.retryable).toBe(false);
  });
});

describe("record mapping", () => {
  it("round-trips a memory through storage unchanged", () => {
    const memory = mission();

    expect(toMemoryObject(toStoredRecord(memory))).toEqual(memory);
  });

  it("compares knowledge by content, not by key order", () => {
    expect(
      knowledgeEquals(
        { knowledge: { a: 1, b: { c: 2, d: [1, 2] } } },
        { knowledge: { b: { d: [1, 2], c: 2 }, a: 1 } }
      )
    ).toBe(true);

    expect(knowledgeEquals({ knowledge: { a: 1 } }, { knowledge: { a: 2 } })).toBe(false);
  });
});

describe("persistence status", () => {
  it("says out loud that in-process memory does not survive a restart", () => {
    const { repository } = makeRepository();

    expect(repository.durable).toBe(false);
    expect(repository.backend).toBe("memory");
  });
});
