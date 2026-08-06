/**
 * Layer 0 (core/cost) — inference cost as a first-class contract.
 *
 * Patch F: intelligence has a bill (tokens, latency, money) and a cache
 * story, and both must be visible at request time — not discovered on an
 * invoice. Every reasoning *Request contract carries an `InferenceBudget`,
 * so cost-aware scheduling, caching, and degradation can be implemented
 * later without changing a single signature.
 */
import type { MoneyAmount } from "../core.primitives";

/** How urgent a piece of intelligence work is; drives queueing and model choice later. */
export type InferencePriority = "interactive" | "background" | "batch";

/**
 * The declared budget of one intelligence request. Estimates are `null`
 * when honestly unknown — a missing estimate is a visible gap, never a
 * silent zero.
 */
export interface InferenceBudget {
  readonly estimatedTokens: number | null;
  readonly estimatedLatencyMs: number | null;
  readonly estimatedCost: MoneyAmount | null;
  /** Whether the request may be served from / populate a decision cache. */
  readonly cacheEligible: boolean;
  readonly priority: InferencePriority;
}
