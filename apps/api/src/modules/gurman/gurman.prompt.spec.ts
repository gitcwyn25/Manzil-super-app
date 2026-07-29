import { buildChatPrompt, parseModelReply } from "./gurman.prompt";
import type { RetrievedContext } from "./gurman.types";

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
      reviewSnippets: ["Juda yaxshi"]
    }
  ]
};

describe("buildChatPrompt", () => {
  it("includes the business id so the model can cite it", () => {
    const { user } = buildChatPrompt(context, "quiet cafe", "en");
    expect(user).toContain("biz-1");
  });

  it("omits absent translations rather than emitting empty or invented ones", () => {
    const { user } = buildChatPrompt(context, "quiet cafe", "ru");

    expect(user).toContain("Sokin muhit");
    expect(user).not.toContain("null");
  });

  it("instructs the model never to invent a translation", () => {
    const { system } = buildChatPrompt(context, "q", "ru");
    expect(system).toContain("never translate or invent");
  });

  it("names the requested reply language", () => {
    expect(buildChatPrompt(context, "q", "ru").system).toContain("Russian");
    expect(buildChatPrompt(context, "q", "uz").system).toContain("Uzbek");
    expect(buildChatPrompt(context, "q", "en").system).toContain("English");
  });

  it("forbids recommending anything outside the provided list", () => {
    const { system } = buildChatPrompt(context, "q", "en");
    expect(system).toContain("ONLY the businesses listed");
  });

  it("renders a placeholder rather than an empty catalog block", () => {
    const { user } = buildChatPrompt({ businesses: [] }, "q", "en");
    expect(user).toContain("no businesses available");
  });
});

describe("parseModelReply", () => {
  it("parses a bare JSON object", () => {
    const parsed = parseModelReply('{"reply":"hi","suggestions":[{"businessId":"b1","reason":"r"}]}');

    expect(parsed.reply).toBe("hi");
    expect(parsed.suggestions).toEqual([{ businessId: "b1", reason: "r" }]);
  });

  it("parses JSON wrapped in a markdown fence", () => {
    const parsed = parseModelReply('```json\n{"reply":"hi","suggestions":[]}\n```');
    expect(parsed.reply).toBe("hi");
  });

  it("parses JSON surrounded by prose", () => {
    const parsed = parseModelReply('Sure!\n{"reply":"hi","suggestions":[]}\nHope that helps.');
    expect(parsed.reply).toBe("hi");
  });

  it("throws on unparseable input so the caller can retry", () => {
    expect(() => parseModelReply("no json here at all")).toThrow();
  });

  it("throws when reply is missing", () => {
    expect(() => parseModelReply('{"suggestions":[]}')).toThrow();
  });

  it("defaults suggestions to an empty array when absent", () => {
    expect(parseModelReply('{"reply":"hi"}').suggestions).toEqual([]);
  });

  it("discards a non-array suggestions field rather than trusting it", () => {
    expect(parseModelReply('{"reply":"hi","suggestions":"nope"}').suggestions).toEqual([]);
  });
});
