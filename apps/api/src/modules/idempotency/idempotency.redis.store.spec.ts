/**
 * The Redis store, against a fake that reproduces the two semantics the design
 * depends on: `SET … NX` refusing to overwrite, and `PX` expiring the key.
 *
 * The degradation tests matter as much as the happy path. A duplicate-write
 * guard that turns a cache outage into a failed business registration has
 * traded one defect for a worse one.
 */
import type { CacheService } from "../cache/cache.service";
import {
  decodeRecord,
  encodeRecord,
  RedisIdempotencyStore,
  redisKey,
  REDIS_KEY_PREFIX
} from "./idempotency.redis.store";
import { InProcessIdempotencyStore } from "./idempotency.store";
import type { IdempotencyClaimRequest, IdempotencyRecord } from "./idempotency.types";

const NOW = 1_700_000_000_000;
const TTL = 24 * 60 * 60 * 1000;

function claimRequest(overrides: Partial<IdempotencyClaimRequest> = {}): IdempotencyClaimRequest {
  return {
    scope: "user:a",
    key: "key-00000001",
    route: "POST /v1/crm/register",
    fingerprint: "fp-original",
    now: NOW,
    ttlMs: TTL,
    ...overrides
  };
}

/** A Redis double with real NX and PX semantics, and an injectable failure. */
function fakeRedis() {
  const entries = new Map<string, { value: string; expiresAt: number }>();
  let failing = false;

  const live = (key: string) => {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }
    return entry;
  };

  const client = {
    async set(key: string, value: string, _mode: "PX", ttl: number, condition?: "NX") {
      if (failing) throw new Error("READONLY You can't write against a read only replica");
      if (condition === "NX" && live(key)) return null;

      entries.set(key, { value, expiresAt: Date.now() + ttl });
      return "OK";
    },
    async get(key: string) {
      if (failing) throw new Error("connection lost");
      return live(key)?.value ?? null;
    },
    async del(key: string) {
      if (failing) throw new Error("connection lost");
      return entries.delete(key) ? 1 : 0;
    }
  };

  return {
    entries,
    fail: () => {
      failing = true;
    },
    cache: {
      get client() {
        return client;
      },
      markUnhealthy: jest.fn()
    } as unknown as CacheService
  };
}

/** A CacheService whose connection is absent, as it is with no REDIS_URL. */
function offlineCache() {
  return {
    get client() {
      return null;
    },
    markUnhealthy: jest.fn()
  } as unknown as CacheService;
}

describe("record encoding", () => {
  const record: IdempotencyRecord = {
    scope: "user:a",
    key: "k-12345678",
    route: "POST /v1/crm/register",
    fingerprint: "fp",
    state: "completed",
    response: { status: 201, body: { slug: "ravotsoy" } },
    createdAt: NOW,
    expiresAt: NOW + TTL
  };

  it("round-trips", () => {
    expect(decodeRecord(encodeRecord(record))).toEqual(record);
  });

  it("round-trips an in-flight record", () => {
    const inFlight = { ...record, state: "in_flight" as const, response: null };

    expect(decodeRecord(encodeRecord(inFlight))).toEqual(inFlight);
  });

  it("treats an unreadable value as absent rather than throwing", () => {
    // A value written by a different build, or a truncated one, must not make
    // the endpoint 500. Absent costs at worst one duplicate; a throw costs
    // every request under that key.
    expect(decodeRecord("not json at all")).toBeNull();
    expect(decodeRecord('{"unexpected":true}')).toBeNull();
    expect(decodeRecord(null)).toBeNull();
  });
});

describe("redisKey", () => {
  it("namespaces away from the read-through cache", () => {
    expect(redisKey("user:a", "k-1")).toBe(`${REDIS_KEY_PREFIX}user:a k-1`);
  });
});

