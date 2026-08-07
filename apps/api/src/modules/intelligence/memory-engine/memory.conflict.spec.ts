import type { KnowledgeFact, MoneyAmount } from "../core";
import {
  MEMORY_SOURCE_PRECEDENCE,
  MIN_DISPLACEMENT_CONFIDENCE,
  mergeMemoryPair,
  mergePreferenceKnowledge,
  RECENCY_CONFIDENCE_TOLERANCE,
  resolveClaim,
  resolveFactConflict,
  resolveMemoryConflict,
  sourceRank
} from "./memory.conflict";
import { stampMemory } from "./memory.lifecycle";
import type { PreferenceKnowledge } from "./memory.tiers";

const MARCH = "2026-03-01T00:00:00.000Z";
const AUGUST = "2026-08-07T09:00:00.000Z";

function money(amountMinor: number): MoneyAmount {
  return { amountMinor, currency: "UZS" };
}

function preference(dimension: string, value: string, fact: Partial<KnowledgeFact<string>> = {}) {
  return {
    dimension,
    fact: {
      value,
      source: "conversation" as const,
      confidence: 0.8,
      observedAt: AUGUST,
      ...fact
    }
  };
}

function preferenceMemory(knowledge: PreferenceKnowledge, at: string, confidence: number, source: "onboarding" | "conversation" | "platform_inference" = "conversation") {
  return stampMemory({
    tier: "preference_context",
    subjectId: knowledge.customerId,
    source,
    confidence,
    knowledge,
    now: at
  });
}

const emptyPreferences: PreferenceKnowledge = {
  customerId: "cus_1",
  preferences: [],
  budget: null,
  dietary: [],
  favoriteBusinessIds: []
};

describe("the resolution rule", () => {
  it("lets a fresh claim supersede an equally-sure old one — the changed budget case", () => {
    const resolution = resolveClaim(
      { confidence: 0.8, at: MARCH, source: "conversation" },
      { confidence: 0.8, at: AUGUST, source: "conversation" }
    );

    expect(resolution).toEqual({ winner: "incoming", reason: "recency" });
  });

  it("lets a slightly less certain fresh claim win, within the tolerance", () => {
    const resolution = resolveClaim(
      { confidence: 0.9, at: MARCH, source: "onboarding" },
      { confidence: 0.9 - RECENCY_CONFIDENCE_TOLERANCE, at: AUGUST, source: "conversation" }
    );

    expect(resolution.winner).toBe("incoming");
    expect(resolution.reason).toBe("recency");
  });

  it("stops a materially weaker fresh claim: past the tolerance, confidence decides", () => {
    const resolution = resolveClaim(
      { confidence: 0.9, at: MARCH, source: "onboarding" },
      { confidence: 0.6, at: AUGUST, source: "platform_inference" }
    );

    expect(resolution).toEqual({ winner: "existing", reason: "confidence" });
  });

  it("never lets a guess displace knowledge, however fresh", () => {
    const resolution = resolveClaim(
      { confidence: 0.9, at: MARCH, source: "verification" },
      { confidence: MIN_DISPLACEMENT_CONFIDENCE - 0.01, at: AUGUST, source: "platform_inference" }
    );

    expect(resolution).toEqual({ winner: "existing", reason: "confidence_floor" });
  });

  it("falls to source precedence when nothing else separates the claims", () => {
    const resolution = resolveClaim(
      { confidence: 0.8, at: AUGUST, source: "platform_inference" },
      { confidence: 0.8, at: AUGUST, source: "onboarding" }
    );

    expect(resolution).toEqual({ winner: "incoming", reason: "source_precedence" });
  });

  it("keeps what it has when the two claims are indistinguishable — a replay is a no-op", () => {
    const resolution = resolveClaim(
      { confidence: 0.8, at: AUGUST, source: "conversation" },
      { confidence: 0.8, at: AUGUST, source: "conversation" }
    );

    expect(resolution).toEqual({ winner: "existing", reason: "stable_tie" });
  });

  it("never averages: the winner's value is a value somebody actually stated", () => {
    const existing = preferenceMemory({ ...emptyPreferences, budget: { min: null, max: money(200_000_000) } }, MARCH, 0.8);
    const incoming = preferenceMemory({ ...emptyPreferences, budget: { min: null, max: money(500_000_000) } }, AUGUST, 0.8);

    const merged = mergeMemoryPair(existing, incoming, resolveMemoryConflict(existing, incoming));

    expect((merged.knowledge as PreferenceKnowledge).budget?.max).toEqual(money(500_000_000));
  });

  it("ranks sources: verified beats stated beats inferred", () => {
    expect(sourceRank("verification")).toBeLessThan(sourceRank("conversation"));
    expect(sourceRank("conversation")).toBeLessThan(sourceRank("platform_inference"));
    expect(MEMORY_SOURCE_PRECEDENCE[MEMORY_SOURCE_PRECEDENCE.length - 1]).toBe("platform_inference");
  });

  it("treats an absent memory as no conflict at all", () => {
    const incoming = preferenceMemory(emptyPreferences, AUGUST, 0.5);

    expect(resolveMemoryConflict(null, incoming)).toEqual({ winner: "incoming", reason: "no_conflict" });
  });

  it("reads observation time for facts and update time for memories", () => {
    const older: KnowledgeFact<string> = { value: "italian", source: "conversation", confidence: 0.8, observedAt: MARCH };
    const newer: KnowledgeFact<string> = { value: "japanese", source: "conversation", confidence: 0.8, observedAt: AUGUST };

    expect(resolveFactConflict(older, newer)).toEqual({ winner: "incoming", reason: "recency" });
  });
});

