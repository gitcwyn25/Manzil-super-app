import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ThrottlerStorageService } from "@nestjs/throttler";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import { CacheService } from "../cache/cache.service";

/**
 * Atomically increments a request counter and applies a block window.
 *
 * Runs as a single Lua script so that check-increment-block cannot interleave
 * across concurrent requests — the property that makes distributed rate
 * limiting actually hold under load. A JS-side GET/INCR/SET sequence would let
 * two racing requests both observe "under limit" and both pass.
 *
 * KEYS[1] hit counter   KEYS[2] block marker
 * ARGV[1] ttl (ms)      ARGV[2] limit   ARGV[3] block duration (ms)
 *
 * Returns { totalHits, msToExpire, isBlocked, msToBlockExpire }.
 */
const INCREMENT_SCRIPT = `
local hitKey = KEYS[1]
local blockKey = KEYS[2]
local ttlMs = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockMs = tonumber(ARGV[3])

-- Already blocked: report remaining block time without extending it, so an
-- attacker cannot keep themselves blocked forever by hammering the endpoint.
local blockPttl = redis.call('PTTL', blockKey)
if blockPttl > 0 then
  local current = tonumber(redis.call('GET', hitKey) or '0')
  return {current, blockPttl, 1, blockPttl}
end

local hits = redis.call('INCR', hitKey)
if hits == 1 then
  redis.call('PEXPIRE', hitKey, ttlMs)
end

local pttl = redis.call('PTTL', hitKey)
if pttl < 0 then
  -- Key exists without a TTL (should not happen, but never leak a counter).
  redis.call('PEXPIRE', hitKey, ttlMs)
  pttl = ttlMs
end

if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockMs)
  return {hits, pttl, 1, blockMs}
end

return {hits, pttl, 0, 0}
`;

const msToSeconds = (ms: number) => Math.ceil(ms / 1000);

/**
 * Rate-limit storage backed by the Redis instance the cache layer already
 * provisions (`REDIS_URL`). Shares that single connection rather than adding a
 * datastore.
 *
 * Degradation is deliberate: when Redis is absent or unhealthy this falls back
 * to the in-memory limiter rather than allowing traffic through unthrottled.
 * Per-instance limiting is weaker than global limiting, but failing open on the
 * OTP/auth endpoints would remove the control exactly when infrastructure is
 * already unhealthy.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallback = new ThrottlerStorageService();
  private warnedOnce = false;

  constructor(private readonly cache: CacheService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.cache.client;

    if (!redis) {
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }

    try {
      const namespaced = `manzil:throttle:${throttlerName}:${key}`;
      const result = (await redis.eval(
        INCREMENT_SCRIPT,
        2,
        namespaced,
        `${namespaced}:blocked`,
        String(ttl),
        String(limit),
        String(blockDuration)
      )) as [number, number, number, number];

      const [totalHits, msToExpire, isBlocked, msToBlockExpire] = result;

      return {
        totalHits: Number(totalHits),
        timeToExpire: msToSeconds(Number(msToExpire)),
        isBlocked: Number(isBlocked) === 1,
        timeToBlockExpire: msToSeconds(Number(msToBlockExpire))
      };
    } catch (error) {
      // Mark the shared connection unhealthy so the cache layer reconnects,
      // and serve this request from the in-memory limiter.
      this.cache.markUnhealthy();

      if (!this.warnedOnce) {
        this.warnedOnce = true;
        this.logger.warn(
          `Redis rate-limit storage failed — degrading to per-instance limits: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown() {
    this.fallback.onApplicationShutdown();
  }
}
