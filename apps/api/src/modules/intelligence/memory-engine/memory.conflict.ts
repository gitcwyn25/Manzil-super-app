/**
 * Layer 4 (Memory Engine) — conflict resolution.
 *
 * Two statements about the same `(tier, subject)` are two claims about one
 * fact, and one of them has to win. The rule below is lexicographic,
 * deterministic, and **never averages**: a customer whose budget moved from
 * 2M to 5M does not have a 3.5M budget, and a platform that says so has
 * invented a preference nobody holds.
 *
 * The order — confidence floor, then recency, then confidence, then source
 * precedence — encodes one idea: *memory states what is true now*. Recency
 * therefore leads, because the canonical conflict is a preference that
 * changed, and a rule that let an old high-confidence claim outlast a fresh
 * statement would make the assistant argue with its user. It is fenced on both
 * sides: a claim below `MIN_DISPLACEMENT_CONFIDENCE` never displaces real
 * knowledge, and a claim materially less certain than what it would overwrite
 * (`RECENCY_CONFIDENCE_TOLERANCE`) loses to confidence instead.
 *
 * Pure module: no clock, no storage, no logging.
 */
import type { Confidence, IsoDateTime, KnowledgeFact, KnowledgeSource } from "../core";
import type { CustomerPreference } from "../customer-intelligence";
import { earlierInstant } from "./memory.lifecycle";
import type { AnyMemoryObject, MemoryObject, PreferenceKnowledge } from "./memory.tiers";

/**
 * Source precedence, most trusted first.
 *
 * What a human confirmed outranks what a human said in passing, which
 * outranks what the platform inferred. `verification` is a checked fact;
 * `onboarding` and `workspace` are the user acting deliberately; `booking`
 * and `visit` are things that provably happened; `platform_inference` is the
 * platform's own guess and sits last on purpose.
 */
export const MEMORY_SOURCE_PRECEDENCE = [
  "verification",
  "onboarding",
  "workspace",
  "conversation",
  "booking",
  "visit",
  "review",
  "story",
  "campaign",
  "merchant_input",
  "platform_inference"
] as const satisfies readonly KnowledgeSource[];

/** Rank of a source; unknown sources sort last rather than throwing. */
export function sourceRank(source: KnowledgeSource): number {
  const index = MEMORY_SOURCE_PRECEDENCE.indexOf(source as (typeof MEMORY_SOURCE_PRECEDENCE)[number]);
  return index === -1 ? MEMORY_SOURCE_PRECEDENCE.length : index;
}

/**
 * A claim below this confidence never displaces an existing memory.
 *
 * A guess does not overwrite knowledge. It can still *become* knowledge where
 * none existed — a first memory is written at whatever confidence it has,
 * because holding nothing is not more honest than holding a weak fact that
 * says it is weak.
 */
export const MIN_DISPLACEMENT_CONFIDENCE = 0.3;

/**
 * How much less certain a newer claim may be and still win on recency.
 *
 * Beyond this gap the newer claim is not an update, it is a worse claim, and
 * confidence decides instead.
 */
export const RECENCY_CONFIDENCE_TOLERANCE = 0.25;

/** Which of the two competing claims the rule kept. */
export type MemoryConflictWinner = "existing" | "incoming";

/**
 * Why. Recorded on every write so a changed memory can always be explained —
 * "why did my budget change?" is a question the platform must answer with a
 * rule name, not a shrug.
 */
export type MemoryConflictReason =
  | "no_conflict"
  | "confidence_floor"
  | "recency"
  | "confidence"
  | "source_precedence"
  | "stable_tie";

export interface MemoryConflictResolution {
  readonly winner: MemoryConflictWinner;
  readonly reason: MemoryConflictReason;
}

/** The three fields the rule reads; shared by memories and by facts. */
export interface ConflictingClaim {
  readonly confidence: Confidence;
  readonly at: IsoDateTime;
  readonly source: KnowledgeSource;
}

