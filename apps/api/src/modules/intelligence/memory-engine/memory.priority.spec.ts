import type { MemoryTier } from "../core";
import {
  compareByRetrievalPriority,
  frozenRetrievalRank,
  isAmendmentRanked,
  MEMORY_TIER_RETRIEVAL_ORDER,
  memoryTierRank,
  RETRIEVAL_ORDER_DISCREPANCY,
  sortByRetrievalPriority,
  TIER_RETRIEVAL_SOURCE,
  UNRANKED_MEMORY_TIERS
} from "./memory.priority";
import { RETRIEVAL_PRIORITY } from "./memory.retrieval";

const ALL_TIERS: readonly MemoryTier[] = [
  "mission_context",
  "preference_context",
  "relationship_context",
  "workspace_timeline",
  "business_context",
  "marketplace_context"
];

describe("the binding tier order", () => {
  it("is the Epic 05 order, position for position", () => {
    expect(MEMORY_TIER_RETRIEVAL_ORDER).toEqual([
      "workspace_timeline",
      "mission_context",
      "relationship_context",
      "preference_context",
      "business_context",
      "marketplace_context"
    ]);
  });

  it("ranks every tier exactly once", () => {
    const ranks = ALL_TIERS.map((tier) => memoryTierRank(tier)).sort((left, right) => left - right);

    expect(ranks).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("puts the workspace timeline first — the plan outranks everything", () => {
    expect(memoryTierRank("workspace_timeline")).toBe(0);
    expect(memoryTierRank("mission_context")).toBeGreaterThan(memoryTierRank("workspace_timeline"));
  });

  it("puts relationship memory between mission and preference (the v1.4 refinement)", () => {
    expect(memoryTierRank("relationship_context")).toBeGreaterThan(memoryTierRank("mission_context"));
    expect(memoryTierRank("relationship_context")).toBeLessThan(memoryTierRank("preference_context"));
  });
});

/**
 * The frozen `RETRIEVAL_PRIORITY` stays the authority for everything it can
 * express. These are the tests that stop the two orders drifting apart in
 * silence — the whole reason the discrepancy is reported rather than patched.
 */
describe("consistency with the frozen RETRIEVAL_PRIORITY", () => {
  const mapped = MEMORY_TIER_RETRIEVAL_ORDER.filter((tier) => frozenRetrievalRank(tier) !== null);

  it("agrees with the Bible order for every tier the Bible names", () => {
    const frozenRanks = mapped.map((tier) => frozenRetrievalRank(tier) as number);

    expect(frozenRanks).toEqual([...frozenRanks].sort((left, right) => left - right));
    // workspace_timeline(0) → mission_context(1) → persistent_preferences(2)
    // → business_knowledge(5), in that order and no other.
    expect(frozenRanks).toEqual([0, 1, 2, 5]);
  });

  it("maps each named tier to the source the Bible actually names", () => {
    expect(TIER_RETRIEVAL_SOURCE.workspace_timeline).toBe("workspace_timeline");
    expect(TIER_RETRIEVAL_SOURCE.mission_context).toBe("mission_context");
    expect(TIER_RETRIEVAL_SOURCE.preference_context).toBe("persistent_preferences");
    expect(TIER_RETRIEVAL_SOURCE.business_context).toBe("business_knowledge");
  });

  it("records exactly the two tiers the frozen constant cannot rank", () => {
    expect([...UNRANKED_MEMORY_TIERS].sort()).toEqual(["marketplace_context", "relationship_context"]);

    for (const tier of UNRANKED_MEMORY_TIERS) {
      expect(frozenRetrievalRank(tier)).toBeNull();
      expect(isAmendmentRanked(tier)).toBe(true);
    }
  });

  it("records the sources that are not memory tiers, so nothing pretends to store them", () => {
    for (const source of RETRIEVAL_ORDER_DISCREPANCY.nonTierSources) {
      expect(RETRIEVAL_PRIORITY).toContain(source);
      expect(Object.values(TIER_RETRIEVAL_SOURCE)).not.toContain(source);
    }

    // The model's own knowledge is last, and no tier claims it.
    expect(RETRIEVAL_PRIORITY[RETRIEVAL_PRIORITY.length - 1]).toBe("general_llm_knowledge");
  });
});

describe("sorting a mixed bag of memories", () => {
  const memories = [
    { tier: "marketplace_context" as const, retrievalPriority: memoryTierRank("marketplace_context") },
    { tier: "mission_context" as const, retrievalPriority: memoryTierRank("mission_context") },
    { tier: "workspace_timeline" as const, retrievalPriority: memoryTierRank("workspace_timeline") },
    { tier: "preference_context" as const, retrievalPriority: memoryTierRank("preference_context") }
  ];

  it("consults them in the binding order", () => {
    expect(sortByRetrievalPriority(memories).map((memory) => memory.tier)).toEqual([
      "workspace_timeline",
      "mission_context",
      "preference_context",
      "marketplace_context"
    ]);
  });

  it("does not mutate the caller's array", () => {
    const original = [...memories];
    sortByRetrievalPriority(memories);

    expect(memories).toEqual(original);
  });

  it("breaks ties by tier name, so the order never depends on iteration order", () => {
    const left = { tier: "business_context" as const, retrievalPriority: 4 };
    const right = { tier: "marketplace_context" as const, retrievalPriority: 4 };

    expect(compareByRetrievalPriority(left, right)).toBeLessThan(0);
    expect(compareByRetrievalPriority(right, left)).toBeGreaterThan(0);
    expect(compareByRetrievalPriority(left, left)).toBe(0);
  });
});
