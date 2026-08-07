/**
 * Layer 4 (Memory Engine) — time and identity as a dependency.
 *
 * Memory is a lifecycle: written at one instant, expiring at another, beaten
 * by a claim that arrived later. Every one of those comparisons is a fact
 * about time, so time is injected — a module whose correctness depends on
 * `Date.now()` can be reasoned about only by waiting.
 *
 * Ids are here for the same reason: an event id minted inline makes "a
 * replayed job returns the identical result" (doc 23 §4) unassertable.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";

export interface MemoryClock {
  now(): IsoDateTime;
  newId(): EntityId;
}

@Injectable()
export class SystemMemoryClock implements MemoryClock {
  now(): IsoDateTime {
    return new Date().toISOString();
  }

  newId(): EntityId {
    // `randomUUID` via require-free global: Node 22 exposes Web Crypto.
    return globalThis.crypto.randomUUID();
  }
}
