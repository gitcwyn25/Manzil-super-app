/**
 * Layer 2 (Marketplace Intelligence) — time and identity as a dependency.
 *
 * Every fact this module publishes carries `computedAt`, every model compares
 * observation timestamps against a window, and doc 23 §4 makes "the same job
 * twice yields the identical result" binding. None of that is assertable about
 * code that reads `Date.now()` inline — so the clock is injected, exactly as
 * in Epics 04 and 05.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";

export interface MarketplaceClock {
  now(): IsoDateTime;
  newId(): EntityId;
}

@Injectable()
export class SystemMarketplaceClock implements MarketplaceClock {
  now(): IsoDateTime {
    return new Date().toISOString();
  }

  newId(): EntityId {
    // `randomUUID` via require-free global: Node 22 exposes Web Crypto.
    return globalThis.crypto.randomUUID();
  }
}
