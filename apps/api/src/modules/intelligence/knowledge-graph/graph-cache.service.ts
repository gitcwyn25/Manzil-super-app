/**
 * Layer 3 (Knowledge Graph) — caching.
 *
 * A thin, typed skin over the platform `CacheService`, which is Redis-backed
 * when `REDIS_URL` is set and transparently in-memory when it is not.
 * Production has **no Redis provisioned**, so the fallback path is not a
 * development convenience here — it is the path that actually runs, and it is
 * covered by `graph-cache.service.spec.ts`.
 *
 * Invalidation is namespace-versioned, so `RebuildKnowledgeGraphJob` can drop
 * every cached node with one counter bump instead of a key sweep — which is
 * also why the whole graph shares one namespace: a rebuild invalidates
 * knowledge, and knowledge is not partitionable by node kind (a business's
 * node embeds edges owned by reviews, campaigns and visits).
 */
import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";

/** One namespace for the whole graph — see the note above on why. */
export const GRAPH_CACHE_NAMESPACE = "knowledge-graph";

/**
 * Seconds. Short by design: projections are derived from live rows, so a
 * stale node is a wrong answer about the marketplace, not merely an old one.
 */
export const GRAPH_CACHE_TTL = {
  entity: 60,
  related: 60,
  providers: 120,
  traversal: 30
} as const;

@Injectable()
export class GraphCacheService {
  constructor(private readonly cache: CacheService) {}

  /** `redis` or `memory` — surfaced so health checks can report the truth. */
  get backend(): "redis" | "memory" {
    return this.cache.backend;
  }

  /** Read-through cache for one graph read. */
  read<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(GRAPH_CACHE_NAMESPACE, key, ttlSeconds, loader);
  }

  /** Drops every cached graph read. Idempotent: bumping twice is harmless. */
  async invalidate(): Promise<void> {
    await this.cache.invalidate(GRAPH_CACHE_NAMESPACE);
  }
}
