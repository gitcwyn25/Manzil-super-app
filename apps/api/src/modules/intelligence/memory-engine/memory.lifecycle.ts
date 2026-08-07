/**
 * Layer 4 (Memory Engine) — the lifecycle of a memory object: stamped,
 * aged, expired.
 *
 * AI Bible v1.2 is explicit that the tiers must never be confused: Mission
 * Context is volatile and "destroyed when appropriate", Preference Context
 * "lives across months". That distinction is a *policy*, so it lives here as
 * data — `MEMORY_TIER_TTL_SECONDS` — instead of as an `if` inside whichever
 * service happened to need it first.
 *
 * Everything in this file is pure. Time arrives as an argument, never from
 * `Date.now()`, because "the same job twice yields the identical result"
 * (doc 23 §4) is not assertable about a function that reads the wall clock.
 */
import type {
  Confidence,
  EntityId,
  IsoDateTime,
  KnowledgeSource,
  MemoryTier
} from "../core";
import { memoryTierRank } from "./memory.priority";
import { memoryIdOf, type MemoryScope } from "./memory.scope";
import type { AnyMemoryObject, MemoryObject } from "./memory.tiers";

/**
 * How long each tier's knowledge stays true, in seconds; `null` = does not
 * expire on its own.
 *
 * - **mission_context — 24h.** Today's objective, by definition. A mission
 *   that outlives its day starts answering tomorrow's questions with
 *   yesterday's guest count.
 * - **preference_context / relationship_context — never.** Durable tastes and
 *   the people you celebrate with are the knowledge that makes next year's
 *   plan start from context instead of zero. They change by being contradicted
 *   (see `memory.conflict.ts`), never by aging out.
 * - **workspace_timeline — never.** The highest-priority tier of all: if the
 *   plan holds a date, Gurman must not ask for it again (Bible v1.1). Expiring
 *   it would silently delete the top of the retrieval order and make the
 *   assistant re-ask questions it has the answers to. It changes when the plan
 *   changes.
 * - **business_context — 7 days.** A carried copy of stored Layer 2 profiles;
 *   a week-old copy of a summary is a copy worth refreshing.
 * - **marketplace_context — 24h.** "Weekend is crowded" is a claim about a
 *   market that moves daily.
 */
export const MEMORY_TIER_TTL_SECONDS = {
  mission_context: 86_400,
  preference_context: null,
  relationship_context: null,
  workspace_timeline: null,
  business_context: 604_800,
  marketplace_context: 86_400
} as const satisfies Readonly<Record<MemoryTier, number | null>>;

/** True when the tier expires on its own (AI Bible: the volatile tiers). */
export function isVolatileTier(tier: MemoryTier): boolean {
  return MEMORY_TIER_TTL_SECONDS[tier] !== null;
}

/** The expiry instant for a tier written at `from`, or null if it persists. */
export function expiryFor(tier: MemoryTier, from: IsoDateTime): IsoDateTime | null {
  const ttl = MEMORY_TIER_TTL_SECONDS[tier];
  if (ttl === null) return null;

  const base = Date.parse(from);
  if (Number.isNaN(base)) return null;

  return new Date(base + ttl * 1000).toISOString();
}

/**
 * Whether a memory is past its expiry at `now`.
 *
 * Expiry is a half-open interval: a memory expiring at exactly `now` is gone,
 * so a 24h mission is dead 24h after it was written and not a millisecond
 * later. Unparseable timestamps count as expired — a memory whose lifecycle
 * cannot be read is not a memory anyone should reason from.
 */
export function isExpired(memory: Pick<AnyMemoryObject, "expires">, now: IsoDateTime): boolean {
  if (memory.expires === null) return false;

  const expiresAt = Date.parse(memory.expires);
  if (Number.isNaN(expiresAt)) return true;

  const at = Date.parse(now);
  return Number.isNaN(at) ? true : at >= expiresAt;
}

/** Seconds since the memory was last updated — the doc 23 §8 freshness metric. */
export function ageSeconds(memory: Pick<AnyMemoryObject, "updated">, now: IsoDateTime): number {
  const updated = Date.parse(memory.updated);
  const at = Date.parse(now);
  if (Number.isNaN(updated) || Number.isNaN(at)) return 0;

  return Math.max(0, Math.round((at - updated) / 1000));
}

