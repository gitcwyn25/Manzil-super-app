/**
 * Epic 18 — the pre-M1 shared store.
 *
 * The in-process store is correct but per-replica, and the durable one waits on
 * M1. Between them sits the connection the API already has: Redis `SET NX PX`
 * is an atomic insert-if-absent with a TTL, which is precisely the `claim()`
 * primitive this layer needs, and it arbitrates across every replica.
 *
 * **No read-then-write, again.** `SET NX` either wins or does not; the loser
 * reads the winner's record afterwards, not before. That ordering is the whole
 * point, and it is the same ordering `PrismaIdempotencyStore` gets from a
 * unique index.
 *
 * ## Degradation
 *
 * `CacheService` shares one lazy connection, and it can be absent (no
 * `REDIS_URL` locally) or unhealthy (an outage). Neither may fail a write
 * request: refusing a business registration because a cache is down would turn
 * a duplicate-prevention feature into an availability incident. So every
 * operation falls through to a per-process store, and the class says plainly
 * that when it does, protection narrows to the replica that took the request.
 *
 * `durable` is false even on the happy path: keys carry a TTL and a
 * memory-pressured Redis may evict them early. What Redis buys is `shared`,
 * not durability — that arrives with the Postgres table.
 */
import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { scopedKey } from "./idempotency.fingerprint";
import {
  classifyExisting,
  InProcessIdempotencyStore,
  type IdempotencyStore
} from "./idempotency.store";
import type {
  IdempotencyClaimOutcome,
  IdempotencyClaimRequest,
  IdempotencyRecord,
  StoredResponse
} from "./idempotency.types";

/** Namespace prefix; distinct from the read-through cache's `manzil:<ns>:`. */
export const REDIS_KEY_PREFIX = "manzil:idem:";

/** Minimum TTL we will ever set, so a clock skew cannot produce `PX 0`. */
const MIN_TTL_MS = 1000;

/** The `ioredis` surface this store uses, structurally. */
interface RedisLike {
  set(
    key: string,
    value: string,
    mode: "PX",
    ttl: number,
    condition: "NX"
  ): Promise<string | null>;
  set(key: string, value: string, mode: "PX", ttl: number): Promise<string | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
}

export function redisKey(scope: string, key: string): string {
  return `${REDIS_KEY_PREFIX}${scopedKey(scope, key)}`;
}

/** A record as it travels through Redis. Compact by hand — no schema library. */
interface WireRecord {
  s: string;
  k: string;
  r: string;
  f: string;
  t: "in_flight" | "completed";
  c: number;
  e: number;
  rs?: number;
  rb?: unknown;
}

export function encodeRecord(record: IdempotencyRecord): string {
  const wire: WireRecord = {
    s: record.scope,
    k: record.key,
    r: record.route,
    f: record.fingerprint,
    t: record.state,
    c: record.createdAt,
    e: record.expiresAt
  };

  if (record.response) {
    wire.rs = record.response.status;
    wire.rb = record.response.body;
  }

  return JSON.stringify(wire);
}

/**
 * Parses a stored record, or null if it is unreadable.
 *
 * Null rather than a throw: a value written by a different build, or a
 * truncated one, must not make the endpoint 500. Treating it as absent costs
 * at worst one duplicate — the failure mode we already had — while throwing
 * would cost every request under that key.
 */
