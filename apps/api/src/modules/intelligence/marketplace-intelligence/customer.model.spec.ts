import {
  activityRadiusKm,
  averageSpendPerVisit,
  budgetFromSpend,
  computeBirthdayProbability,
  computeCustomerFacts,
  computeCustomerHealth,
  computeCustomerSummary,
  computeMemorySnapshot,
  daysUntilAnniversary,
  type CustomerObservations
} from "./customer.model";
import { valueOrNull } from "./marketplace-intelligence.evidence";
import type {
  BookingIntelligenceRow,
  BusinessIntelligenceRow,
  CustomerIntelligenceRow,
  VisitIntelligenceRow
} from "./marketplace-intelligence.projection";

const NOW = "2026-08-07T09:00:00.000Z";
const decimal = (value: string) => ({ toString: () => value });

function business(
  id: string,
  over: Partial<BusinessIntelligenceRow> = {}
): BusinessIntelligenceRow {
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

function crmRow(over: Partial<CustomerIntelligenceRow> = {}): CustomerIntelligenceRow {
  return {
    id: "cus_1",
    businessId: "biz_1",
    userId: "usr_1",
    tags: [],
    visitCount: 4,
    totalSpend: decimal("1200000"),
    lastVisitAt: new Date("2026-07-18T00:00:00.000Z"),
    firstSeenAt: new Date("2026-02-01T00:00:00.000Z"),
    birthday: null,
    updatedAt: new Date("2026-07-18T00:00:00.000Z"),
    ...over
  };
}

function visitAt(at: string, businessId = "biz_1"): VisitIntelligenceRow {
  return { businessId, customerId: "cus_1", occurredAt: new Date(at) };
}

function bookingAt(at: string, createdAt: string): BookingIntelligenceRow {
  return {
    id: `bok_${at}`,
    businessId: "biz_1",
    customerId: "cus_1",
    serviceName: "Haircut",
    startsAt: new Date(at),
    endsAt: new Date(Date.parse(at) + 3_600_000),
    status: "completed",
    createdAt: new Date(createdAt)
  };
}

function observations(over: Partial<CustomerObservations> = {}): CustomerObservations {
  return {
    customerId: "usr_1",
    customers: [crmRow()],
    visits: [],
    bookings: [],
    businesses: [business("biz_1")],
    ...over
  };
}

describe("CustomerHealth", () => {
  it("refuses with two visits — one interval is not a rhythm", () => {
    const outcome = computeCustomerHealth(
      observations({ visits: [visitAt("2026-07-01T10:00:00.000Z"), visitAt("2026-07-15T10:00:00.000Z")] }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ kind: "marketplace_sparse", sampleSize: 2 });
  });

  it("refuses when every visit fell on the same day", () => {
    const sameDay = ["10:00", "12:00", "18:00"].map((time) =>
      visitAt(`2026-07-15T${time}:00.000Z`)
    );

    expect(computeCustomerHealth(observations({ visits: sameDay }), NOW).status).toBe(
      "insufficient_data"
    );
  });

  it("measures churn against the customer's own rhythm, not a marketplace average", () => {
    const outcome = computeCustomerHealth(
      observations({
        visits: [
          visitAt("2026-06-28T10:00:00.000Z"),
          visitAt("2026-07-08T10:00:00.000Z"),
          visitAt("2026-07-18T10:00:00.000Z")
        ]
      }),
      NOW
    );

    const health = valueOrNull(outcome);
    expect(health?.typicalIntervalDays).toBe(10);
    expect(health?.daysSinceLastVisit).toBe(19);
    // Nearly twice their own interval: lapsing, not dormant.
    expect(health?.engagement).toBe("lapsing");
    expect(health?.churnRisk).toBe(0.63);
    expect(health?.lifetimeVisits).toBe(3);
  });

  it("calls somebody dormant past three of their own intervals", () => {
    const outcome = computeCustomerHealth(
      observations({
        visits: [
          visitAt("2026-05-01T10:00:00.000Z"),
          visitAt("2026-05-16T10:00:00.000Z"),
          visitAt("2026-06-01T10:00:00.000Z")
        ]
      }),
      NOW
    );

    expect(valueOrNull(outcome)?.engagement).toBe("dormant");
    expect(valueOrNull(outcome)?.churnRisk).toBe(1);
  });

  it("counts cancellations against health without letting them define it", () => {
    const outcome = computeCustomerHealth(
      observations({
        visits: [
          visitAt("2026-07-20T10:00:00.000Z"),
          visitAt("2026-07-30T10:00:00.000Z"),
          visitAt("2026-08-05T10:00:00.000Z")
        ],
        bookings: [
          { ...bookingAt("2026-07-20T10:00:00.000Z", "2026-07-19T10:00:00.000Z"), status: "canceled" },
          bookingAt("2026-07-30T10:00:00.000Z", "2026-07-29T10:00:00.000Z")
        ]
      }),
      NOW
    );

    expect(valueOrNull(outcome)?.cancellationRate).toBe(0.5);
    expect(valueOrNull(outcome)?.overall).toBeGreaterThan(0);
  });
});

describe("CustomerSummary", () => {
  it("refuses for an id with no CRM row and no activity — that is not a customer", () => {
    const outcome = computeCustomerSummary(
      { customerId: "nobody", customers: [], visits: [], bookings: [], businesses: [] },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });

  it("is produced for a thin customer, reporting confidence 0 where one visit shows nothing", () => {
    const outcome = computeCustomerSummary(
      observations({ visits: [visitAt("2026-08-01T10:00:00.000Z")] }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(outcome.status).toBe("computed");
    expect(summary?.behavior.visitsPerMonth).toBeNull();
    expect(summary?.behavior.confidence).toBe(0);
    expect(summary?.travel.homeNeighborhoodId).toBeNull();
  });

  it("never invents a party size, a channel, a companion or a dietary fact", () => {
    const outcome = computeCustomerSummary(
      observations({
        visits: ["2026-07-01", "2026-07-10", "2026-07-20"].map((day) =>
          visitAt(`${day}T10:00:00.000Z`)
        )
      }),
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.behavior.typicalPartySize).toBeNull();
    expect(summary?.behavior.typicalBookingChannel).toBeNull();
    expect(summary?.relationships).toEqual({
      frequentCompanionIds: [],
      celebratesRecurringEvents: null,
      organizesForGroups: null,
      confidence: 0
    });
    // A guess about halal or an allergy is not a guess this platform makes.
    expect(summary?.cuisine.dietary).toEqual([]);
    expect(summary?.cuisine.avoids).toEqual([]);
  });

  it("derives category preference from where somebody actually went", () => {
    const outcome = computeCustomerSummary(
      observations({
        visits: [
          visitAt("2026-07-01T10:00:00.000Z", "biz_1"),
          visitAt("2026-07-10T10:00:00.000Z", "biz_1"),
          visitAt("2026-07-20T10:00:00.000Z", "biz_2")
        ],
        businesses: [business("biz_1"), business("biz_2", { categorySlug: "barber" })]
      }),
      NOW
    );

    const preferences = valueOrNull(outcome)?.preferences ?? [];
    const category = preferences.find((entry) => entry.dimension === "category");

    expect(category?.fact.value).toBe("coffee");
    // The visits are rows; reading a preference out of them is inference.
    expect(category?.fact.source).toBe("platform_inference");
    expect(category?.fact.confidence).toBeGreaterThan(0);
  });

  it("names a home neighborhood only when one dominates", () => {
    const split = computeCustomerSummary(
      observations({
        visits: [
          visitAt("2026-07-01T10:00:00.000Z", "biz_1"),
          visitAt("2026-07-10T10:00:00.000Z", "biz_2"),
          visitAt("2026-07-20T10:00:00.000Z", "biz_3")
        ],
        businesses: [
          business("biz_1"),
          business("biz_2", { district: "Chilonzor" }),
          business("biz_3", { district: "Mirzo Ulug'bek" })
        ]
      }),
      NOW
    );

    expect(valueOrNull(split)?.travel.homeNeighborhoodId).toBeNull();

    const dominant = computeCustomerSummary(
      observations({
        visits: ["2026-07-01", "2026-07-10", "2026-07-20"].map((day) =>
          visitAt(`${day}T10:00:00.000Z`, "biz_1")
        )
      }),
      NOW
    );

    expect(valueOrNull(dominant)?.travel.homeNeighborhoodId).toBe(
      "neighborhood:Tashkent:Yunusobod"
    );
  });

  it("reads lead time from real bookings and leaves the rest of planning unknown", () => {
    const outcome = computeCustomerSummary(
      observations({
        bookings: [
          bookingAt("2026-07-10T10:00:00.000Z", "2026-07-08T10:00:00.000Z"),
          bookingAt("2026-07-20T10:00:00.000Z", "2026-07-18T10:00:00.000Z"),
          bookingAt("2026-07-30T10:00:00.000Z", "2026-07-28T10:00:00.000Z")
        ]
      }),
      NOW
    );

    const planning = valueOrNull(outcome)?.planning;
    expect(planning?.typicalLeadDays).toBe(2);
    expect(planning?.plansMultiServiceExperiences).toBeNull();
    expect(planning?.acceptsAiRecommendations).toBeNull();
  });
});

describe("budget", () => {
  it("has no lower bound — spending less is never evidence of a floor", () => {
    const budget = budgetFromSpend(300_000);

    expect(budget?.min).toBeNull();
    expect(budget?.max).toEqual({ amountMinor: 30_000_000, currency: "UZS" });
  });

  it("is null when nothing was spent, rather than zero", () => {
    expect(budgetFromSpend(null)).toBeNull();
    expect(
      averageSpendPerVisit(observations({ customers: [crmRow({ visitCount: 0 })] }))
    ).toBeNull();
  });

  it("averages across every CRM row that is the same person", () => {
    const spend = averageSpendPerVisit(
      observations({
        customers: [
          crmRow({ id: "cus_1", visitCount: 2, totalSpend: decimal("400000") }),
          crmRow({ id: "cus_2", businessId: "biz_2", visitCount: 2, totalSpend: decimal("800000") })
        ]
      })
    );

    expect(spend).toBe(300_000);
  });
});

describe("activity radius", () => {
  it("is null below three located businesses — two points are a line", () => {
    expect(
      activityRadiusKm(
        observations({
          visits: [visitAt("2026-07-01T10:00:00.000Z", "biz_1"), visitAt("2026-07-02T10:00:00.000Z", "biz_2")],
          businesses: [business("biz_1"), business("biz_2")]
        })
      )
    ).toBeNull();
  });

  it("is half the widest distance between the places somebody chose", () => {
    const radius = activityRadiusKm(
      observations({
        visits: [
          visitAt("2026-07-01T10:00:00.000Z", "biz_1"),
          visitAt("2026-07-02T10:00:00.000Z", "biz_2"),
          visitAt("2026-07-03T10:00:00.000Z", "biz_3")
        ],
        businesses: [
          business("biz_1", { lat: decimal("41.30"), lng: decimal("69.24") }),
          business("biz_2", { lat: decimal("41.35"), lng: decimal("69.24") }),
          business("biz_3", { lat: decimal("41.40"), lng: decimal("69.24") })
        ]
      })
    );

    expect(radius).toBeGreaterThan(5);
    expect(radius).toBeLessThan(6);
  });

  it("ignores businesses with no coordinates rather than placing them at zero", () => {
    expect(
      activityRadiusKm(
        observations({
          visits: ["biz_1", "biz_2", "biz_3"].map((id, index) =>
            visitAt(`2026-07-0${index + 1}T10:00:00.000Z`, id)
          ),
          businesses: [
            business("biz_1"),
            business("biz_2", { lat: null, lng: null }),
            business("biz_3", { lat: null, lng: null })
          ]
        })
      )
    ).toBeNull();
  });
});

describe("birthday probability", () => {
  it("is null with no birthday on file — that is not the same as 'not soon'", () => {
    expect(computeBirthdayProbability(observations(), NOW)).toBeNull();
  });

  it("is zero beyond the horizon and rises as the date approaches", () => {
    const far = computeBirthdayProbability(
      observations({ customers: [crmRow({ birthday: new Date("1994-01-15T00:00:00.000Z") })] }),
      NOW
    );

    const near = computeBirthdayProbability(
      observations({ customers: [crmRow({ birthday: new Date("1994-08-20T00:00:00.000Z") })] }),
      NOW
    );

    expect(far).toBe(0);
    expect(near).toBeCloseTo(0.71, 1);
  });

  it("counts days to the next anniversary, wrapping the year", () => {
    expect(daysUntilAnniversary(new Date("1990-08-20T00:00:00.000Z"), new Date("2026-08-07T09:00:00.000Z"))).toBe(13);
    expect(daysUntilAnniversary(new Date("1990-01-05T00:00:00.000Z"), new Date("2026-12-31T00:00:00.000Z"))).toBe(5);
  });
});

describe("facts and the memory snapshot", () => {
  it("leaves typical party size null in the fact summary too", () => {
    const facts = computeCustomerFacts(
      observations({
        visits: ["2026-07-01", "2026-07-10", "2026-07-20"].map((day) =>
          visitAt(`${day}T10:00:00.000Z`)
        )
      }),
      NOW
    );

    expect(facts.typicalPartySize).toBeNull();
    expect(facts.visitsPerMonth?.value).toBe(1);
    expect(facts.mostVisitedNeighborhoodId?.value).toBe("neighborhood:Tashkent:Yunusobod");
  });

  it("names a favourite only after a second visit, and no experience types at all", () => {
    const input = observations({
      visits: [
        visitAt("2026-07-01T10:00:00.000Z", "biz_1"),
        visitAt("2026-07-10T10:00:00.000Z", "biz_1"),
        visitAt("2026-07-20T10:00:00.000Z", "biz_2")
      ],
      businesses: [business("biz_1"), business("biz_2")]
    });

    const summary = valueOrNull(computeCustomerSummary(input, NOW));
    const snapshot = computeMemorySnapshot(summary!, input, NOW);

    expect(snapshot.favoriteBusinessIds).toEqual(["biz_1"]);
    // No Experience model exists; a visit is not an experience type.
    expect(snapshot.completedExperienceTypes).toEqual([]);
    expect(snapshot.source).toBe("platform_inference");
  });
});
