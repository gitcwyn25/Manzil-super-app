/**
 * Layer 4.5 (Hybrid Retrieval) — time and identity as a dependency.
 *
 * Every retrieval carries a `retrievalId`, every item carries a freshness
 * measured against *now*, and every diagnostic reports an execution time. None
 * of that is assertable about code that reads `Date.now()` inline — so the
 * clock is injected, exactly as in Epics 04, 05 and 06.
 *
 * `elapsedMs` is here rather than at each call site because the pipeline
 * measures seven engines concurrently and a monotonic reading is the only one
 * that stays sane across a wall-clock adjustment.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";

export interface RetrievalClock {
  now(): IsoDateTime;
  newId(): EntityId;
  /** Monotonic milliseconds; only differences are meaningful. */
  monotonicMs(): number;
}

@Injectable()
export class SystemRetrievalClock implements RetrievalClock {
  now(): IsoDateTime {
    return new Date().toISOString();
  }

  newId(): EntityId {
    // `randomUUID` via require-free global: Node 22 exposes Web Crypto.
    return globalThis.crypto.randomUUID();
  }

  monotonicMs(): number {
    return performance.now();
  }
}
