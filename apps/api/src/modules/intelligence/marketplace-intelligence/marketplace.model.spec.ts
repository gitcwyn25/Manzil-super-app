import {
  coBookedServiceIds,
  computeDemand,
  computeDemandPrediction,
  computeNeighborhoodSummary,
  computeServiceSummary,
  computeTrend,
  PREDICTION_HORIZON_DAYS,
  restatedFact,
  substitutionFacts,
  weeklyCounts,
  type DemandObservations,
  type NeighborhoodObservations,
  type ServiceObservations
} from "./marketplace.model";
import { MODEL_EVIDENCE_FLOOR, valueOrNull } from "./marketplace-intelligence.evidence";
import type {
  BusinessIntelligenceRow,
  PackageIntelligenceRow
} from "./marketplace-intelligence.projection";

const NOW = "2026-08-07T09:00:00.000Z";
const decimal = (value: string) => ({ toString: () => value });

function business(id: string, over: Partial<BusinessIntelligenceRow> = {}): BusinessIntelligenceRow {
  return {
    id,
    categoryId: "cat_coffee",
    categorySlug: "coffee",
    city: "Tashkent",
    district: "Yunusobod",
    priceTier: "mid",
    status: "claimed",
    verificationStatus: "verified",
    avgRating: decimal("4.5"),
    reviewCount: 3,
    lat: decimal("41.30"),
    lng: decimal("69.24"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...over
  };
}

function pkg(id: string, over: Partial<PackageIntelligenceRow> = {}): PackageIntelligenceRow {
  return {
    id,
    businessId: `biz_${id}`,
    name: "Haircut",
    price: decimal("100000"),
    currency: "UZS",
    isActive: true,
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...over
  };
}

function neighborhood(over: Partial<NeighborhoodObservations> = {}): NeighborhoodObservations {
  return {
    neighborhoodId: "neighborhood:Tashkent:Yunusobod",
    key: { city: "Tashkent", district: "Yunusobod" },
    businesses: [],
    bookings: [],
    visits: [],
    searches: [],
    ...over
  };
}

/** Instants spread evenly across `days` back from NOW. */
function spread(count: number, days: number): Date[] {
  const end = Date.parse(NOW);
  return Array.from(
    { length: count },
    (_, index) => new Date(end - Math.floor((index * days * 86_400_000) / count) - 3_600_000)
  );
}

describe("NeighborhoodSummary", () => {
  it("reports knowledge_missing for a district the platform has no business in", () => {
    const outcome = computeNeighborhoodSummary(neighborhood(), NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({
      kind: "knowledge_missing",
      missingKey: "neighborhood.businesses"
    });
  });

  it("restates the business count with certainty and withholds the rest", () => {
    const outcome = computeNeighborhoodSummary(
      neighborhood({ businesses: [business("biz_1"), business("biz_2")] }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.businessCount.value).toBe(2);
    // A count of rows is a restatement, not an interpretation.
    expect(summary?.businessCount.confidence).toBe(1);
    // Two businesses is below the character floor, so the price level stays null.
    expect(summary?.averagePriceLevel).toBeNull();
    expect(summary?.peakActivity).toBeNull();
  });

  it("publishes an average price level once enough businesses declare one", () => {
    const outcome = computeNeighborhoodSummary(
      neighborhood({
        businesses: [
          business("biz_1", { priceTier: "budget" }),
          business("biz_2", { priceTier: "mid" }),
          business("biz_3", { priceTier: "premium" })
        ]
      }),
      NOW
    );

    expect(valueOrNull(outcome)?.averagePriceLevel?.value).toBe(0.5);
  });

  it("only calls services underserved when the demand model said so", () => {
    const withoutDemand = computeNeighborhoodSummary(
      neighborhood({ businesses: [business("biz_1"), business("biz_2"), business("biz_3")] }),
      NOW
    );

    expect(valueOrNull(withoutDemand)?.underservedServiceIds).toEqual([]);

    const withDemand = computeNeighborhoodSummary(
      neighborhood({ businesses: [business("biz_1"), business("biz_2"), business("biz_3")] }),
      NOW,
      ["category:florist"]
    );

    expect(valueOrNull(withDemand)?.underservedServiceIds).toEqual(["category:florist"]);
  });
});

describe("ServiceSummary", () => {
  const serviceObservations = (over: Partial<ServiceObservations> = {}): ServiceObservations => ({
    serviceId: "service-market:haircut",
    serviceKey: "haircut",
    packages: [],
    bookings: [],
    serviceNamesByIdentity: new Map(),
    ...over
  });

  it("reports knowledge_missing when nobody provides the service", () => {
    const outcome = computeServiceSummary(serviceObservations(), NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ missingKey: "service.providers" });
  });

  it("withholds a market rate from a market of one", () => {
    const outcome = computeServiceSummary(
      serviceObservations({ packages: [pkg("1")] }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.providerCount.value).toBe(1);
    expect(summary?.medianPrice).toBeNull();
  });

  it("publishes a median price across providers", () => {
    const outcome = computeServiceSummary(
      serviceObservations({
        packages: [
          pkg("1", { businessId: "biz_1", price: decimal("80000") }),
          pkg("2", { businessId: "biz_2", price: decimal("120000") })
        ]
      }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.providerCount.value).toBe(2);
    expect(summary?.medianPrice?.value).toEqual({ amountMinor: 10_000_000, currency: "UZS" });
  });

  it("names co-booked services from what the same people booked", () => {
    const ids = coBookedServiceIds(
      serviceObservations({
        serviceNamesByIdentity: new Map([
          ["user:1", ["Haircut", "Beard trim"]],
          ["user:2", ["haircut", "BEARD TRIM"]],
          ["user:3", ["Massage"]]
        ])
      })
    );

    expect(ids).toEqual(["service-market:beard%20trim"]);
  });
});

describe("TrendSummary", () => {
  it("reports knowledge_missing for story mentions — nothing records them", () => {
    const outcome = computeTrend(
      { subjectEntityId: "biz_1", metric: "story_mentions", instants: [] },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ kind: "knowledge_missing", missingKey: "story" });
    // No amount of traffic creates a Story table.
    expect(outcome.failure.retryable).toBe(false);
  });

  it("refuses below the observation floor", () => {
    const outcome = computeTrend(
      { subjectEntityId: "biz_1", metric: "bookings", instants: spread(4, 50) },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });

  it("refuses when only one half of the comparison has data", () => {
    const outcome = computeTrend(
      { subjectEntityId: "biz_1", metric: "bookings", instants: spread(20, 20) },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({
      scopeKey: "trend:bookings:biz_1#half_window"
    });
  });

  it("compares two equal windows and reports the direction", () => {
    const recent = spread(15, 29);
    const older = spread(5, 59).filter(
      (at) => at.getTime() < Date.parse(NOW) - 30 * 86_400_000
    );

    const outcome = computeTrend(
      { subjectEntityId: "biz_1", metric: "bookings", instants: [...recent, ...older] },
      NOW
    );

    expect(outcome.status).toBe("computed");
    expect(valueOrNull(outcome)?.direction).toBe("rising");
    expect(valueOrNull(outcome)?.metric).toBe("bookings");
  });
});

describe("DemandSummary", () => {
  const demandObservations = (over: Partial<DemandObservations> = {}): DemandObservations => ({
    serviceOrCategoryId: "category:florist",
    neighborhoodId: "neighborhood:Tashkent:Yunusobod",
    demandInstants: [],
    supplyCount: 0,
    ...over
  });

  it("refuses with no supply — pressure over zero providers is undefined, not infinite", () => {
    const outcome = computeDemand(
      demandObservations({ demandInstants: spread(30, 20), supplyCount: 0 }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });

  it("computes pressure as demand over supply", () => {
    const outcome = computeDemand(
      demandObservations({ demandInstants: spread(20, 20), supplyCount: 4 }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.demandVolume.value).toBe(20);
    expect(summary?.supplyCount.value).toBe(4);
    expect(summary?.pressure.value).toBe(5);
    // Volume and supply are counts; pressure is the reading of them.
    expect(summary?.demandVolume.confidence).toBe(1);
    expect(summary?.pressure.confidence).toBeLessThan(1);
  });
});

describe("DemandPrediction — the honesty test", () => {
  const demandObservations = (over: Partial<DemandObservations> = {}): DemandObservations => ({
    serviceOrCategoryId: "category:florist",
    neighborhoodId: null,
    demandInstants: [],
    supplyCount: 5,
    ...over
  });

  it("refuses at Manzil's current size, naming the real observation count", () => {
    const outcome = computeDemandPrediction(
      demandObservations({ demandInstants: spread(6, 60), supplyCount: 2 }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toEqual({
      kind: "marketplace_sparse",
      scopeKey: "demand_prediction:category:florist",
      sampleSize: 6
    });
    expect(outcome.evidence.required).toBe(MODEL_EVIDENCE_FLOOR.demand_prediction.minObservations);
  });

  it("refuses when the history is all crammed into a few weeks", () => {
    // Plenty of observations, but seven of eight weeks are empty — a gap in
    // the log would otherwise drag the mean down as though demand had fallen.
    const outcome = computeDemandPrediction(
      demandObservations({ demandInstants: spread(60, 3) }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({
      scopeKey: "demand_prediction:category:florist#sparse_weeks"
    });
  });

  it("forecasts from the weekly mean, and says that is what it did", () => {
    const outcome = computeDemandPrediction(
      demandObservations({ demandInstants: spread(56, 55) }),
      NOW
    );

    expect(outcome.status).toBe("computed");
    const prediction = valueOrNull(outcome);

    expect(prediction?.basis).toBe("weekly_mean");
    expect(prediction?.weeksObserved).toBe(8);
    expect(prediction?.expectedDemand.value).toBeGreaterThan(0);
    expect(Date.parse(prediction!.horizon.end) - Date.parse(prediction!.horizon.start)).toBe(
      PREDICTION_HORIZON_DAYS * 86_400_000
    );
  });

  it("counts observations into whole weeks, oldest first", () => {
    const counts = weeklyCounts(
      [
        new Date("2026-08-06T00:00:00.000Z"),
        new Date("2026-08-05T00:00:00.000Z"),
        new Date("2026-07-25T00:00:00.000Z")
      ],
      NOW,
      3
    );

    expect(counts).toEqual([0, 1, 2]);
  });
});

describe("relationship facts", () => {
  it("publishes substitution only, and leaves edges to Layer 3", () => {
    const facts = substitutionFacts(
      "biz_1",
      [
        { businessId: "biz_2", constraintOverlap: 0.75 },
        { businessId: "biz_3", constraintOverlap: 0.2 }
      ],
      { start: "2026-05-09T09:00:00.000Z", end: NOW },
      NOW
    );

    expect(facts).toHaveLength(2);
    expect(facts.every((fact) => fact.pattern === "substitution")).toBe(true);
    expect(facts[0]?.strength.value).toBe(0.75);
  });
});

describe("restated facts", () => {
  it("carry certainty, because they restate rows rather than interpret them", () => {
    const fact = restatedFact(7, 7, { start: "2026-05-09T09:00:00.000Z", end: NOW }, NOW);

    expect(fact.confidence).toBe(1);
    expect(fact.sampleSize).toBe(7);
    expect(fact.generatedAt).toBe(NOW);
  });
});