export function decodeRecord(raw: string | null): IdempotencyRecord | null {
  if (!raw) return null;

  try {
    const wire = JSON.parse(raw) as WireRecord;
    if (typeof wire?.s !== "string" || typeof wire?.k !== "string") return null;

    const completed = wire.t === "completed" && typeof wire.rs === "number";

    return {
      scope: wire.s,
      key: wire.k,
      route: typeof wire.r === "string" ? wire.r : "",
      fingerprint: typeof wire.f === "string" ? wire.f : "",
      state: completed ? "completed" : "in_flight",
      response: completed ? { status: wire.rs as number, body: wire.rb ?? null } : null,
      createdAt: typeof wire.c === "number" ? wire.c : 0,
      expiresAt: typeof wire.e === "number" ? wire.e : 0
    };
  } catch {
    return null;
  }
}

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  readonly backend = "redis" as const;
  /** A TTL'd cache entry can be evicted; only the M1 table is durable. */
  readonly durable = false;
  readonly shared = true;

  private readonly logger = new Logger(RedisIdempotencyStore.name);

  constructor(
    private readonly cache: CacheService,
    /** Used whenever Redis is absent or unhealthy. Never null. */
    private readonly fallback: InProcessIdempotencyStore = new InProcessIdempotencyStore(),
    private readonly pollMs = 40
  ) {}

  private client(): RedisLike | null {
    return (this.cache.client as unknown as RedisLike | null) ?? null;
  }

  /** Marks the shared connection unhealthy and reports once, at warn. */
  private degrade(operation: string, error: unknown): void {
    this.cache.markUnhealthy();
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Redis ${operation} failed — idempotency degraded to this replica: ${message}`);
  }

  async claim(request: IdempotencyClaimRequest): Promise<IdempotencyClaimOutcome> {
    const redis = this.client();
    if (!redis) return this.fallback.claim(request);

    const id = redisKey(request.scope, request.key);
    const record: IdempotencyRecord = {
      scope: request.scope,
      key: request.key,
      route: request.route,
      fingerprint: request.fingerprint,
      state: "in_flight",
      response: null,
      createdAt: request.now,
      expiresAt: request.now + request.ttlMs
    };

    try {
      // SET … NX is the arbiter. Exactly one concurrent caller sees "OK".
      const written = await redis.set(
        id,
        encodeRecord(record),
        "PX",
        Math.max(request.ttlMs, MIN_TTL_MS),
        "NX"
      );

      if (written === "OK") return { outcome: "claimed" };

      const existing = decodeRecord(await redis.get(id));

      // Expired or unreadable between the SET and the GET: nobody holds it, so
      // report in-flight and let the caller wait and retry rather than racing
      // a second unguarded write from here.
      if (!existing) {
        return { outcome: "in_flight", record };
      }

      return classifyExisting(existing, request.fingerprint);
    } catch (error) {
      this.degrade("SET NX", error);
      return this.fallback.claim(request);
    }
  }

  async complete(scope: string, key: string, response: StoredResponse, now: number): Promise<void> {
    const redis = this.client();
    if (!redis) return this.fallback.complete(scope, key, response, now);

    const id = redisKey(scope, key);

    try {
      const existing = decodeRecord(await redis.get(id));

      // The claim expired or was evicted while the handler ran. Writing a
      // fresh record now would silently extend the window past the 24h the
      // contract promises, so the outcome is simply not recorded.
      if (!existing || existing.expiresAt <= now) return;

      // Rewritten with the *remaining* TTL, not a new one, for the same reason.
      await redis.set(
        id,
        encodeRecord({ ...existing, state: "completed", response }),
        "PX",
        Math.max(existing.expiresAt - now, MIN_TTL_MS)
      );
    } catch (error) {
      this.degrade("SET", error);
      await this.fallback.complete(scope, key, response, now);
    }
  }

  async release(scope: string, key: string): Promise<void> {
    const redis = this.client();
    if (!redis) return this.fallback.release(scope, key);

    try {
      await redis.del(redisKey(scope, key));
    } catch (error) {
      this.degrade("DEL", error);
    }

    // Always released locally too: a claim may have been taken by the fallback
    // during an outage, and leaving it held would block the retry.
    await this.fallback.release(scope, key);
  }

  async awaitSettled(
    scope: string,
    key: string,
    timeoutMs: number
  ): Promise<IdempotencyRecord | null> {
    const redis = this.client();
    if (!redis) return this.fallback.awaitSettled(scope, key, timeoutMs);

    // Polling rather than pub/sub: the waiting request and the running one are
    // usually on different replicas, and a subscription per waiting request
    // would be a lot of connection churn for a sub-second wait.
    const id = redisKey(scope, key);
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      let record: IdempotencyRecord | null;

      try {
        record = decodeRecord(await redis.get(id));
      } catch (error) {
        this.degrade("GET", error);
        return this.fallback.awaitSettled(scope, key, timeoutMs);
      }

      if (!record) return null;
      if (record.state === "completed") return record;
      if (Date.now() >= deadline) return null;

      await new Promise((resolve) => {
        const timer = setTimeout(resolve, this.pollMs);
        timer.unref?.();
      });
    }
  }

  /** Redis expires its own keys; only the fallback needs sweeping. */
  async prune(now: number): Promise<number> {
    return this.fallback.prune(now);
  }
}