describe("RedisIdempotencyStore", () => {
  it("is shared but not durable — a TTL'd cache entry can be evicted", () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    expect(store.backend).toBe("redis");
    expect(store.shared).toBe(true);
    expect(store.durable).toBe(false);
  });

  it("lets SET NX arbitrate: exactly one of three concurrent claims wins", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    const outcomes = await Promise.all([
      store.claim(claimRequest()),
      store.claim(claimRequest()),
      store.claim(claimRequest())
    ]);

    expect(outcomes.filter((outcome) => outcome.outcome === "claimed")).toHaveLength(1);
  });

  it("replays a completed record", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: { id: 7 } }, NOW);

    expect(await store.claim(claimRequest())).toMatchObject({
      outcome: "replay",
      record: { response: { status: 201, body: { id: 7 } } }
    });
  });

  it("detects a different payload under the same key", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    await store.claim(claimRequest());

    expect((await store.claim(claimRequest({ fingerprint: "fp-changed" }))).outcome).toBe(
      "fingerprint_mismatch"
    );
  });

  it("keeps the remaining TTL when recording the outcome", async () => {
    const { cache, entries } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    await store.claim(claimRequest({ now: Date.now() }));
    const claimedUntil = entries.get(redisKey("user:a", "key-00000001"))?.expiresAt ?? 0;

    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, Date.now());
    const completedUntil = entries.get(redisKey("user:a", "key-00000001"))?.expiresAt ?? 0;

    // Refreshing the TTL here would silently extend the 24h window the
    // contract promises, one replay at a time.
    expect(completedUntil).toBeLessThanOrEqual(claimedUntil);
  });

  it("does not record an outcome against an expired claim", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    await store.claim(claimRequest({ now: Date.now() }));
    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, Date.now() + TTL + 1);

    expect((await store.claim(claimRequest({ now: Date.now() }))).outcome).toBe("in_flight");
  });

  it("releases a claim so the key can be retried", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);

    await store.claim(claimRequest());
    await store.release("user:a", "key-00000001");

    expect((await store.claim(claimRequest())).outcome).toBe("claimed");
  });

  it("waits for another replica's in-flight claim", async () => {
    const { cache } = fakeRedis();
    const store = new RedisIdempotencyStore(cache, new InProcessIdempotencyStore(), 1);
    await store.claim(claimRequest({ now: Date.now() }));

    const waiting = store.awaitSettled("user:a", "key-00000001", 1000);
    setTimeout(
      () =>
        void store.complete("user:a", "key-00000001", { status: 201, body: { id: 2 } }, Date.now()),
      5
    );

    await expect(waiting).resolves.toMatchObject({ state: "completed" });
  });

  describe("degradation", () => {
    it("falls back to the in-process store when no Redis is configured", async () => {
      const fallback = new InProcessIdempotencyStore();
      const store = new RedisIdempotencyStore(offlineCache(), fallback, 1);

      expect((await store.claim(claimRequest())).outcome).toBe("claimed");
      expect((await store.claim(claimRequest())).outcome).toBe("in_flight");
      expect(fallback.size).toBe(1);
    });

    it("degrades rather than failing the write when Redis errors", async () => {
      const { cache, fail } = fakeRedis();
      const fallback = new InProcessIdempotencyStore();
      const store = new RedisIdempotencyStore(cache, fallback, 1);

      fail();

      // Refusing a business registration because a cache is down would turn a
      // duplicate-prevention feature into an availability incident.
      await expect(store.claim(claimRequest())).resolves.toMatchObject({ outcome: "claimed" });
      expect(cache.markUnhealthy).toHaveBeenCalled();
      expect(fallback.size).toBe(1);
    });

    it("still deduplicates within the replica after degrading", async () => {
      const { cache, fail } = fakeRedis();
      const fallback = new InProcessIdempotencyStore();
      const store = new RedisIdempotencyStore(cache, fallback, 1);

      fail();
      await store.claim(claimRequest());
      await store.complete("user:a", "key-00000001", { status: 201, body: { id: 1 } }, NOW);

      expect((await store.claim(claimRequest())).outcome).toBe("replay");
    });

    it("releases locally as well, so an outage cannot strand a claim", async () => {
      const { cache, fail } = fakeRedis();
      const fallback = new InProcessIdempotencyStore();
      const store = new RedisIdempotencyStore(cache, fallback, 1);

      fail();
      await store.claim(claimRequest());
      await store.release("user:a", "key-00000001");

      expect((await store.claim(claimRequest())).outcome).toBe("claimed");
    });
  });
});