function parseAt(at: IsoDateTime): number {
  const parsed = Date.parse(at);
  // An unreadable timestamp cannot win on recency; treating it as the epoch
  // makes it lose that step rather than corrupt the comparison.
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * THE rule. Applied identically to whole memory objects and to the individual
 * facts inside a preference payload, so the two can never diverge.
 */
export function resolveClaim(
  existing: ConflictingClaim,
  incoming: ConflictingClaim
): MemoryConflictResolution {
  // 1. Confidence floor — a guess never displaces knowledge.
  if (incoming.confidence < MIN_DISPLACEMENT_CONFIDENCE && existing.confidence >= MIN_DISPLACEMENT_CONFIDENCE) {
    return { winner: "existing", reason: "confidence_floor" };
  }

  // 2. Recency — memory states what is true now, provided the newer claim is
  //    not materially less certain than what it replaces.
  const newer = parseAt(incoming.at) > parseAt(existing.at);
  if (newer && incoming.confidence >= existing.confidence - RECENCY_CONFIDENCE_TOLERANCE) {
    return { winner: "incoming", reason: "recency" };
  }

  // 3. Confidence — otherwise the surer claim wins.
  if (incoming.confidence > existing.confidence) return { winner: "incoming", reason: "confidence" };
  if (existing.confidence > incoming.confidence) return { winner: "existing", reason: "confidence" };

  // 4. Source precedence — equally sure, equally old: trust the better source.
  const incomingRank = sourceRank(incoming.source);
  const existingRank = sourceRank(existing.source);
  if (incomingRank < existingRank) return { winner: "incoming", reason: "source_precedence" };
  if (existingRank < incomingRank) return { winner: "existing", reason: "source_precedence" };

  // 5. Nothing distinguishes them, so nothing changes. Keeping the existing
  //    memory is what makes a replayed write a no-op instead of a rewrite with
  //    a fresh `updated` — idempotency, at the resolution layer.
  return { winner: "existing", reason: "stable_tie" };
}

/** The rule, applied to two memory objects of the same tier and subject. */
export function resolveMemoryConflict(
  existing: AnyMemoryObject | null,
  incoming: AnyMemoryObject
): MemoryConflictResolution {
  if (!existing) return { winner: "incoming", reason: "no_conflict" };

  return resolveClaim(
    { confidence: existing.confidence, at: existing.updated, source: existing.source },
    { confidence: incoming.confidence, at: incoming.updated, source: incoming.source }
  );
}

/** The rule, applied to two structured facts. */
export function resolveFactConflict<TValue>(
  existing: KnowledgeFact<TValue>,
  incoming: KnowledgeFact<TValue>
): MemoryConflictResolution {
  return resolveClaim(
    { confidence: existing.confidence, at: existing.observedAt, source: existing.source },
    { confidence: incoming.confidence, at: incoming.observedAt, source: incoming.source }
  );
}

/** Ceiling on a merged favourites list, so a union cannot grow forever. */
export const MAX_FAVORITE_BUSINESS_IDS = 20;

/** Ceiling on merged preference dimensions, for the same reason. */
export const MAX_PREFERENCE_DIMENSIONS = 50;

function winnerOf<T>(resolution: MemoryConflictResolution, existing: T, incoming: T): T {
  return resolution.winner === "incoming" ? incoming : existing;
}

/**
 * Merges two preference payloads, dimension by dimension.
 *
 * A preference memory is not one claim, it is a bag of them: "prefers
 * Japanese" and "budget 2M" do not contradict each other, and resolving the
 * whole object would throw away everything the loser knew. So conflicts are
 * resolved *within* a dimension and the rest is kept from both.
 *
 * Set-valued knowledge (favourites, dietary facts) unions rather than
 * replaces: a write that fails to mention a favourite restaurant is not a
 * claim that it stopped being one. Absence is not denial — and both lists are
 * bounded so a union cannot grow without limit.
 */
export function mergePreferenceKnowledge(
  existing: PreferenceKnowledge,
  incoming: PreferenceKnowledge,
  resolution: MemoryConflictResolution
): PreferenceKnowledge {
  const byDimension = new Map<string, CustomerPreference>();

  for (const preference of existing.preferences) {
    byDimension.set(preference.dimension, preference);
  }

  for (const preference of incoming.preferences) {
    const current = byDimension.get(preference.dimension);

    if (!current) {
      byDimension.set(preference.dimension, preference);
      continue;
    }

    const perDimension = resolveFactConflict(current.fact, preference.fact);
    byDimension.set(preference.dimension, winnerOf(perDimension, current, preference));
  }

  const preferences = [...byDimension.values()]
    .sort((left, right) => left.dimension.localeCompare(right.dimension))
    .slice(0, MAX_PREFERENCE_DIMENSIONS);

  // Winner's favourites first, then the loser's: the order is the ranking a
  // caller sees, and the union is what stops an omission reading as a denial.
  const favoritesFirst = winnerOf(resolution, existing.favoriteBusinessIds, incoming.favoriteBusinessIds);
  const favoritesSecond = winnerOf(resolution, incoming.favoriteBusinessIds, existing.favoriteBusinessIds);

  return {
    // The subject cannot differ — both payloads come from one scope — but the
    // winner's copy is used so the merged object is self-consistent.
    customerId: winnerOf(resolution, existing.customerId, incoming.customerId),
    preferences,
    // A budget is a single claim, so the object-level resolution decides it;
    // a payload that states no budget makes no claim and cannot win by
    // silence.
    budget: pickClaim(resolution, existing.budget, incoming.budget),
    dietary: mergeFacts(existing.dietary, incoming.dietary),
    favoriteBusinessIds: [...new Set([...favoritesFirst, ...favoritesSecond])].slice(
      0,
      MAX_FAVORITE_BUSINESS_IDS
    )
  };
}

/** The winner's value, unless it has none to state. */
function pickClaim<T>(resolution: MemoryConflictResolution, existing: T | null, incoming: T | null): T | null {
  const preferred = winnerOf(resolution, existing, incoming);
  const other = winnerOf(resolution, incoming, existing);
  return preferred ?? other;
}

/** Unions facts by value, keeping the stronger statement of each. */
function mergeFacts<TValue extends string>(
  existing: readonly KnowledgeFact<TValue>[],
  incoming: readonly KnowledgeFact<TValue>[]
): readonly KnowledgeFact<TValue>[] {
  const byValue = new Map<TValue, KnowledgeFact<TValue>>();

  for (const fact of existing) {
    byValue.set(fact.value, fact);
  }

  for (const fact of incoming) {
    const current = byValue.get(fact.value);
    byValue.set(fact.value, current ? winnerOf(resolveFactConflict(current, fact), current, fact) : fact);
  }

  return [...byValue.values()].sort((left, right) => String(left.value).localeCompare(String(right.value)));
}

/** True when both memories occupy the same slot, so a conflict is possible. */
export function isSameScope(left: AnyMemoryObject, right: AnyMemoryObject): boolean {
  return left.tier === right.tier && left.memoryId === right.memoryId;
}

/** A memory object of the preference tier, narrowed for the merge helpers. */
export type PreferenceMemory = MemoryObject<"preference_context", PreferenceKnowledge>;

/**
 * Combines two claims about one slot into the memory that slot should hold.
 *
 * Five tiers are a single statement, so the winner *is* the memory. The
 * preference tier is a bag of independent statements, so its payloads merge
 * dimension by dimension and only genuinely competing claims are decided —
 * resolving the whole object there would throw away everything the loser knew.
 *
 * `created` always survives from the older of the two: how long the platform
 * has held a belief is itself knowledge, and it is what recency-based
 * resolution reads next time.
 *
 * Pure, and shared by the write path and the read-time overlay, so a memory
 * assembled during a recall and a memory written by a job are combined by
 * exactly the same rule.
 */
export function mergeMemoryPair(
  existing: AnyMemoryObject | null,
  incoming: AnyMemoryObject,
  resolution: MemoryConflictResolution
): AnyMemoryObject {
  if (!existing) return incoming;

  const winner = resolution.winner === "incoming" ? incoming : existing;
  const created = earlierInstant(existing.created, incoming.created);

  if (existing.tier === "preference_context" && incoming.tier === "preference_context") {
    return {
      ...(winner as PreferenceMemory),
      created,
      knowledge: mergePreferenceKnowledge(existing.knowledge, incoming.knowledge, resolution)
    };
  }

  return { ...winner, created } as AnyMemoryObject;
}
