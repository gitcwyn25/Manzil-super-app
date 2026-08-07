import {
  applyFilters,
  evaluateFilter,
  evaluateItem,
  forbiddenFilterFailure,
  internalFiltersFor,
  isFilterSetPermitted,
  isOpenAt,
  overlaps,
  SOFT_FILTER_PENALTY,
  withinBudget
} from "./retrieval-filters";
import { buildItem, payloadOf, RETRIEVAL_FACT_KEYS } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import type { RetrievalFilter, RetrievalItem, RetrievalScalar } from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

function item(facts: Readonly<Record<string, RetrievalScalar | readonly RetrievalScalar[]>>): RetrievalItem {
  return buildItem({
    kind: "business",
    entityId: "biz_1",
    engineId: "business",
    retrievalSource: "business_knowledge",
    score: buildScore(1, ["business_knowledge"]),
    payload: payloadOf(Object.entries(facts).map(([key, value]) => ({ key, value }))),
    confidence: 1,
    generatedAt: NOW,
    now: NOW,
    ttlSeconds: null
  });
}

const hardDistance: RetrievalFilter = { kind: "distance", mode: "hard", maxKm: 5 };
const softDistance: RetrievalFilter = { kind: "distance", mode: "soft", maxKm: 5 };

describe("evaluateFilter — three-valued, because absence is not failure", () => {
  it("passes an item within the limit", () => {
    expect(evaluateFilter(hardDistance, item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 2 }))).toBe("passed");
  });

  it("fails an item outside it", () => {
    expect(evaluateFilter(hardDistance, item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 9 }))).toBe("failed");
  });

  it("returns undecidable — not failed — when nobody measured the distance", () => {
    expect(evaluateFilter(hardDistance, item({}))).toBe("undecidable");
  });

  it("treats an absent boolean capability as unmeasured, never as false", () => {
    const filter: RetrievalFilter = { kind: "verified_only", mode: "hard" };

    expect(evaluateFilter(filter, item({}))).toBe("undecidable");
    expect(evaluateFilter(filter, item({ [RETRIEVAL_FACT_KEYS.verified]: false }))).toBe("failed");
    expect(evaluateFilter(filter, item({ [RETRIEVAL_FACT_KEYS.verified]: true }))).toBe("passed");
  });

  it("matches categories by intersection", () => {
    const filter: RetrievalFilter = { kind: "category", mode: "hard", categoryIds: ["cat_a"] };

    expect(evaluateFilter(filter, item({ [RETRIEVAL_FACT_KEYS.categoryIds]: ["cat_a", "cat_b"] }))).toBe(
      "passed"
    );
    expect(evaluateFilter(filter, item({ [RETRIEVAL_FACT_KEYS.categoryIds]: ["cat_z"] }))).toBe("failed");
  });

  it("requires every accessibility capability, not merely one", () => {
    const filter: RetrievalFilter = {
      kind: "accessibility",
      mode: "hard",
      capabilityKeys: ["step_free", "accessible_wc"]
    };

    expect(
      evaluateFilter(filter, item({ [RETRIEVAL_FACT_KEYS.capabilityKeys]: ["step_free"] }))
    ).toBe("failed");
    expect(
      evaluateFilter(
        filter,
        item({ [RETRIEVAL_FACT_KEYS.capabilityKeys]: ["step_free", "accessible_wc", "parking"] })
      )
    ).toBe("passed");
  });

  it("compares budget only in a currency it can compare", () => {
    const filter: RetrievalFilter = {
      kind: "budget",
      mode: "hard",
      range: { min: null, max: { amountMinor: 500_000, currency: "UZS" } }
    };

    const affordable = item({
      [RETRIEVAL_FACT_KEYS.priceMinorUnits]: 300_000,
      [RETRIEVAL_FACT_KEYS.currency]: "UZS"
    });
    const expensive = item({
      [RETRIEVAL_FACT_KEYS.priceMinorUnits]: 900_000,
      [RETRIEVAL_FACT_KEYS.currency]: "UZS"
    });
    const otherCurrency = item({
      [RETRIEVAL_FACT_KEYS.priceMinorUnits]: 900_000,
      [RETRIEVAL_FACT_KEYS.currency]: "USD"
    });

    expect(evaluateFilter(filter, affordable)).toBe("passed");
    expect(evaluateFilter(filter, expensive)).toBe("failed");
    // No exchange rate exists in this module, so a foreign band cannot
    // constrain — and the item is shown rather than silently dropped.
    expect(evaluateFilter(filter, otherCurrency)).toBe("passed");
  });

  it("checks a declared weekly window for open-now", () => {
    const filter: RetrievalFilter = {
      kind: "open_now",
      mode: "hard",
      at: "2026-08-07T19:30:00.000Z"
    };

    // 2026-08-07 is a Friday.
    const open = item({ [RETRIEVAL_FACT_KEYS.openWindows]: ["friday|18:00|23:00"] });
    const closed = item({ [RETRIEVAL_FACT_KEYS.openWindows]: ["monday|09:00|17:00"] });

    expect(evaluateFilter(filter, open)).toBe("passed");
    expect(evaluateFilter(filter, closed)).toBe("failed");
  });
});

