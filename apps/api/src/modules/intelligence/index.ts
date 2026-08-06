/**
 * The Intelligence Platform, in import-direction order (lower layers first).
 * A sub-module may import from lines above its own, never below — see
 * ARCHITECTURE.md for the dependency graph.
 *
 * Surface convention (doc 23 §7): every sub-module's barrel groups its
 * exports as Command API, Query API, and Events; implementations never leak.
 */
// Layer 0 — vocabulary, context ids, events, jobs, event store, metrics
export * from "./core";
// Layer 2 — derived facts and stored profiles
export * from "./feature-store";
export * from "./marketplace-intelligence";
export * from "./business-intelligence";
export * from "./customer-intelligence";
export * from "./trust-engine";
// Layer 3 — the knowledge graph substrate
export * from "./relationship-engine";
export * from "./knowledge-graph";
export * from "./experience-graph";
// Layer 4 — memory tiers and the binding retrieval order
export * from "./memory-engine";
// Layer 5 — policy, explanation, ranking, reasoning
export * from "./decision-engine";
export * from "./explanation-engine";
export * from "./ranking-engine";
export * from "./reasoning-engine";
// Layer 6 boundary — tokens, tool orchestrator, conversation renderer
export * from "./orchestrator-contracts";
export { IntelligenceModule } from "./intelligence.module";
