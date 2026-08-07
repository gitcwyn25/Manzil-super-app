/**
 * Layer 2 (Marketplace Intelligence) — injection tokens for the seams Epic 06
 * adds.
 *
 * The frozen boundary tokens (`INTELLIGENCE_MARKETPLACE`,
 * `INTELLIGENCE_BUSINESS`, `INTELLIGENCE_CUSTOMER`,
 * `INTELLIGENCE_FEATURE_STORE`, `INTELLIGENCE_EVENT_PUBLISHER`,
 * `INTELLIGENCE_JOB_EXECUTOR`, `INTELLIGENCE_METRICS_SINK`) stay where Epic 03
 * put them, in `orchestrator-contracts/orchestrator.tokens.ts`. These are this
 * module's own swap points, namespaced the same way so they stay collision-free
 * in AppModule's flat provider list.
 */

/** `IntelligenceSummaryStore` — in-process until M1 applies its migration. */
export const INTELLIGENCE_SUMMARY_STORE = "MARKETPLACE_INTELLIGENCE_SUMMARY_STORE";

/** `MarketplaceClock` — time and ids, injected so results are assertable. */
export const MARKETPLACE_INTELLIGENCE_CLOCK = "MARKETPLACE_INTELLIGENCE_CLOCK";
