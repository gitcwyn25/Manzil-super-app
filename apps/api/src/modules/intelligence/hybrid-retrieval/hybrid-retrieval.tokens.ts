/**
 * Layer 4.5 (Hybrid Retrieval) — injection tokens for the seams Epic 07 adds.
 *
 * The frozen boundary tokens stay where Epic 03 put them, in
 * `orchestrator-contracts/orchestrator.tokens.ts`; this epic *implements* one
 * of them (`INTELLIGENCE_CONTEXT_WINDOW_MANAGER`) and consumes five others.
 * These are this module's own swap points, namespaced the same way so they
 * stay collision-free in AppModule's flat provider list.
 */

/** `HybridRetrievalProvider` — the one thing Layer 5 needs to inject. */
export const HYBRID_RETRIEVAL_PROVIDER = "HYBRID_RETRIEVAL_PROVIDER";

/** `RetrievalClock` — time and ids, injected so results are assertable. */
export const HYBRID_RETRIEVAL_CLOCK = "HYBRID_RETRIEVAL_CLOCK";

/**
 * `SemanticRetrievalProvider` — **deliberately unbound**.
 *
 * The semantic engine injects this `@Optional()`. Nothing in this repository
 * provides it, and the engine's honest `feature_unavailable` is the proof that
 * "vector search optional, never mandatory" (ADR-006) is structural rather
 * than aspirational.
 */
export const HYBRID_RETRIEVAL_SEMANTIC_PROVIDER = "HYBRID_RETRIEVAL_SEMANTIC_PROVIDER";

/** `RetrievalCacheStore` (L3) — persistent tier, gated on M1 provisioning. */
export const HYBRID_RETRIEVAL_CACHE_STORE = "HYBRID_RETRIEVAL_CACHE_STORE";

/**
 * `readonly RetrievalEngine[]` — the installed engines.
 *
 * A token rather than seven constructor parameters, because the pipeline must
 * not know how many engines exist: "every engine replaceable" means adding one
 * is an edit to the provider array and nothing else.
 */
export const HYBRID_RETRIEVAL_ENGINES = "HYBRID_RETRIEVAL_ENGINES";
