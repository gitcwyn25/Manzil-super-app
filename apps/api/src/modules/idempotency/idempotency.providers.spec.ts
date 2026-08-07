/**
 * Store selection.
 *
 * The double-signal rule is the point of these tests: a build that mints the
 * Prisma delegate must NOT be taken as evidence that the table exists, because
 * `prisma generate` runs on every image build the moment the model appears in
 * `schema.prisma` — while the migration is still gated. Getting this wrong
 * switches the store on at build time and fails at query time, on the write
 * path, which is the worst place to discover it.
 */
import type { CacheService } from "../cache/cache.service";
import type { PrismaService } from "../prisma.service";
import { IDEMPOTENCY_STORE_ENV, selectIdempotencyStore } from "./idempotency.providers";

const readyDelegate = {
  idempotencyRecord: {
    create: () => undefined,
    findUnique: () => undefined,
    update: () => undefined,
    deleteMany: () => undefined
  }
} as unknown as PrismaService;

/** Today's client: the model is in schema.prisma, the table is not applied. */
const gatedClient = {} as PrismaService;

const cache = { client: null, markUnhealthy: () => undefined } as unknown as CacheService;

describe("selectIdempotencyStore", () => {
  const withoutRedis = { ...process.env };

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    process.env = withoutRedis;
  });

  it("defaults to the in-process store", () => {
    expect(selectIdempotencyStore(gatedClient, null, {}).backend).toBe("memory");
  });

  it("refuses Prisma on the env var alone", () => {
    // The table may not exist. Trusting the flag by itself would 500 the first
    // create after a deploy.
    expect(
      selectIdempotencyStore(gatedClient, null, { [IDEMPOTENCY_STORE_ENV]: "prisma" }).backend
    ).toBe("memory");
  });

  it("refuses Prisma on the delegate alone", () => {
    expect(selectIdempotencyStore(readyDelegate, null, {}).backend).toBe("memory");
  });

  it("selects Prisma only when both signals agree", () => {
    expect(
      selectIdempotencyStore(readyDelegate, null, { [IDEMPOTENCY_STORE_ENV]: "prisma" }).backend
    ).toBe("prisma");
  });

  it("prefers Redis over the in-process store when one is configured", () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    expect(selectIdempotencyStore(gatedClient, cache, {}).backend).toBe("redis");
  });

  it("stays in process when no Redis is configured", () => {
    expect(selectIdempotencyStore(gatedClient, cache, {}).backend).toBe("memory");
  });

  it("reports durability honestly for whatever it picked", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const redis = selectIdempotencyStore(gatedClient, cache, {});

    // Redis is shared but evictable; only the M1 table is durable. A consumer
    // that logs or reports this must not be told otherwise.
    expect(redis.shared).toBe(true);
    expect(redis.durable).toBe(false);
    expect(
      selectIdempotencyStore(readyDelegate, cache, { [IDEMPOTENCY_STORE_ENV]: "prisma" }).durable
    ).toBe(true);
  });
});
