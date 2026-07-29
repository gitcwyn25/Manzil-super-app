import { GurmanService } from "./gurman.service";
import type { LiveBusiness, RetrievedContext } from "./gurman.types";

const context: RetrievedContext = {
  businesses: [
    {
      id: "biz-1",
      slug: "caravan-coffee",
      name: "Caravan Coffee",
      categoryName: "Coffee",
      district: "Mirzo Ulugbek",
      priceTier: "$$",
      avgRating: 4.5,
      reviewCount: 3,
      descriptions: { uz: "Sokin muhit", ru: null, en: null },
      reviewSnippets: []
    }
  ]
};

/** Passes values straight through, so the service's own caching is what is tested. */
function passthroughCache() {
  return {
    getOrSet: jest.fn(async (_ns: string, _key: string, _ttl: number, loader: () => Promise<unknown>) => loader())
  };
}

/** Returns a fixed cached value without calling the loader — simulates a cache hit. */
function hitCache(value: unknown) {
  return { getOrSet: jest.fn(async () => value) };
}

function makeRetriever(live: Array<[string, LiveBusiness]>) {
  return {
    retrieve: jest.fn().mockResolvedValue(context),
    liveBusinesses: jest.fn().mockResolvedValue(new Map(live))
  };
}

const LIVE_BIZ_1: [string, LiveBusiness] = ["biz-1", { id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }];

describe("GurmanService.ask", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("returns unavailable and never calls Anthropic, the retriever, or the cache when the key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const llm = { complete: jest.fn() };
    const retriever = makeRetriever([LIVE_BIZ_1]);
    const cache = passthroughCache();
    const service = new GurmanService(retriever as never, llm as never, cache as never);

    const result = await service.ask("quiet cafe", "en");

    expect(result).toEqual({ text: "", businesses: [], available: false });
    expect(llm.complete).not.toHaveBeenCalled();
    expect(retriever.retrieve).not.toHaveBeenCalled();
    expect(cache.getOrSet).not.toHaveBeenCalled();
  });

  it("treats a blank/whitespace key the same as a missing one", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const llm = { complete: jest.fn() };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("quiet cafe", "en");

    expect(result.available).toBe(false);
    expect(llm.complete).not.toHaveBeenCalled();
  });

  it("returns a grounded answer for a valid model response", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llm = {
      complete: jest
        .fn()
        .mockResolvedValue('{"reply":"Try Caravan.","suggestions":[{"businessId":"biz-1","reason":"Quiet"}]}')
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("quiet cafe", "en");

    expect(result).toEqual({
      text: "Try Caravan.",
      businesses: [{ businessId: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee", reason: "Quiet" }],
      available: true
    });
  });

  it("rejects a business id the model invented, keeping the prose but zero cards", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llm = {
      complete: jest
        .fn()
        .mockResolvedValue('{"reply":"Try Ghost Cafe.","suggestions":[{"businessId":"biz-ghost","reason":"Invented"}]}')
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("anything", "en");

    expect(result.available).toBe(true);
    expect(result.text).toBe("Try Ghost Cafe.");
    expect(result.businesses).toEqual([]);
  });

  it("re-validates on a cache hit, dropping a business unpublished since caching", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const cached = { reply: "Try Caravan.", suggestions: [{ businessId: "biz-1", reason: "Quiet" }] };
    // Retriever reports no live rows: the business was suspended after caching.
    const retriever = makeRetriever([]);
    const llm = { complete: jest.fn() };
    const service = new GurmanService(retriever as never, llm as never, hitCache(cached) as never);

    const result = await service.ask("quiet cafe", "en");

    expect(result.businesses).toEqual([]);
    expect(llm.complete).not.toHaveBeenCalled();
    expect(retriever.liveBusinesses).toHaveBeenCalledWith(["biz-1"]);
  });

  it("degrades to unavailable rather than throwing when the LLM call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llm = { complete: jest.fn().mockRejectedValue(new Error("upstream error")) };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("quiet cafe", "en");

    expect(result).toEqual({ text: "", businesses: [], available: false });
  });

  it("retries once on unparseable JSON, then succeeds", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llm = {
      complete: jest
        .fn()
        .mockResolvedValueOnce("not json")
        .mockResolvedValueOnce('{"reply":"Recovered.","suggestions":[]}')
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("q", "en");

    expect(result.available).toBe(true);
    expect(result.text).toBe("Recovered.");
    expect(llm.complete).toHaveBeenCalledTimes(2);
  });

  it("degrades to unavailable when both attempts are unparseable", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const llm = { complete: jest.fn().mockResolvedValue("still not json") };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.ask("q", "en");

    expect(result.available).toBe(false);
    expect(llm.complete).toHaveBeenCalledTimes(2);
  });

  it("caches per locale so languages never share an entry", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const cache = passthroughCache();
    const llm = { complete: jest.fn().mockResolvedValue('{"reply":"hi","suggestions":[]}') };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, cache as never);

    await service.ask("Same Question", "en");
    await service.ask("same question", "ru");

    const [firstKey, secondKey] = cache.getOrSet.mock.calls.map((call) => call[1]);
    expect(firstKey).not.toBe(secondKey);
    expect(firstKey).toContain("en:");
    expect(secondKey).toContain("ru:");
  });

  it("normalises case and whitespace into one cache key", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const cache = passthroughCache();
    const llm = { complete: jest.fn().mockResolvedValue('{"reply":"hi","suggestions":[]}') };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, cache as never);

    await service.ask("  Quiet   Cafe ", "en");
    await service.ask("quiet cafe", "en");

    const [firstKey, secondKey] = cache.getOrSet.mock.calls.map((call) => call[1]);
    expect(firstKey).toBe(secondKey);
  });
});