/** Everything needed to mint a memory object; the envelope is derived. */
export interface MemoryStamp<TTier extends MemoryTier, TKnowledge extends object> {
  readonly tier: TTier;
  readonly subjectId: EntityId;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly knowledge: TKnowledge;
  readonly now: IsoDateTime;
  /** Preserved across rewrites; defaults to `now` for a first write. */
  readonly created?: IsoDateTime;
  /**
   * Overrides the tier's TTL. Used only where the knowledge itself dates the
   * memory — a mission for next Saturday expires after next Saturday, not 24h
   * from when it was typed.
   */
  readonly expires?: IsoDateTime | null;
}

/**
 * Builds the mandatory envelope around a knowledge payload.
 *
 * This is the only place a memory object is constructed, which is what makes
 * "every memory carries source, confidence, created, updated, expires,
 * retrievalPriority" true by construction rather than by review.
 */
export function stampMemory<TTier extends MemoryTier, TKnowledge extends object>(
  stamp: MemoryStamp<TTier, TKnowledge>
): MemoryObject<TTier, TKnowledge> {
  const scope: MemoryScope = { tier: stamp.tier, subjectId: stamp.subjectId };

  return {
    memoryId: memoryIdOf(scope),
    tier: stamp.tier,
    source: stamp.source,
    confidence: stamp.confidence,
    created: stamp.created ?? stamp.now,
    updated: stamp.now,
    expires: stamp.expires === undefined ? expiryFor(stamp.tier, stamp.now) : stamp.expires,
    retrievalPriority: memoryTierRank(stamp.tier),
    knowledge: stamp.knowledge
  };
}

/**
 * Re-stamps a memory with new knowledge, keeping its identity and birth.
 *
 * `created` survives because a preference learned in March that is restated
 * today is still knowledge the platform has held since March — resetting it
 * would erase how long the platform has believed something, which is exactly
 * what recency-based conflict resolution reads.
 */
export function restampMemory<TTier extends MemoryTier, TKnowledge extends object>(
  memory: MemoryObject<TTier, TKnowledge>,
  knowledge: TKnowledge,
  now: IsoDateTime,
  overrides?: { readonly source?: KnowledgeSource; readonly confidence?: Confidence }
): MemoryObject<TTier, TKnowledge> {
  const scope = { tier: memory.tier, subjectId: subjectIdOfMemory(memory) };

  return stampMemory({
    tier: memory.tier,
    subjectId: scope.subjectId,
    source: overrides?.source ?? memory.source,
    confidence: overrides?.confidence ?? memory.confidence,
    knowledge,
    now,
    created: memory.created
  });
}

/**
 * The subject a memory belongs to, read back off its own id.
 *
 * The id is derived from `(tier, subjectId)`, so this is a lossless inverse —
 * which is why the subject does not need to be a seventh envelope field on the
 * frozen contract.
 */
export function subjectIdOfMemory(memory: Pick<AnyMemoryObject, "memoryId" | "tier">): EntityId {
  const prefix = `memory:${memory.tier}:`;
  return memory.memoryId.startsWith(prefix) ? memory.memoryId.slice(prefix.length) : memory.memoryId;
}

/** The scope a memory occupies — its slot in storage. */
export function scopeOfMemory(memory: Pick<AnyMemoryObject, "memoryId" | "tier">): MemoryScope {
  return { tier: memory.tier, subjectId: subjectIdOfMemory(memory) };
}

/** Earlier of two ISO instants; an unreadable one loses. */
export function earlierInstant(left: IsoDateTime, right: IsoDateTime): IsoDateTime {
  const leftAt = Date.parse(left);
  const rightAt = Date.parse(right);
  if (Number.isNaN(leftAt)) return right;
  if (Number.isNaN(rightAt)) return left;
  return leftAt <= rightAt ? left : right;
}

/** Splits memories into what may still be read and what has aged out. */
export function partitionExpired<T extends Pick<AnyMemoryObject, "expires">>(
  memories: readonly T[],
  now: IsoDateTime
): { readonly live: readonly T[]; readonly expired: readonly T[] } {
  const live: T[] = [];
  const expired: T[] = [];

  for (const memory of memories) {
    (isExpired(memory, now) ? expired : live).push(memory);
  }

  return { live, expired };
}
