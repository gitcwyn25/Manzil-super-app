/**
 * Layer 4 (Memory Engine) — the canonical retrieval order.
 *
 * AI Bible v1.2: "Gurman always prefers the user's current plan over generic
 * knowledge. This ordering is part of the AI contract, not an implementation
 * detail." This file makes that sentence a compile-time artifact: the order
 * is a typed constant, not a comment somebody's retrieval loop may drift
 * from.
 */

/**
 * The seven places knowledge can come from at answer time, named exactly as
 * the AI Bible names them. `general_llm_knowledge` is deliberately present
 * and deliberately *last*: it is not a memory tier and nothing in this module
 * stores it — it exists in the type so the ordering contract can state, in
 * code, that the model's own knowledge is the final fallback, never a peer.
 */
export type RetrievalSource =
  | "workspace_timeline"
  | "mission_context"
  | "persistent_preferences"
  | "recent_activity"
  | "global_user_profile"
  | "business_knowledge"
  | "general_llm_knowledge";

/**
 * The binding retrieval priority (AI Bible v1.2, verbatim order):
 *
 * Workspace Timeline → Current Mission Context → Persistent Preferences →
 * Recent Activity → Global User Profile → Business Knowledge → General LLM
 * Knowledge.
 *
 * A tuple, not a Set: position is the contract. Lower index = consulted
 * first and trusted more on conflict.
 */
export const RETRIEVAL_PRIORITY = [
  "workspace_timeline",
  "mission_context",
  "persistent_preferences",
  "recent_activity",
  "global_user_profile",
  "business_knowledge",
  "general_llm_knowledge"
] as const satisfies readonly RetrievalSource[];

/**
 * A memory object's rank in the retrieval order: its index in
 * `RETRIEVAL_PRIORITY`. Stored on every memory object so a retrieval
 * implementation can sort a mixed bag of memories without re-deriving the
 * contract.
 */
export type RetrievalPriorityRank = number;

/** Rank of one retrieval source under the binding order. */
export function retrievalRank(source: RetrievalSource): RetrievalPriorityRank {
  return RETRIEVAL_PRIORITY.indexOf(source);
}
