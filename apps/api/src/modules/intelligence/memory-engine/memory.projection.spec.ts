import {
  countVisitsByBusiness,
  deriveBudget,
  deriveFavoriteBusinessIds,
  MAX_PROJECTED_CONFIDENCE,
  MIN_VISITS_FOR_FAVORITE,
  PLATFORM_CURRENCY,
  projectionConfidence,
  projectPreferenceKnowledge,
  type BusinessFacetRow,
  type CustomerMemoryRow,
  type VisitMemoryRow
} from "./memory.projection";

const NOW = "2026-08-07T09:00:00.000Z";

function visit(businessId: string, day: string): VisitMemoryRow {
  return { customerId: "cus_1", businessId, occurredAt: new Date(day) };
}

function customer(overrides: Partial<CustomerMemoryRow> = {}): CustomerMemoryRow {
  return {
    id: "cus_1",
    businessId: "biz_1",
    userId: "usr_1",
    phone: "+998901234567",
    visitCount: 4,
    totalSpend: { toString: () => "1200000.00" },
    lastVisitAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides
  };
}

const businesses: BusinessFacetRow[] = [
  { id: "biz_1", categoryId: "cat_1", categorySlug: "coffee", priceTier: "mid" },
  { id: "biz_2", categoryId: "cat_1", categorySlug: "coffee", priceTier: "premium" },
  { id: "biz_3", categoryId: "cat_2", categorySlug: "barber", priceTier: null }
];

const visits: VisitMemoryRow[] = [
  visit("biz_1", "2026-07-01T00:00:00.000Z"),
  visit("biz_1", "2026-07-15T00:00:00.000Z"),
  visit("biz_2", "2026-08-01T00:00:00.000Z"),
  visit("biz_3", "2026-06-01T00:00:00.000Z")
];

describe("favourites", () => {
  it("needs a second visit before a place counts as a favourite", () => {
    expect(MIN_VISITS_FOR_FAVORITE).toBe(2);
    expect(deriveFavoriteBusinessIds(visits)).toEqual(["biz_1"]);
  });

  it("orders by visits, then by id, so the same history always ranks the same", () => {
    const heavier = [...visits, visit("biz_2", "2026-08-02T00:00:00.000Z"), visit("biz_2", "2026-08-03T00:00:00.000Z")];

    expect(deriveFavoriteBusinessIds(heavier)).toEqual(["biz_2", "biz_1"]);
  });

  it("counts visits per business", () => {
    expect(countVisitsByBusiness(visits).get("biz_1")).toBe(2);
    expect(countVisitsByBusiness(visits).get("biz_3")).toBe(1);
  });
});

describe("budget", () => {
  it("states an observed ceiling and no floor — spending less proves no minimum", () => {
    const budget = deriveBudget([customer()]);

    expect(budget?.min).toBeNull();
    // 1 200 000 so'm over 4 visits = 300 000 so'm = 30 000 000 tiyin.
    expect(budget?.max).toEqual({ amountMinor: 30_000_000, currency: PLATFORM_CURRENCY });
  });

  it("sums across the CRM rows one person has at different providers", () => {
    const budget = deriveBudget([
      customer({ visitCount: 2, totalSpend: { toString: () => "200000.00" } }),
      customer({ id: "cus_2", businessId: "biz_2", visitCount: 2, totalSpend: { toString: () => "600000.00" } })
    ]);

    expect(budget?.max?.amountMinor).toBe(20_000_000);
  });

  it("says nothing when there is nothing to say", () => {
    expect(deriveBudget([])).toBeNull();
    expect(deriveBudget([customer({ visitCount: 0, totalSpend: { toString: () => "0" } })])).toBeNull();
  });
});

describe("confidence", () => {
  it("ramps with evidence and never reaches the certainty of a stated fact", () => {
    expect(projectionConfidence(0)).toBe(0);
    expect(projectionConfidence(4)).toBe(0.5);
    expect(projectionConfidence(8)).toBe(MAX_PROJECTED_CONFIDENCE);
    expect(projectionConfidence(1000)).toBe(MAX_PROJECTED_CONFIDENCE);
  });
});

describe("the projected preference tier", () => {
  const projected = projectPreferenceKnowledge({
    customerId: "usr_1",
    customers: [customer()],
    visits,
    businesses,
    now: NOW
  });

  it("reads the dominant category and price tier off actual visits", () => {
    expect(projected.knowledge.preferences).toEqual([
      {
        dimension: "category",
        fact: { value: "coffee", source: "visit", confidence: 0.38, observedAt: "2026-08-01T00:00:00.000Z" }
      },
      {
        dimension: "price_tier",
        fact: { value: "mid", source: "visit", confidence: 0.25, observedAt: "2026-08-01T00:00:00.000Z" }
      }
    ]);
  });

  it("stamps the claim as of the last visit, not as of now", () => {
    // Otherwise a live derivation would out-recency everything the customer
    // has ever actually said.
    expect(projected.observedAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("guesses nothing about diet — that needs review extraction (Epic 06)", () => {
    expect(projected.knowledge.dietary).toEqual([]);
  });

  it("reports no evidence for a first-time visitor instead of an empty-but-confident payload", () => {
    const empty = projectPreferenceKnowledge({
      customerId: "usr_2",
      customers: [],
      visits: [],
      businesses: [],
      now: NOW
    });

    expect(empty.evidenceCount).toBe(0);
    expect(empty.confidence).toBe(0);
    expect(empty.observedAt).toBe(NOW);
  });

  it("is deterministic: the same rows project the same knowledge", () => {
    const again = projectPreferenceKnowledge({
      customerId: "usr_1",
      customers: [customer()],
      visits: [...visits].reverse(),
      businesses,
      now: NOW
    });

    expect(again.knowledge).toEqual(projected.knowledge);
  });
});
