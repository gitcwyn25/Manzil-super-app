/**
 * Layer 4.5 (Hybrid Retrieval) — where each engine stands in the binding order.
 *
 * ADR-006 makes four of its seven principles statements about *precedence*:
 * structured knowledge outranks semantic similarity, memory outranks
 * embeddings, workspace context outranks generic recommendations, and vector
 * search is optional. All four are one decision — the order in which engines
 * are trusted — and this file is that decision as data, checked against the
 * frozen `RETRIEVAL_PRIORITY` rather than restating it.
 *
 * Epic 05 hit the same problem one layer down and solved it the same way
 * (`memory.priority.ts`): declare the order this layer actually loops over,
 * map each entry onto the frozen constant where the AI Bible names a source,
 * and report the entries it cannot name as a documented amendment instead of
 * editing a frozen file. `retrieval-priority.spec.ts` asserts the agreement,
 * so the two orders can never drift silently.
 */
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { CONTEXT_ASSEMBLY_PRIORITY } from "../orchestrator-contracts/context-window.contract";
import {
  RETRIEVAL_PRIORITY,
  retrievalRank,
  type RetrievalPriorityRank,
  type RetrievalSource
} from "../memory-engine";
import type { RetrievalEngineId } from "./hybrid-retrieval.types";

/**
 * The binding engine order:
 *
 * Workspace → Memory → Feature Store → Knowledge Graph → Business →
 * Marketplace → Semantic.
 *
 * A tuple, not a Set: position is the contract. Lower index = consulted with
 * more trust, and on a merge the lower-index engine owns the item. The tail is
 * the load-bearing part — Semantic is *last, always*, which is what makes
 * "vector search optional, never mandatory" a structural fact rather than a
 * promise.
 */
export const ENGINE_RETRIEVAL_ORDER = [
  "workspace",
  "memory",
  "feature_store",
  "knowledge_graph",
  "business",
  "marketplace",
  "semantic"
] as const satisfies readonly RetrievalEngineId[];

/**
 * Which frozen retrieval source each engine speaks for.
 *
 * `null` means the AI Bible v1.2 seven-source list has no member for this
 * engine — not that the engine is unranked here. One entry is null and it is
 * reported below, exactly as Epic 05 reported its two unranked tiers.
 *
 * Two mappings are worth defending:
 *
 * - **feature_store → `global_user_profile`.** The feature store's customer
 *   vector *is* the global profile the Bible ranks fourth; its business and
 *   neighborhood vectors are derived from the same pipeline. Placing it above
 *   `business_knowledge` is the Bible's own ordering, not a preference of
 *   ours: what we know about *this person* outranks what we know about
 *   providers in general.
 * - **semantic → `general_llm_knowledge`.** The Bible's last source is
 *   "knowledge that is not ours". A vector index queried with an embedding
 *   computed by a model is precisely that, and it lands in the one slot the
 *   Bible already marked as the final fallback, never a peer.
 */
export const ENGINE_RETRIEVAL_SOURCE = {
  workspace: "workspace_timeline",
  memory: "mission_context",
  feature_store: "global_user_profile",
  knowledge_graph: "business_knowledge",
  business: "business_knowledge",
  marketplace: null,
  semantic: "general_llm_knowledge"
} as const satisfies Readonly<Record<RetrievalEngineId, RetrievalSource | null>>;

/**
 * The engine the frozen constant cannot rank.
 *
 * `marketplace` retrieves city-and-market awareness — trends, demand pressure,
 * neighborhood character. The AI Bible v1.2 list predates the marketplace
 * context tier (added in v1.3, which left the retrieval list verbatim), so
 * there is no source to map it to. Its rank is therefore defined here, between
 * `business_knowledge` and `general_llm_knowledge`, and reported for the v1.4
 * amendment rather than invented into the frozen file.
 */
export const UNRANKED_RETRIEVAL_ENGINES = ["marketplace"] as const;

/** The discrepancy as data, so it is inspectable rather than folklore. */
export const RETRIEVAL_SOURCE_DISCREPANCY = {
  unrankedEngines: UNRANKED_RETRIEVAL_ENGINES,
  /** Frozen sources no engine serves — the honest gaps in the seven. */
  unservedSources: ["persistent_preferences", "recent_activity"],
  refinement:
    "marketplace ranks between business_knowledge and general_llm_knowledge; persistent_preferences is served by the memory engine at item level, and recent_activity has no engine at all"
} as const;

