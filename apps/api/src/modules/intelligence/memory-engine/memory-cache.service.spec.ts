import { CacheService } from "../../cache/cache.service";
import { MemoryCacheService, MEMORY_CACHE_TTL } from "./memory-cache.service";

/**
 * Production runs with **no Redis provisioned**, so the in-memory fallback is
 * not a development convenience — it is the path that serves real traffic.
 * These tests therefore run exactly that path: no REDIS_URL, no ioredis
 * connection, no mocking of the cache internals.
 */
describe("MemoryCacheService — Redis-less fallback", () => {
  const originalUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalUrl;
    }
  });

  function makeCache() {
    return new MemoryCacheService(new CacheService());
  }

  it("reports the memory backend rather than pretending to have Redis", () => {
    expect(makeCache().backend).toBe("memory");
  });

  it("serves the second projection read from cache", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue({ visits: [] });

    const first = await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);
    const second = await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);

    expect(first).toEqual(second);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("keeps different customers apart", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockImplementation((): Promise<string> => Promise.resolve("value"));

    await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);
    await cache.read("activity:usr_2", MEMORY_CACHE_TTL.projection, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidate() makes the next read reload — what UpdateCustomerMemoryJob does first", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue({ visits: [] });

    await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);
    await cache.invalidate();
    await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidating twice is harmless, so a redelivered job cannot corrupt the cache", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue({ visits: [] });

    await cache.invalidate();
    await cache.invalidate();
    await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);
    await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("expires entries, because a stale projection is a wrong answer about a customer", async () => {
    jest.useFakeTimers();

    try {
      const cache = makeCache();
      const loader = jest.fn().mockResolvedValue({ visits: [] });

      await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);
      jest.advanceTimersByTime((MEMORY_CACHE_TTL.projection + 1) * 1000);
      await cache.read("activity:usr_1", MEMORY_CACHE_TTL.projection, loader);

      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
