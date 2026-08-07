/**
 * Layer 4 (Memory Engine) — the tier-level retrieval order.
 *
 * `memory.retrieval.ts` (frozen, Epic 03) states the AI Bible v1.2 order over
 * **retrieval sources**: seven places knowledge can come from at answer time,
 * ending in the model's own knowledge. This file states the order over the
 * **six memory tiers** — which is what a retrieval implementation actually
 * loops over, because `general_llm_knowledge` is not stored anywhere and
 * `recent_activity` / `global_user_profile` are Layer 2 concerns.
 *
 * The two orders are not the same list, and the difference is not a rounding
 * error (see `RETRIEVAL_ORDER_DISCREPANCY` below). The frozen constant stays
 * the authority for everything it can express: for every tier the Bible names,
 * this file's order agrees with `RETRIEVAL_PRIORITY` position for position,
 * and `memory.priority.spec.ts` asserts that agreement so the two can never
 * drift silently.
 */
import type { MemoryTier } from "../core";
import {
  RETRIEVAL_PRIORITY,
  retrievalRank,
  type RetrievalPriorityRank,
  type RetrievalSource
} from "./memory.retrieval";

/**
 * The binding retrieval order over memory tiers (Epic 05):
 *
 * WorkspaceTimeline → Mission → Relationship → Preference → Business →
 * Marketplace.
 *
 * A tuple, not a Set: position is the contract, exactly as in the frozen
 * source order. Lower index = consulted first and trusted more on conflict.
 */
export const MEMORY_TIER_RETRIEVAL_ORDER = [
  "workspace_timeline",
  "mission_context",
  "relationship_context",
  "preference_context",
  "business_context",
  "marketplace_context"
] as const satisfies readonly MemoryTier[];

/**
 * Which frozen retrieval source each tier *is*, where the Bible names one.
 *
 * `null` means the Bible's seven-source list has no member for this tier —
 * not that the tier is unranked here. Those two nulls are the whole content
 * of the v1.4 amendment this epic reports.
 */
export const TIER_RETRIEVAL_SOURCE = {
  workspace_timeline: "workspace_timeline",
  mission_context: "mission_context",
  relationship_context: null,
  preference_context: "persistent_preferences",
  business_context: "business_knowledge",
  marketplace_context: null
} as const satisfies Readonly<Record<MemoryTier, RetrievalSource | null>>;

/**
 * The tiers the frozen constant cannot rank.
 *
 * `RelationshipContext` and `MarketplaceContext` were added by the AI Bible
 * v1.3 six-tier extension, but v1.2's retrieval list — which v1.3 left
 * verbatim — predates them. Their rank is therefore defined here and reported
 * for the v1.4 amendment rather than invented into the frozen file: editing a
 * frozen Epic 03 contract to fit an Epic 05 need is exactly the drift these
 * constants exist to prevent.
 */
export const UNRANKED_MEMORY_TIERS = ["relationship_context", "marketplace_context"] as const;

/**
 * The discrepancy, as data, so it is inspectable rather than folklore.
 *
 * Reported in the Epic 05 return for the AI Bible v1.4 amendment; the full
 * proposed wording is in `MEMORY-ENGINE.md`.
 */
export const RETRIEVAL_ORDER_DISCREPANCY = {
  /** Tiers with no member in the frozen seven-source list. */
  unrankedTiers: UNRANKED_MEMORY_TIERS,
  /** Frozen sources that are not memory tiers and are stored by no tier. */
  nonTierSources: ["recent_activity", "global_user_profile", "general_llm_knowledge"],
  /** Where the epic places the tier the frozen list omits. */
  refinement: "relationship_context ranks between mission_context and preference_context"
} as const;

/**
 * A tier's rank in the binding tier order — the value every memory object
 * carries as `retrievalPriority`.
 *
 * For the four tiers the Bible names, this is the frozen order restated (the
 * spec proves it); for the two it does not, this is the rank the amendment
 * proposes.
 */
export function memoryTierRank(tier: MemoryTier): RetrievalPriorityRank {
  return MEMORY_TIER_RETRIEVAL_ORDER.indexOf(tier as (typeof MEMORY_TIER_RETRIEVAL_ORDER)[number]);
}

/**
 * A tier's rank under the frozen `RETRIEVAL_PRIORITY`, or `null` when the
 * frozen list has no source for it. Used by the consistency spec.
 */
export function frozenRetrievalRank(tier: MemoryTier): RetrievalPriorityRank | null {
  const source = TIER_RETRIEVAL_SOURCE[tier];
  return source === null ? null : retrievalRank(source);
}

/** True while the tier's rank comes from this file alone (pending v1.4). */
export function isAmendmentRanked(tier: MemoryTier): boolean {
  return TIER_RETRIEVAL_SOURCE[tier] === null;
}

/** Anything carrying the mandatory `retrievalPriority` field. */
export interface RetrievalRanked {
  readonly tier: MemoryTier;
  readonly retrievalPriority: RetrievalPriorityRank;
}

/**
 * Total order over ranked memories: priority first, then tier name.
 *
 * The tie-break is not decoration — two memories of the same tier can meet in
 * one list (a merged preference, a replayed job result), and a retrieval whose
 * output depends on map iteration order is a retrieval nobody can debug.
 */
export function compareByRetrievalPriority(left: RetrievalRanked, right: RetrievalRanked): number {
  return left.retrievalPriority - right.retrievalPriority || left.tier.localeCompare(right.tier);
}

/** The consulted memories in the order the contract says to consult them. */
export function sortByRetrievalPriority<T extends RetrievalRanked>(memories: readonly T[]): readonly T[] {
  return [...memories].sort(compareByRetrievalPriority);
}

/** Every tier, highest priority first — what a full recall iterates. */
export function tiersInRetrievalOrder(): readonly MemoryTier[] {
  return MEMORY_TIER_RETRIEVAL_ORDER;
}

/** Re-exported so callers never re-derive the frozen contract themselves. */
export { RETRIEVAL_PRIORITY };
