import type { MissionKnowledge, PreferenceKnowledge } from "./memory.tiers";
import {
  ageSeconds,
  earlierInstant,
  expiryFor,
  isExpired,
  isVolatileTier,
  MEMORY_TIER_TTL_SECONDS,
  partitionExpired,
  restampMemory,
  scopeOfMemory,
  stampMemory,
  subjectIdOfMemory
} from "./memory.lifecycle";

const NOW = "2026-08-07T09:00:00.000Z";

const mission: MissionKnowledge = {
  customerId: "cus_1",
  experienceType: "birthday",
  targetDate: "2026-08-08",
  guestCount: 6,
  budget: null,
  nearNeighborhoodId: null,
  requiredCapabilityKeys: [],
  workspaceId: null
};

const preferences: PreferenceKnowledge = {
  customerId: "cus_1",
  preferences: [],
  budget: null,
  dietary: [],
  favoriteBusinessIds: []
};

describe("tier volatility", () => {
  it("expires the mission tier and nothing the Bible calls persistent", () => {
    expect(isVolatileTier("mission_context")).toBe(true);
    expect(isVolatileTier("preference_context")).toBe(false);
    expect(isVolatileTier("relationship_context")).toBe(false);
  });

  it("never expires the workspace timeline — the top of the retrieval order", () => {
    // Expiring it would delete the answer to "when is the party?" and have
    // Gurman ask a question the plan already answers (AI Bible v1.1).
    expect(MEMORY_TIER_TTL_SECONDS.workspace_timeline).toBeNull();
    expect(isVolatileTier("workspace_timeline")).toBe(false);
  });

  it("ages the derived caches: business a week, market a day", () => {
    expect(MEMORY_TIER_TTL_SECONDS.business_context).toBe(604_800);
    expect(MEMORY_TIER_TTL_SECONDS.marketplace_context).toBe(86_400);
  });

  it("dates a mission exactly one day out", () => {
    expect(expiryFor("mission_context", NOW)).toBe("2026-08-08T09:00:00.000Z");
    expect(expiryFor("preference_context", NOW)).toBeNull();
  });
});

describe("stamping the mandatory envelope", () => {
  const memory = stampMemory({
    tier: "mission_context",
    subjectId: "cus_1",
    source: "conversation",
    confidence: 0.8,
    knowledge: mission,
    now: NOW
  });

  it("carries every field the frozen contract requires", () => {
    expect(memory).toEqual({
      memoryId: "memory:mission_context:cus_1",
      tier: "mission_context",
      source: "conversation",
      confidence: 0.8,
      created: NOW,
      updated: NOW,
      expires: "2026-08-08T09:00:00.000Z",
      retrievalPriority: 1,
      knowledge: mission
    });
  });

  it("derives the memory id from the scope, so a rewrite keeps its identity", () => {
    const rewritten = stampMemory({
      tier: "mission_context",
      subjectId: "cus_1",
      source: "workspace",
      confidence: 0.9,
      knowledge: { ...mission, guestCount: 8 },
      now: "2026-08-07T10:00:00.000Z"
    });

    expect(rewritten.memoryId).toBe(memory.memoryId);
    expect(subjectIdOfMemory(rewritten)).toBe("cus_1");
    expect(scopeOfMemory(rewritten)).toEqual({ tier: "mission_context", subjectId: "cus_1" });
  });

  it("lets knowledge that dates itself override the tier TTL", () => {
    const dated = stampMemory({
      tier: "mission_context",
      subjectId: "cus_1",
      source: "workspace",
      confidence: 0.9,
      knowledge: mission,
      now: NOW,
      expires: "2026-09-01T00:00:00.000Z"
    });

    expect(dated.expires).toBe("2026-09-01T00:00:00.000Z");
  });

  it("keeps `created` across a re-stamp — how long a belief was held is knowledge", () => {
    const original = stampMemory({
      tier: "preference_context",
      subjectId: "cus_1",
      source: "onboarding",
      confidence: 0.7,
      knowledge: preferences,
      now: "2026-03-01T00:00:00.000Z"
    });

    const updated = restampMemory(original, { ...preferences, favoriteBusinessIds: ["biz_1"] }, NOW);

    expect(updated.created).toBe("2026-03-01T00:00:00.000Z");
    expect(updated.updated).toBe(NOW);
    expect(updated.memoryId).toBe(original.memoryId);
    expect(updated.knowledge.favoriteBusinessIds).toEqual(["biz_1"]);
  });
});

describe("expiry", () => {
  const volatile = stampMemory({
    tier: "mission_context",
    subjectId: "cus_1",
    source: "conversation",
    confidence: 0.8,
    knowledge: mission,
    now: NOW
  });

  const persistent = stampMemory({
    tier: "preference_context",
    subjectId: "cus_1",
    source: "onboarding",
    confidence: 0.8,
    knowledge: preferences,
    now: NOW
  });

  it("holds a mission for its day and drops it the instant it is due", () => {
    expect(isExpired(volatile, "2026-08-08T08:59:59.999Z")).toBe(false);
    expect(isExpired(volatile, "2026-08-08T09:00:00.000Z")).toBe(true);
  });

  it("never expires a preference, however long it sits", () => {
    expect(isExpired(persistent, "2030-01-01T00:00:00.000Z")).toBe(false);
  });

  it("treats an unreadable expiry as expired rather than as forever", () => {
    expect(isExpired({ expires: "not-a-date" }, NOW)).toBe(true);
  });

  it("splits a batch into what may still be served and what may not", () => {
    const { live, expired } = partitionExpired([volatile, persistent], "2026-08-09T00:00:00.000Z");

    expect(live).toEqual([persistent]);
    expect(expired).toEqual([volatile]);
  });

  it("measures freshness in whole seconds, never negative", () => {
    expect(ageSeconds(persistent, "2026-08-07T09:01:30.000Z")).toBe(90);
    expect(ageSeconds(persistent, "2026-08-07T08:00:00.000Z")).toBe(0);
  });
});

describe("earlierInstant", () => {
  it("keeps the older birth date", () => {
    expect(earlierInstant("2026-03-01T00:00:00.000Z", NOW)).toBe("2026-03-01T00:00:00.000Z");
    expect(earlierInstant(NOW, "2026-03-01T00:00:00.000Z")).toBe("2026-03-01T00:00:00.000Z");
  });

  it("prefers the readable one", () => {
    expect(earlierInstant("nonsense", NOW)).toBe(NOW);
    expect(earlierInstant(NOW, "nonsense")).toBe(NOW);
  });
});
