/**
 * Layer 3 (Knowledge Graph) — injection tokens for the seams Epic 04 adds.
 *
 * The frozen boundary tokens (`INTELLIGENCE_KNOWLEDGE_GRAPH`,
 * `INTELLIGENCE_EVENT_PUBLISHER`, `INTELLIGENCE_METRICS_SINK`) stay where
 * Epic 03 put them, in `orchestrator-contracts/orchestrator.tokens.ts`. These
 * are the module's own swap points, named the same way so they stay
 * collision-free in AppModule's flat provider list.
 */

/** `GraphRelationshipStore` — refuses writes until M1 applies its migration. */
export const GRAPH_RELATIONSHIP_STORE = "KNOWLEDGE_GRAPH_RELATIONSHIP_STORE";

/** `GraphTraversalContract` — walking the graph, budgeted. */
export const KNOWLEDGE_GRAPH_TRAVERSAL = "KNOWLEDGE_GRAPH_TRAVERSAL";

/**
 * `GraphClock` — time and ids as an injected dependency.
 *
 * Jobs stamp events with a timestamp and an eventId; if those came from
 * `Date.now()` and `randomUUID()` inline, "running the same job twice yields
 * the identical result" could not be asserted in a test, and doc 23 §4 makes
 * that assertion binding.
 */
export const KNOWLEDGE_GRAPH_CLOCK = "KNOWLEDGE_GRAPH_CLOCK";
