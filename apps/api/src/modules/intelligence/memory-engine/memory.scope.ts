/**
 * Layer 4 (Memory Engine) — memory identity.
 *
 * A memory object is not free-floating: it is *the* knowledge of one tier
 * about one subject. Two writes about the same customer's preferences are two
 * statements of one memory, not two memories — which is what makes conflict
 * resolution meaningful and writes idempotent.
 *
 * So identity is `(tier, subjectId)`, and everything derives from it: the
 * storage key, the unique index in the M1-gated table, and the `memoryId`
 * doc 23 §9 requires every recommendation to name.
 */
import type { EntityId, MemoryTier } from "../core";

/** What kind of thing a tier is knowledge *about*. */
export type MemorySubjectKind = "customer" | "workspace" | "marketplace";

/**
 * The subject of each tier.
 *
 * Tiers 1–3 and 5 are about a person: what they are planning, what they like,
 * who they plan it with, and which providers their planning touches. Tier 4 is
 * about a plan, so its subject is the workspace. Tier 6 is about the market
 * itself, which belongs to nobody — see `MARKETPLACE_SUBJECT`.
 */
export const TIER_SUBJECT_KIND = {
  mission_context: "customer",
  preference_context: "customer",
  relationship_context: "customer",
  workspace_timeline: "workspace",
  business_context: "customer",
  marketplace_context: "marketplace"
} as const satisfies Readonly<Record<MemoryTier, MemorySubjectKind>>;

/**
 * The subject id of marketplace memory.
 *
 * Manzil is a single-market platform (Tashkent), so "the market" is one
 * subject and one memory object. When the platform becomes multi-city this
 * constant becomes a city id and nothing else in the module changes — the
 * scope key already carries the subject.
 */
export const MARKETPLACE_SUBJECT = "marketplace";

/** One memory's identity: a tier and the entity it is knowledge about. */
export interface MemoryScope {
  readonly tier: MemoryTier;
  readonly subjectId: EntityId;
}

/** Who a recall is for; the pair the frozen `recall()` contract takes. */
export interface MemorySubjects {
  readonly customerId: EntityId;
  readonly workspaceId: EntityId | null;
}

/**
 * The subject of one tier for one recall, or `null` when the recall cannot
 * name one — a customer with no workspace has no workspace timeline, and that
 * is an absence, not an error.
 */
export function subjectFor(tier: MemoryTier, subjects: MemorySubjects): EntityId | null {
  switch (TIER_SUBJECT_KIND[tier]) {
    case "customer":
      return subjects.customerId || null;
    case "workspace":
      return subjects.workspaceId;
    default:
      return MARKETPLACE_SUBJECT;
  }
}

/** The scope of one tier for one recall, or null when there is no subject. */
export function scopeFor(tier: MemoryTier, subjects: MemorySubjects): MemoryScope | null {
  const subjectId = subjectFor(tier, subjects);
  return subjectId === null ? null : { tier, subjectId };
}

/** Stable storage/cache key. Mirrors the `(tier, subjectId)` unique index. */
export function memoryScopeKey(scope: MemoryScope): string {
  return `${scope.tier}|${scope.subjectId}`;
}

/**
 * The `memoryId` of a scope — deterministic on purpose.
 *
 * Doc 23 §9 requires every recommendation to carry the memory ids it
 * consulted. If a rewrite minted a fresh uuid, a trace recorded yesterday
 * would name an id that no longer resolves, and "which memory made this
 * decision?" would be unanswerable the moment memory changed. A derived id
 * keeps the reference stable across every rewrite of the same knowledge, and
 * makes a repeated write land on one row in memory as well as in Postgres.
 */
export function memoryIdOf(scope: MemoryScope): EntityId {
  return `memory:${scope.tier}:${scope.subjectId}`;
}

/** Parses a `memory:tier:subject` id back into its scope, or null. */
export function parseMemoryId(memoryId: EntityId): MemoryScope | null {
  const parts = memoryId.split(":");
  if (parts.length < 3 || parts[0] !== "memory") return null;

  const tier = parts[1] as MemoryTier;
  if (!(tier in TIER_SUBJECT_KIND)) return null;

  const subjectId = parts.slice(2).join(":");
  return subjectId ? { tier, subjectId } : null;
}

/** True when this tier's memory is about the given customer. */
export function isCustomerScoped(tier: MemoryTier): boolean {
  return TIER_SUBJECT_KIND[tier] === "customer";
}

/**
 * Whether a value names one of the six tiers.
 *
 * Storage is JSON and JSON has no unions: a row written by an older build can
 * carry a tier this one does not know, and it must degrade rather than sort
 * into an undefined rank. `TIER_SUBJECT_KIND` is the complete record over
 * `MemoryTier`, so adding a tier keeps this guard correct with no edit.
 */
export function isValidMemoryTier(tier: unknown): tier is MemoryTier {
  return typeof tier === "string" && Object.prototype.hasOwnProperty.call(TIER_SUBJECT_KIND, tier);
}
