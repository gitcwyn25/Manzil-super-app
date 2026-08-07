import type { MemoryClock } from "./memory-engine.clock";
import { MemoryEngineService } from "./memory-engine.service";
import { InProcessMemoryObjectStore } from "./memory-object.store";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService } from "./memory-retrieval.service";
import { MemoryWriterService } from "./memory-writer.service";
import { stampMemory } from "./memory.lifecycle";
import type { AnyMemoryObject, MissionKnowledge } from "./memory.tiers";

const NOW = "2026-08-07T09:00:00.000Z";

function makeClock(): MemoryClock {
  let sequence = 0;
  return { now: () => NOW, newId: () => `evt_${(sequence += 1)}` };
}

const missionKnowledge: MissionKnowledge = {
  customerId: "usr_1",
  experienceType: "birthday",
  targetDate: "2026-08-08",
  guestCount: 6,
  budget: null,
  nearNeighborhoodId: null,
  requiredCapabilityKeys: [],
  workspaceId: "ws_1"
};

function mission(): AnyMemoryObject {
  return stampMemory({
    tier: "mission_context",
    subjectId: "usr_1",
    source: "conversation",
    confidence: 0.8,
    knowledge: missionKnowledge,
    now: NOW
  });
}

function makeEngine() {
  const clock = makeClock();
  const store = new InProcessMemoryObjectStore();
  const repository = new MemoryRepository(store, clock);
  const projection = { activityOf: jest.fn().mockResolvedValue({ customers: [], visits: [], businesses: [] }) };
  const cache = {
    read: jest.fn((_key: string, _ttl: number, loader: () => Promise<unknown>) => loader()),
    invalidate: jest.fn()
  };
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };

  const retrieval = new MemoryRetrievalService(repository, projection as never, cache as never, clock);
  const writer = new MemoryWriterService(repository, clock, publisher);
  const engine = new MemoryEngineService(retrieval, writer, repository, clock);

  return { engine, repository, store, publisher };
}

describe("the MemoryEngineProvider contract", () => {
  it("remembers structured knowledge and announces it", async () => {
    const { engine, publisher, repository } = makeEngine();

    await engine.remember(mission());

    expect(await repository.read({ tier: "mission_context", subjectId: "usr_1" })).not.toBeNull();
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "MemoryUpdated",
        aggregateId: "usr_1",
        payload: { customerId: "usr_1", updatedTiers: ["mission_context"] }
      })
    );
  });

  it("recalls what it remembered", async () => {
    const { engine } = makeEngine();
    await engine.remember(mission());

    const bundle = await engine.recall("usr_1", "ws_1");

    expect(bundle.mission?.knowledge).toEqual(missionKnowledge);
  });

  it("destroys a completed mission and nothing else (AI Bible v1.2)", async () => {
    const { engine, repository, publisher } = makeEngine();
    await engine.remember(mission());
    await repository.write(
      stampMemory({
        tier: "preference_context",
        subjectId: "usr_1",
        source: "onboarding",
        confidence: 0.8,
        knowledge: { customerId: "usr_1", preferences: [], budget: null, dietary: [], favoriteBusinessIds: ["biz_1"] },
        now: NOW
      })
    );

    await engine.forgetMission("usr_1", "ws_1");

    expect(await repository.read({ tier: "mission_context", subjectId: "usr_1" })).toBeNull();
    // A finished birthday is not amnesia.
    expect(await repository.read({ tier: "preference_context", subjectId: "usr_1" })).not.toBeNull();
    expect(publisher.publish).toHaveBeenLastCalledWith(
      expect.objectContaining({ payload: { customerId: "usr_1", updatedTiers: ["mission_context"] } })
    );
  });

  it("announces nothing when there was no mission to forget", async () => {
    const { engine, publisher } = makeEngine();

    await engine.forgetMission("usr_1", null);

    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("refuses raw conversation rather than storing it quietly", async () => {
    const { engine, store } = makeEngine();

    const announcement = await engine.rememberResolved({
      ...mission(),
      knowledge: { ...missionKnowledge, messages: [{ role: "user" }] }
    } as unknown as AnyMemoryObject);

    expect(announcement.result.outcome).toBe("rejected");
    expect(announcement.events).toEqual([]);
    expect(store.size).toBe(0);
  });

  it("reports what it can honestly promise about persistence", () => {
    const { engine } = makeEngine();

    expect(engine.persistence).toEqual({ backend: "memory", durable: false });
  });

  it("returns the ordered recall with its provenance", async () => {
    const { engine } = makeEngine();
    await engine.remember(mission());

    const result = await engine.recallOrdered("usr_1", "ws_1");

    expect(result.consultedMemoryIds).toEqual(["memory:mission_context:usr_1"]);
    expect(result.at).toBe(NOW);
  });
});
