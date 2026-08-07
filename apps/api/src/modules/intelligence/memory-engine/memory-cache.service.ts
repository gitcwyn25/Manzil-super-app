/**
 * Layer 4 (Memory Engine) — caching, deliberately narrow.
 *
 * A thin, typed skin over the platform `CacheService`, which is Redis-backed
 * when `REDIS_URL` is set and transparently in-memory when it is not.
 * Production has **no Redis provisioned**, so the fallback path is not a
 * development convenience — it is the path that actually runs, and
 * `memory-cache.service.spec.ts` exercises exactly that path.
 *
 * **What is cached: projections only.** Preference projection reads Postgres
 * and interprets rows; caching it for two minutes saves the work without
 * changing an answer. Stored memories are *not* cached. A memory that a write
 * just changed, served from a cache for another thirty seconds, is precisely
 * the failure the AI Bible names — Gurman asking for a date the workspace
 * already holds — and no hit rate is worth causing it.
 */
import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";

/** One namespace for the whole engine; invalidation is namespace-versioned. */
export const MEMORY_CACHE_NAMESPACE = "memory-engine";

/**
 * Seconds. Short because a projection is derived from live rows: a customer
 * who visited a new place an hour ago has a new favourite, and a stale
 * projection is a wrong answer about them, not merely an old one.
 */
export const MEMORY_CACHE_TTL = {
  projection: 120
} as const;

@Injectable()
export class MemoryCacheService {
  constructor(private readonly cache: CacheService) {}

  /** `redis` or `memory` — surfaced so health checks can report the truth. */
  get backend(): "redis" | "memory" {
    return this.cache.backend;
  }

  /** Read-through cache for one projection. */
  read<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(MEMORY_CACHE_NAMESPACE, key, ttlSeconds, loader);
  }

  /** Drops every cached projection. Idempotent: bumping twice is harmless. */
  async invalidate(): Promise<void> {
    await this.cache.invalidate(MEMORY_CACHE_NAMESPACE);
  }
}
