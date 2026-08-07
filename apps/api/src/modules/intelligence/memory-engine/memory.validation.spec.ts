import { stampMemory } from "./memory.lifecycle";
import type { AnyMemoryObject, MissionKnowledge } from "./memory.tiers";
import {
  findRawConversation,
  MAX_KNOWLEDGE_STRING_LENGTH,
  memoryMissing,
  NO_RAW_CONVERSATION_RULE,
  screenMemories,
  validateMemoryObject
} from "./memory.validation";

const NOW = "2026-08-07T09:00:00.000Z";

const mission: MissionKnowledge = {
  customerId: "cus_1",
  experienceType: "birthday",
  targetDate: "2026-08-08",
  guestCount: 6,
  budget: null,
  nearNeighborhoodId: null,
  requiredCapabilityKeys: ["private_rooms"],
  workspaceId: "ws_1"
};

function valid(): AnyMemoryObject {
  return stampMemory({
    tier: "mission_context",
    subjectId: "cus_1",
    source: "conversation",
    confidence: 0.8,
    knowledge: mission,
    now: NOW
  });
}

describe("the envelope contract", () => {
  it("accepts a properly stamped memory", () => {
    expect(validateMemoryObject(valid())).toEqual([]);
  });

  it("rejects an impossible confidence", () => {
    const errors = validateMemoryObject({ ...valid(), confidence: 1.4 });

    expect(errors).toContainEqual({
      kind: "knowledge_missing",
      entityId: "memory:mission_context:cus_1",
      missingKey: "memory.confidence"
    });
  });

  it("rejects a rank its tier does not have — the ordering is the contract", () => {
    const errors = validateMemoryObject({ ...valid(), retrievalPriority: 5 });

    expect(errors.some((error) => "missingKey" in error && error.missingKey === "memory.retrievalPriority")).toBe(true);
  });

  it("rejects an id that names a different tier", () => {
    const errors = validateMemoryObject({ ...valid(), memoryId: "memory:preference_context:cus_1" });

    expect(errors.some((error) => "missingKey" in error && error.missingKey === "memory.memoryId.tier")).toBe(true);
  });

  it("rejects a tier this build does not know, instead of ranking it undefined", () => {
    const errors = validateMemoryObject({ ...valid(), tier: "vibes" } as unknown as AnyMemoryObject);

    expect(errors).toEqual([
      { kind: "knowledge_missing", entityId: "memory:mission_context:cus_1", missingKey: "memory.tier" }
    ]);
  });

  it("rejects unreadable lifecycle timestamps", () => {
    const errors = validateMemoryObject({ ...valid(), updated: "yesterday" });

    expect(errors.some((error) => "missingKey" in error && error.missingKey === "memory.updated")).toBe(true);
  });
});

/**
 * The rule the module exists for. The type system already makes a transcript
 * unrepresentable; storage is JSON, so the ban is enforced structurally too.
 */
describe("memory is structured knowledge, never chat", () => {
  it("finds a transcript hiding under an innocent-looking key", () => {
    expect(findRawConversation({ customerId: "cus_1", messages: [] })).toBe("messages");
    expect(findRawConversation({ knowledge: { nested: { transcript: "hi" } } })).toBe("knowledge.nested.transcript");
    expect(findRawConversation({ entries: [{ text: "..." }] })).toBe("entries.0.text");
  });

  it("finds prose smuggled through a field with a legitimate name", () => {
    const label = "a".repeat(MAX_KNOWLEDGE_STRING_LENGTH + 1);

    expect(findRawConversation({ entries: [{ label }] })).toBe("entries.0.label");
    expect(findRawConversation({ entries: [{ label: "Cake confirmed" }] })).toBeNull();
  });

  it("passes every legitimate tier payload", () => {
    expect(findRawConversation(mission)).toBeNull();
  });

  it("reports raw conversation as a policy violation, with the path", () => {
    const errors = validateMemoryObject({
      ...valid(),
      knowledge: { ...mission, transcript: "so I said…" }
    } as unknown as AnyMemoryObject);

    expect(errors).toEqual([
      { kind: "policy_violation", ruleId: `${NO_RAW_CONVERSATION_RULE}:transcript` }
    ]);
  });
});

describe("screening a batch", () => {
  it("serves what is valid and drops what is not, without throwing", () => {
    const good = valid();
    const bad = { ...valid(), confidence: 12 };

    const screened = screenMemories([good, bad]);

    expect(screened.accepted).toEqual([good]);
    expect(screened.rejected).toHaveLength(1);
    expect(screened.rejected[0]?.memory).toBe(bad);
  });

  it("is atomic per memory — there is no partial version of one statement", () => {
    const screened = screenMemories([{ ...valid(), knowledge: { chat: [] } } as unknown as AnyMemoryObject]);

    expect(screened.accepted).toEqual([]);
  });
});

describe("absent tiers", () => {
  it("names the tier and the customer, so a dashboard can count cold tiers", () => {
    expect(memoryMissing("mission_context", "cus_1")).toEqual({
      kind: "memory_missing",
      tier: "mission_context",
      customerId: "cus_1"
    });
  });
});