describe("merging preference knowledge", () => {
  const existing: PreferenceKnowledge = {
    customerId: "cus_1",
    preferences: [preference("cuisine", "italian", { observedAt: MARCH }), preference("seating", "outdoor", { observedAt: MARCH })],
    budget: { min: null, max: money(200_000_000) },
    dietary: [{ value: "halal", source: "onboarding", confidence: 0.9, observedAt: MARCH }],
    favoriteBusinessIds: ["biz_1", "biz_2"]
  };

  const incoming: PreferenceKnowledge = {
    customerId: "cus_1",
    preferences: [preference("cuisine", "japanese"), preference("music", "quiet")],
    budget: { min: null, max: money(500_000_000) },
    dietary: [{ value: "vegetarian", source: "conversation", confidence: 0.7, observedAt: AUGUST }],
    favoriteBusinessIds: ["biz_3"]
  };

  const resolution = { winner: "incoming" as const, reason: "recency" as const };
  const merged = mergePreferenceKnowledge(existing, incoming, resolution);

  it("resolves a contradiction inside one dimension", () => {
    expect(merged.preferences.find((entry) => entry.dimension === "cuisine")?.fact.value).toBe("japanese");
  });

  it("keeps what the loser knew about dimensions nobody contested", () => {
    // "Prefers Japanese" says nothing about seating; dropping it would lose
    // knowledge to a write that never disagreed with it.
    expect(merged.preferences.find((entry) => entry.dimension === "seating")?.fact.value).toBe("outdoor");
    expect(merged.preferences.find((entry) => entry.dimension === "music")?.fact.value).toBe("quiet");
  });

  it("takes the winner's budget whole, never a blend of the two", () => {
    expect(merged.budget?.max).toEqual(money(500_000_000));
  });

  it("unions set-valued knowledge — an omission is not a denial", () => {
    expect(merged.favoriteBusinessIds).toEqual(["biz_3", "biz_1", "biz_2"]);
    expect(merged.dietary.map((fact) => fact.value)).toEqual(["halal", "vegetarian"]);
  });

  it("still states a budget when only the loser had one", () => {
    const silent = { ...incoming, budget: null };
    const result = mergePreferenceKnowledge(existing, silent, resolution);

    expect(result.budget?.max).toEqual(money(200_000_000));
  });

  it("is idempotent: merging a payload with itself changes nothing", () => {
    expect(mergePreferenceKnowledge(merged, merged, { winner: "existing", reason: "stable_tie" })).toEqual(merged);
  });
});

describe("merging whole memories", () => {
  it("keeps the older birth date whichever claim wins", () => {
    const existing = preferenceMemory(emptyPreferences, MARCH, 0.8);
    const incoming = preferenceMemory(emptyPreferences, AUGUST, 0.8);

    const merged = mergeMemoryPair(existing, incoming, resolveMemoryConflict(existing, incoming));

    expect(merged.created).toBe(MARCH);
    expect(merged.updated).toBe(AUGUST);
  });

  it("replaces wholesale outside the preference tier — a mission is one statement", () => {
    const knowledge = {
      customerId: "cus_1",
      experienceType: "birthday" as const,
      targetDate: "2026-08-08",
      guestCount: 6,
      budget: null,
      nearNeighborhoodId: null,
      requiredCapabilityKeys: [],
      workspaceId: null
    };

    const existing = stampMemory({
      tier: "mission_context",
      subjectId: "cus_1",
      source: "conversation",
      confidence: 0.8,
      knowledge,
      now: MARCH
    });
    const incoming = stampMemory({
      tier: "mission_context",
      subjectId: "cus_1",
      source: "workspace",
      confidence: 0.8,
      knowledge: { ...knowledge, guestCount: 10 },
      now: AUGUST
    });

    const merged = mergeMemoryPair(existing, incoming, resolveMemoryConflict(existing, incoming));

    expect(merged.knowledge).toEqual({ ...knowledge, guestCount: 10 });
  });
});
