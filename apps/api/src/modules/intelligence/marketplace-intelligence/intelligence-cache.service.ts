/**
 * Layer 2 (Marketplace Intelligence) — caching, deliberately narrow.
 *
 * A thin, typed skin over the platform `CacheService`, which is Redis-backed
 * when `REDIS_URL` is set and transparently in-memory when it is not.
 * Production has **no Redis provisioned**, so the fallback is not a
 * development convenience — it is the path that actually runs, and
 * `intelligence-cache.service.spec.ts` exercises exactly that path.
 *
 * **What is cached: id lists, and nothing else.** Summarizing every business
 * in a category asks the same question once per business — "who are the
 * comparable providers?" — and the answer changes when a provider is added, on
 * the order of days. So the *ids* are cached and the rows are not.
 *
 * That restriction is not fastidiousness. `CacheService` round-trips through
 * `JSON.stringify`, so a cached `Date` returns as a string and a cached `Map`
 * returns as `{}`. Every observation shape in this module carries both. A
 * cache that silently degrades the types passing through it is worse than no
 * cache, because the corruption surfaces as a wrong number rather than as an
 * error — so only strings go in.
 *
 * Stored summaries are *not* cached either: they are already a stored artefact
 * carrying their own `computedAt`, and a second staleness layer in front of
 * them would give two different answers to "how old is this?".
 */
import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";

/** One namespace for the whole layer; invalidation is namespace-versioned. */
export const MARKETPLACE_CACHE_NAMESPACE = "marketplace-intelligence";

/**
 * Seconds. Five minutes: long enough that a full nightly pass over a category
 * reads the peer set once, short enough that a provider added this morning is
 * in the comparison set this afternoon.
 */
export const MARKETPLACE_CACHE_TTL = {
  peers: 300
} as const;

@Injectable()
export class IntelligenceCacheService {
  constructor(private readonly cache: CacheService) {}

  /** `redis` or `memory` — surfaced so health checks can report the truth. */
  get backend(): "redis" | "memory" {
    return this.cache.backend;
  }

  /**
   * Read-through cache for one id list.
   *
   * Typed to `readonly string[]` on purpose — see the file comment. Widening
   * this signature is how the JSON round-trip bug gets in.
   */
  readIds(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<readonly string[]>
  ): Promise<readonly string[]> {
    return this.cache.getOrSet(MARKETPLACE_CACHE_NAMESPACE, key, ttlSeconds, loader);
  }

  /** Drops every cached projection. Idempotent: bumping twice is harmless. */
  async invalidate(): Promise<void> {
    await this.cache.invalidate(MARKETPLACE_CACHE_NAMESPACE);
  }
}
