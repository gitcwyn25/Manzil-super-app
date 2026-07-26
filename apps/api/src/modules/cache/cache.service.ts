import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

/**
 * Caching layer backed by Redis (REDIS_URL) with a transparent in-memory
 * fallback so local development works without a Redis instance.
 *
 * Invalidation uses namespace versioning: every cache key embeds a version
 * counter for its namespace; bumping the counter atomically invalidates the
 * whole namespace without SCAN/KEYS sweeps (safe on managed Redis).
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly memoryVersions = new Map<string, number>();
  private redis: Redis | null = null;
  private redisHealthy = false;

  constructor() {
    const url = process.env.REDIS_URL;

    if (!url) {
      this.logger.log("REDIS_URL not set — using in-memory cache fallback");
      return;
    }

    this.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 4000,
      retryStrategy: (attempt) => Math.min(attempt * 2000, 30000),
      tls: url.startsWith("rediss://") ? {} : undefined
    });

    this.redis.on("ready", () => {
      this.redisHealthy = true;
      this.logger.log("Redis cache connected");
    });

    this.redis.on("error", (error) => {
      if (this.redisHealthy) {
        this.logger.warn(`Redis error — falling back to memory cache: ${error.message}`);
      }
      this.redisHealthy = false;
    });

    this.redis.connect().catch((error) => {
      this.logger.warn(`Redis unavailable — using in-memory cache fallback: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => this.redis?.disconnect());
  }

  get backend(): "redis" | "memory" {
    return this.redisHealthy ? "redis" : "memory";
  }

  /**
   * The live Redis client, or null when Redis is absent/unhealthy.
   *
   * Exposed so other infrastructure (rate-limit storage) can share this one
   * connection instead of provisioning a second datastore. Callers must treat
   * null as "degrade to local behaviour", never as a fatal error.
   */
  get client(): Redis | null {
    return this.redisHealthy ? this.redis : null;
  }

  /** Marks the shared connection unhealthy after a caller-observed failure. */
  markUnhealthy() {
    this.redisHealthy = false;
  }

  /** Read-through cache. Loader errors are never masked by cache errors. */
  async getOrSet<T>(namespace: string, key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const fullKey = await this.buildKey(namespace, key);

    const cached = await this.read(fullKey);
    if (cached !== undefined) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // fall through to loader on corrupt entry
      }
    }

    const value = await loader();
    await this.write(fullKey, JSON.stringify(value), ttlSeconds);
    return value;
  }

  /** Invalidates every key in a namespace by bumping its version counter. */
  async invalidate(...namespaces: string[]): Promise<void> {
    for (const namespace of namespaces) {
      if (this.redisHealthy && this.redis) {
        try {
          await this.redis.incr(this.versionKey(namespace));
          continue;
        } catch {
          this.redisHealthy = false;
        }
      }

      this.memoryVersions.set(namespace, (this.memoryVersions.get(namespace) ?? 0) + 1);
    }
  }

  private versionKey(namespace: string) {
    return `manzil:v:${namespace}`;
  }

  private async buildKey(namespace: string, key: string): Promise<string> {
    let version = 0;

    if (this.redisHealthy && this.redis) {
      try {
        version = Number(await this.redis.get(this.versionKey(namespace))) || 0;
      } catch {
        this.redisHealthy = false;
        version = this.memoryVersions.get(namespace) ?? 0;
      }
    } else {
      version = this.memoryVersions.get(namespace) ?? 0;
    }

    return `manzil:${namespace}:v${version}:${key}`;
  }

  private async read(fullKey: string): Promise<string | undefined> {
    if (this.redisHealthy && this.redis) {
      try {
        const value = await this.redis.get(fullKey);
        return value ?? undefined;
      } catch {
        this.redisHealthy = false;
      }
    }

    const entry = this.memory.get(fullKey);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      this.memory.delete(fullKey);
      return undefined;
    }

    return entry.value;
  }

  private async write(fullKey: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redisHealthy && this.redis) {
      try {
        await this.redis.set(fullKey, value, "EX", ttlSeconds);
        return;
      } catch {
        this.redisHealthy = false;
      }
    }

    // Bound the fallback cache so it cannot grow without limit.
    if (this.memory.size > 2000) {
      const oldest = this.memory.keys().next().value;
      if (oldest) this.memory.delete(oldest);
    }

    this.memory.set(fullKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}
