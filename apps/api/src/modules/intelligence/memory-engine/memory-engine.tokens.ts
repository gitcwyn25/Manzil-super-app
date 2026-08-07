/**
 * Layer 4 (Memory Engine) — injection tokens for the seams Epic 05 adds.
 *
 * The frozen boundary tokens (`INTELLIGENCE_MEMORY`,
 * `INTELLIGENCE_EVENT_PUBLISHER`, `INTELLIGENCE_METRICS_SINK`) stay where Epic
 * 03 put them, in `orchestrator-contracts/orchestrator.tokens.ts`. These are
 * the module's own swap points, named the same way so they stay collision-free
 * in AppModule's flat provider list.
 */

/** `MemoryObjectStore` — in-process until M1 applies its migration. */
export const MEMORY_OBJECT_STORE = "MEMORY_ENGINE_OBJECT_STORE";

/**
 * `MemoryClock` — time and ids as an injected dependency.
 *
 * Not a testing nicety. Every memory carries `created`, `updated` and
 * `expires`, conflict resolution compares them, and doc 23 §4 makes "the same
 * job twice yields the identical result" binding — none of which is assertable
 * about code that reads the wall clock inline.
 */
export const MEMORY_ENGINE_CLOCK = "MEMORY_ENGINE_CLOCK";
