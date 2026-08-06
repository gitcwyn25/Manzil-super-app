import { CacheService } from "../../cache/cache.service";
import { GraphCacheService, GRAPH_CACHE_TTL } from "./graph-cache.service";

/**
 * Production runs with **no Redis provisioned**, so the in-memory fallback is
 * not a development convenience — it is the path that serves real traffic.
 * These tests therefore run exactly that path: no REDIS_URL, no ioredis
 * connection, no mocking of the cache internals.
 */
describe("GraphCacheService — Redis-less fallback", () => {
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
    return new GraphCacheService(new CacheService());
  }

  it("reports the memory backend rather than pretending to have Redis", () => {
    expect(makeCache().backend).toBe("memory");
  });

  it("serves the second read from cache", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue({ id: "business:b1" });

    const first = await cache.read("entity:business:b1", GRAPH_CACHE_TTL.entity, loader);
    const second = await cache.read("entity:business:b1", GRAPH_CACHE_TTL.entity, loader);

    expect(first).toEqual(second);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("keeps different graph keys apart", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockImplementation((): Promise<string> => Promise.resolve("value"));

    await cache.read("entity:business:b1", GRAPH_CACHE_TTL.entity, loader);
    await cache.read("entity:business:b2", GRAPH_CACHE_TTL.entity, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidate() makes the next read reload — the rebuild job's only side effect", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue(["edge"]);

    await cache.read("related:business:b1", GRAPH_CACHE_TTL.related, loader);
    await cache.invalidate();
    await cache.read("related:business:b1", GRAPH_CACHE_TTL.related, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidating twice is harmless, so a redelivered job cannot corrupt the cache", async () => {
    const cache = makeCache();
    const loader = jest.fn().mockResolvedValue(["edge"]);

    await cache.invalidate();
    await cache.invalidate();
    await cache.read("related:business:b1", GRAPH_CACHE_TTL.related, loader);
    await cache.read("related:business:b1", GRAPH_CACHE_TTL.related, loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("expires entries, because a stale projection is a wrong answer", async () => {
    jest.useFakeTimers();

    try {
      const cache = makeCache();
      const loader = jest.fn().mockResolvedValue({ id: "business:b1" });

      await cache.read("entity:business:b1", GRAPH_CACHE_TTL.entity, loader);
      jest.advanceTimersByTime((GRAPH_CACHE_TTL.entity + 1) * 1000);
      await cache.read("entity:business:b1", GRAPH_CACHE_TTL.entity, loader);

      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