describe("applyFilters", () => {
  it("drops hard failures and keeps a count", () => {
    const items = [
      item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 1 }),
      item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 50 })
    ];

    const result = applyFilters(items, [hardDistance], NOW);

    expect(result.items).toHaveLength(1);
    expect(result.dropped).toBe(1);
  });

  it("keeps soft failures and charges them a penalty instead", () => {
    const far = item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 50 });
    const result = applyFilters([far], [softDistance], NOW);

    expect(result.items).toHaveLength(1);
    expect(result.penalized).toBe(1);
    expect(result.items[0]!.score.overallScore).toBeCloseTo(
      far.score.overallScore * SOFT_FILTER_PENALTY,
      4
    );
  });

  it("keeps undecidable items, flags them, and warns once per filter kind", () => {
    const unmeasured = [item({}), item({})];
    const result = applyFilters(unmeasured, [hardDistance], NOW);

    expect(result.items).toHaveLength(2);
    expect(result.undecidable).toBe(2);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]!.scopeKey).toBe("filter:distance");
    expect(result.items[0]!.score.reasonCodes).toContain("filter_undecidable");
  });

  it("names the missing fact key in the warning, so a drifted key is visible", () => {
    const result = applyFilters([item({})], [hardDistance], NOW);
    const error = result.warnings[0]!.failure.error;

    expect(error.kind).toBe("knowledge_missing");
    expect(error.kind === "knowledge_missing" && error.missingKey).toBe(
      RETRIEVAL_FACT_KEYS.distanceKm
    );
  });

  it("is a no-op for an empty filter set, returning the very same array", () => {
    const items = [item({})];

    expect(applyFilters(items, [], NOW).items).toBe(items);
  });

  it("reports every verdict for one item at once", () => {
    const verdicts = evaluateItem(item({ [RETRIEVAL_FACT_KEYS.distanceKm]: 50 }), [
      hardDistance,
      softDistance,
      { kind: "verified_only", mode: "hard" }
    ]);

    expect(verdicts.kept).toBe(false);
    expect(verdicts.failedHard).toEqual(["distance"]);
    expect(verdicts.failedSoft).toEqual(["distance"]);
    expect(verdicts.undecidable).toEqual(["verified_only"]);
  });
});

describe("internal-only filters (ADR-001: least privilege)", () => {
  const premium: RetrievalFilter = { kind: "premium_only", mode: "hard" };

  it("identifies the internal filters in a set", () => {
    expect(internalFiltersFor([hardDistance, premium])).toEqual(["premium_only"]);
    expect(internalFiltersFor([hardDistance])).toEqual([]);
  });

  it("permits them for an internal principal and nobody else", () => {
    expect(isFilterSetPermitted([premium], "internal")).toBe(true);
    expect(isFilterSetPermitted([premium], "customer")).toBe(false);
    expect(isFilterSetPermitted([premium], "business_owner")).toBe(false);
    expect(isFilterSetPermitted([hardDistance], "customer")).toBe(true);
  });

  it("produces a permission_denied failure carrying the ADR-001 audit shape", () => {
    const failure = forbiddenFilterFailure(["premium_only"], "customer", NOW);

    expect(failure.error.kind).toBe("permission_denied");
    expect(failure.error.kind === "permission_denied" && failure.error.principal).toBe("customer");
    expect(failure.retryable).toBe(false);
  });
});

describe("filter primitives", () => {
  it("treats intervals as half-open", () => {
    expect(
      overlaps(
        "2026-08-07T18:00:00.000Z",
        "2026-08-07T20:00:00.000Z",
        "2026-08-07T20:00:00.000Z",
        "2026-08-07T22:00:00.000Z"
      )
    ).toBe(false);
    expect(
      overlaps(
        "2026-08-07T18:00:00.000Z",
        "2026-08-07T20:00:00.000Z",
        "2026-08-07T19:00:00.000Z",
        "2026-08-07T22:00:00.000Z"
      )
    ).toBe(true);
  });

  it("returns false rather than throwing on an unparseable window", () => {
    expect(overlaps("not-a-date", "x", "y", "z")).toBe(false);
    expect(isOpenAt(["friday|18:00|23:00"], "not-a-date")).toBe(false);
    expect(isOpenAt(["friday|bad|23:00"], "2026-08-07T19:00:00.000Z")).toBe(false);
  });

  it("admits any amount when both bounds are open", () => {
    expect(withinBudget({ amountMinor: 1, currency: "UZS" }, { min: null, max: null })).toBe(true);
  });
});
