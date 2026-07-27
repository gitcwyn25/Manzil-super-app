import { groundSuggestions, MAX_SUGGESTIONS } from "./gurman.grounding";
import type { LiveBusiness } from "./gurman.types";

const live = new Map<string, LiveBusiness>([
  ["biz-1", { id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }],
  ["biz-2", { id: "biz-2", slug: "glow-beauty", name: "Glow Beauty" }]
]);

describe("groundSuggestions", () => {
  it("drops a business id that was never retrieved", () => {
    const result = groundSuggestions(
      [{ businessId: "biz-ghost", reason: "Invented by the model" }],
      live
    );

    expect(result.suggestions).toEqual([]);
    expect(result.droppedIds).toEqual(["biz-ghost"]);
  });

  it("keeps valid ids and hydrates name and slug from live rows", () => {
    const result = groundSuggestions(
      [{ businessId: "biz-1", reason: "Quiet, good Wi-Fi" }],
      live
    );

    expect(result.suggestions).toEqual([
      {
        businessId: "biz-1",
        slug: "caravan-coffee",
        name: "Caravan Coffee",
        reason: "Quiet, good Wi-Fi"
      }
    ]);
    expect(result.droppedIds).toEqual([]);
  });

  it("keeps the valid half of a mixed response", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "Real" },
        { businessId: "biz-ghost", reason: "Fake" },
        { businessId: "biz-2", reason: "Real" }
      ],
      live
    );

    expect(result.suggestions.map((s) => s.businessId)).toEqual(["biz-1", "biz-2"]);
    expect(result.droppedIds).toEqual(["biz-ghost"]);
  });

  it("deduplicates a repeated id, keeping the first reason", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "First" },
        { businessId: "biz-1", reason: "Second" }
      ],
      live
    );

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].reason).toBe("First");
  });

  it(`caps at ${MAX_SUGGESTIONS} suggestions`, () => {
    const many = new Map<string, LiveBusiness>();
    const input = [];
    for (let i = 0; i < 10; i += 1) {
      many.set(`b${i}`, { id: `b${i}`, slug: `s${i}`, name: `N${i}` });
      input.push({ businessId: `b${i}`, reason: "r" });
    }

    expect(groundSuggestions(input, many).suggestions).toHaveLength(MAX_SUGGESTIONS);
  });

  it("drops a suggestion with a blank or non-string reason", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "   " },
        { businessId: "biz-2", reason: 42 as unknown as string }
      ],
      live
    );

    expect(result.suggestions).toEqual([]);
  });

  it("returns empty for an empty model response rather than throwing", () => {
    expect(groundSuggestions([], live)).toEqual({ suggestions: [], droppedIds: [] });
  });
});
