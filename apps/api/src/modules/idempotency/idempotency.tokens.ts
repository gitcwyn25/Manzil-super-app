/**
 * Injection tokens for Epic 18.
 *
 * Separate from the implementations so a consumer can depend on the contract
 * without importing a concrete store — the same token discipline Epics 04–07
 * use (`INTELLIGENCE_SUMMARY_STORE`, `MEMORY_OBJECT_STORE`).
 */

/** The `IdempotencyStore` in force for this deployment. */
export const IDEMPOTENCY_STORE = Symbol("IDEMPOTENCY_STORE");

/** `() => number`, epoch ms. Overridden in tests so TTL expiry is provable. */
export const IDEMPOTENCY_CLOCK = Symbol("IDEMPOTENCY_CLOCK");

/** How long a recorded outcome stays replayable, in ms. */
export const IDEMPOTENCY_TTL_MS = Symbol("IDEMPOTENCY_TTL_MS");

/** How long a duplicate waits on an in-flight original, in ms. */
export const IDEMPOTENCY_IN_FLIGHT_WAIT_MS = Symbol("IDEMPOTENCY_IN_FLIGHT_WAIT_MS");
