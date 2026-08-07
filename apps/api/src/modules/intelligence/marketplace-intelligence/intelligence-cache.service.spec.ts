import { CacheService } from "../../cache/cache.service";
import {
  IntelligenceCacheService,
  MARKETPLACE_CACHE_NAMESPACE,
  MARKETPLACE_CACHE_TTL
} from "./intelligence-cache.service";

/**
 * Exercises the in-memory path deliberately: production has no Redis
 * provisioned, so the fallback is not a development convenience — it is what
 * actually runs. No `REDIS_URL`, no mocking of cache internals.
 */
describe("the marketplace intelligence cache", () => {
  const original = process.env.REDIS_URL;

  beforeAll(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (original !== undefined) process.env.REDIS_URL = original;
  });

  function makeCache() {
    const platform = new CacheService();
    return { cache: new IntelligenceCacheService(platform), platform };
  }

  it("runs on the in-memory fallback and reports it honestly", () => {
    const { cache } = makeCache();

    expect(cache.backend).toBe("memory");
    expect(MARKETPLACE_CACHE_NAMESPACE).toBe("marketplace-intelligence");
  });

  it("loads once and serves the cached id list on the second read", async () => {
    const { cache } = makeCache();
    const loader = jest.fn().mockResolvedValue(["biz_1", "biz_2"]);

    const first = await cache.readIds("peers:cat_1", MARKETPLACE_CACHE_TTL.peers, loader);
    const second = await cache.readIds("peers:cat_1", MARKETPLACE_CACHE_TTL.peers, loader);

    expect(first).toEqual(["biz_1", "biz_2"]);
    expect(second).toEqual(["biz_1", "biz_2"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("keeps different categories in different keys", async () => {
    const { cache } = makeCache();

    await cache.readIds("peers:cat_1", 300, async () => ["biz_1"]);
    const other = await cache.readIds("peers:cat_2", 300, async () => ["biz_9"]);

    expect(other).toEqual(["biz_9"]);
  });

  it("reloads after invalidation, and invalidating twice is harmless", async () => {
    const { cache } = makeCache();
    const loader = jest.fn().mockResolvedValue(["biz_1"]);

    await cache.readIds("peers:cat_1", 300, loader);
    await cache.invalidate();
    await cache.invalidate();
    await cache.readIds("peers:cat_1", 300, loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("survives the JSON round trip because only strings go in", async () => {
    const { cache } = makeCache();

    await cache.readIds("peers:cat_1", 300, async () => ["biz_1"]);
    const cached = await cache.readIds("peers:cat_1", 300, async () => ["ignored"]);

    // A Date would come back a string and a Map an empty object — which is why
    // the signature admits neither.
    expect(cached.every((id) => typeof id === "string")).toBe(true);
  });
});