/**
 * Rank of an engine in `ENGINE_RETRIEVAL_ORDER` — the primary sort key of the
 * whole pipeline.
 */
export function engineRank(engineId: RetrievalEngineId): number {
  return ENGINE_RETRIEVAL_ORDER.indexOf(engineId as (typeof ENGINE_RETRIEVAL_ORDER)[number]);
}

/**
 * Rank of an engine under the frozen `RETRIEVAL_PRIORITY`, or `null` when the
 * frozen list has no source for it. Used by the consistency spec and by
 * `explain()`, which reports the frozen rank rather than this module's.
 */
export function frozenSourceRank(engineId: RetrievalEngineId): RetrievalPriorityRank | null {
  const source = ENGINE_RETRIEVAL_SOURCE[engineId];
  return source === null ? null : retrievalRank(source);
}

/**
 * Rank of a retrieval source, for items that carry a source finer-grained than
 * their engine's. The memory engine is the reason this exists: it emits
 * mission knowledge (rank 1) and preference knowledge (rank 2) from one
 * engine, and ranking them identically would lose the Bible's most important
 * distinction — today's objective is not a durable taste.
 */
export function retrievalSourceRank(source: RetrievalSource | null): RetrievalPriorityRank | null {
  return source === null ? null : retrievalRank(source);
}

/**
 * The effective rank used for ordering: the item's own source rank when it has
 * one, the engine's otherwise.
 *
 * Unranked engines sort after every ranked source but before
 * `general_llm_knowledge`, which is what the amendment above proposes. The
 * arithmetic says so rather than a comment: `RETRIEVAL_PRIORITY.length - 1` is
 * the index of `general_llm_knowledge`, and unranked engines take the half-step
 * before it.
 */
export const UNRANKED_SOURCE_RANK = RETRIEVAL_PRIORITY.length - 1.5;

/** True while an engine's rank comes from this file alone (pending v1.4). */
export function isEngineAmendmentRanked(engineId: RetrievalEngineId): boolean {
  return ENGINE_RETRIEVAL_SOURCE[engineId] === null;
}

/**
 * Which section of the LLM context window each engine's items fill.
 *
 * A *different* order from the retrieval one, and deliberately so: retrieval
 * priority answers "who do we believe on conflict?", context priority answers
 * "what gets dropped when the window is full?" (patch G). They agree at both
 * ends — Workspace is first in both, the model's own material last in both —
 * and diverge in the middle, where a derived feature vector is cheap to lose
 * and a business profile is not.
 */
export const ENGINE_CONTEXT_SECTION = {
  workspace: "workspace",
  memory: "memory",
  feature_store: "summaries",
  knowledge_graph: "knowledge",
  business: "business",
  marketplace: "summaries",
  semantic: "llm"
} as const satisfies Readonly<Record<RetrievalEngineId, ContextSection>>;

/**
 * Context sections no engine fills.
 *
 * `history` would be served by an engine over `recent_activity`, and
 * `conversation` is a Layer 6 concern this module is forbidden to touch.
 * Declared rather than left to be discovered: an empty section in an assembly
 * plan should read as "nothing offered", not as "something broke".
 */
export const SECTIONS_WITHOUT_ENGINE: readonly ContextSection[] = ["history", "conversation"];

/** Position of a section in the frozen assembly priority; higher = dropped sooner. */
export function contextSectionRank(section: ContextSection): number {
  return CONTEXT_ASSEMBLY_PRIORITY.indexOf(section as (typeof CONTEXT_ASSEMBLY_PRIORITY)[number]);
}

/** Engines in the binding order — what a full fan-out iterates. */
export function enginesInRetrievalOrder(): readonly RetrievalEngineId[] {
  return ENGINE_RETRIEVAL_ORDER;
}

/** Re-exported so callers never re-derive the frozen contracts themselves. */
export { CONTEXT_ASSEMBLY_PRIORITY, RETRIEVAL_PRIORITY };
