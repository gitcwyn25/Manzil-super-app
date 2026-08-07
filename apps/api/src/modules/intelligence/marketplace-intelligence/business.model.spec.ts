import {
  computeAlternatives,
  computeAspectSignals,
  computeBusinessFacts,
  computeBusinessHealth,
  computePeakHours,
  computePopularServices,
  computePopularity,
  computeRecommendedServices,
  computeSuitableExperiences,
  computeTypicalCustomers,
  constraintSet,
  coversBucket,
  isListingStale,
  segmentsOf,
  type BusinessObservations,
  type PeerObservation
} from "./business.model";
import { MODEL_EVIDENCE_FLOOR, valueOrNull } from "./marketplace-intelligence.evidence";
import type {
  BookingIntelligenceRow,
  BusinessIntelligenceRow,
  BusinessEventRow,
  CustomerIntelligenceRow,
  PackageIntelligenceRow,
  ReviewIntelligenceRow,
  VisitIntelligenceRow
} from "./marketplace-intelligence.projection";

const NOW = "2026-08-07T09:00:00.000Z";

const decimal = (value: string) => ({ toString: () => value });

function business(over: Partial<BusinessIntelligenceRow> = {}): BusinessIntelligenceRow {
  return {
    id: "biz_1",
    categoryId: "cat_coffee",
    categorySlug: "coffee",
    city: "Tashkent",
    district: "Yunusobod",
    priceTier: "mid",
    status: "claimed",
    verificationStatus: "verified",
    avgRating: decimal("4.5"),
    reviewCount: 5,
    lat: decimal("41.30"),
    lng: decimal("69.24"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...over
  };
}

function review(over: Partial<ReviewIntelligenceRow> = {}): ReviewIntelligenceRow {
  return {
    id: "rev_1",
    businessId: "biz_1",
    userId: "usr_1",
    rating: 5,
    text: "Great",
    moderationStatus: "approved",
    bookingId: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    hasReply: false,
    ...over
  };
}

function booking(over: Partial<BookingIntelligenceRow> = {}): BookingIntelligenceRow {
  const startsAt = over.startsAt ?? new Date("2026-07-15T13:00:00.000Z");

  return {
    id: "bok_1",
    businessId: "biz_1",
    customerId: "cus_1",
    serviceName: "Haircut",
    startsAt,
    // An hour long unless the case says otherwise, so a fixture that moves the
    // start does not accidentally create a negative duration.
    endsAt: new Date(startsAt.getTime() + 3_600_000),
    status: "completed",
    createdAt: new Date(startsAt.getTime() - 86_400_000),
    ...over
  };
}

function pkg(over: Partial<PackageIntelligenceRow> = {}): PackageIntelligenceRow {
  return {
    id: "pkg_1",
    businessId: "biz_1",
    name: "Haircut",
    price: decimal("120000"),
    currency: "UZS",
    isActive: true,
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...over
  };
}

function customer(over: Partial<CustomerIntelligenceRow> = {}): CustomerIntelligenceRow {
  return {
    id: "cus_1",
    businessId: "biz_1",
    userId: null,
    tags: [],
    visitCount: 2,
    totalSpend: decimal("400000"),
    lastVisitAt: new Date("2026-07-20T00:00:00.000Z"),
    firstSeenAt: new Date("2026-02-01T00:00:00.000Z"),
    birthday: null,
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
    ...over
  };
}

function visit(over: Partial<VisitIntelligenceRow> = {}): VisitIntelligenceRow {
  return {
    businessId: "biz_1",
    customerId: "cus_1",
    occurredAt: new Date("2026-07-15T13:00:00.000Z"),
    ...over
  };
}

function observations(over: Partial<BusinessObservations> = {}): BusinessObservations {
  return {
    business: business(),
    reviews: [],
    bookings: [],
    visits: [],
    events: [],
    packages: [pkg()],
    customers: [],
    ...over
  };
}

/** Bookings straddling both halves of the trend comparison. */
const bothHalves: readonly BookingIntelligenceRow[] = [
  booking({ id: "b1", startsAt: new Date("2026-06-15T13:00:00.000Z") }),
  booking({ id: "b2", startsAt: new Date("2026-06-20T13:00:00.000Z") }),
  booking({ id: "b3", startsAt: new Date("2026-06-25T13:00:00.000Z") }),
  booking({ id: "b4", startsAt: new Date("2026-07-15T13:00:00.000Z") }),
  booking({ id: "b5", startsAt: new Date("2026-07-20T13:00:00.000Z") }),
  booking({ id: "b6", startsAt: new Date("2026-08-01T13:00:00.000Z") })
];

const fiveReviews: readonly ReviewIntelligenceRow[] = Array.from({ length: 5 }, (_, index) =>
  review({
    id: `rev_${index}`,
    userId: `usr_${index}`,
    rating: 5,
    hasReply: index < 3,
    createdAt: new Date("2026-08-01T00:00:00.000Z")
  })
);

describe("BusinessHealth", () => {
  it("computes from real reviews and bookings when both halves are populated", () => {
    const outcome = computeBusinessHealth(
      observations({ reviews: fiveReviews, bookings: bothHalves }),
      NOW
    );

    expect(outcome.status).toBe("computed");
    const health = valueOrNull(outcome);

    expect(health?.bookingTrend).toBe("stable");
    expect(health?.reviewFreshnessDays).toBe(6);
    expect(health?.responseRate).toBe(0.6);
    expect(health?.cancellationRate).toBe(0);
    expect(health?.overall).toBeGreaterThan(0);
    expect(health?.overall).toBeLessThanOrEqual(100);
    expect(health?.listingStale).toBe(false);
  });

  it("calls a trend declining only when the drop clears the dead band", () => {
    const declining = [
      ...bothHalves.slice(0, 4),
      booking({ id: "b7", startsAt: new Date("2026-06-28T13:00:00.000Z") }),
      booking({ id: "b8", startsAt: new Date("2026-06-29T13:00:00.000Z") })
    ];

    const outcome = computeBusinessHealth(
      observations({ reviews: fiveReviews, bookings: declining }),
      NOW
    );

    // Five bookings in the earlier month, one in the current one.
    expect(valueOrNull(outcome)?.bookingTrend).toBe("declining");
  });

  it("counts cancellations and no-shows alike", () => {
    const withCancellations = [
      ...bothHalves,
      booking({ id: "b9", status: "canceled", startsAt: new Date("2026-07-22T13:00:00.000Z") }),
      booking({ id: "b10", status: "no_show", startsAt: new Date("2026-07-23T13:00:00.000Z") })
    ];

    const outcome = computeBusinessHealth(
      observations({ reviews: fiveReviews, bookings: withCancellations }),
      NOW
    );

    expect(valueOrNull(outcome)?.cancellationRate).toBe(0.25);
  });

  // ---- the insufficient-data paths, which are the point of this epic --------

  it("refuses below the observation floor, reporting the real sample size", () => {
    const outcome = computeBusinessHealth(
      observations({ reviews: [review()], bookings: [booking()] }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");

    expect(outcome.failure.error).toEqual({
      kind: "marketplace_sparse",
      scopeKey: "business:biz_1",
      sampleSize: 2
    });
    expect(outcome.evidence.required).toBe(MODEL_EVIDENCE_FLOOR.business_health.minObservations);
  });

  it("refuses when reviews clear the floor but no booking has ever settled", () => {
    const reviews = Array.from({ length: 9 }, (_, index) =>
      review({ id: `r${index}`, userId: `u${index}` })
    );

    const outcome = computeBusinessHealth(observations({ reviews }), NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ scopeKey: "business:biz_1#bookings" });
  });

  it("refuses when a business has bookings but no published review", () => {
    const outcome = computeBusinessHealth(
      observations({
        reviews: [review({ moderationStatus: "pending" })],
        bookings: [...bothHalves, ...bothHalves].map((row, index) => ({ ...row, id: `x${index}` }))
      }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ scopeKey: "business:biz_1#reviews" });
  });

  it("refuses a trend when the earlier window is empty — a first month is not growth", () => {
    const currentOnly = Array.from({ length: 6 }, (_, index) =>
      booking({ id: `c${index}`, startsAt: new Date("2026-07-2" + (index % 9) + "T13:00:00.000Z") })
    );

    const outcome = computeBusinessHealth(
      observations({ reviews: fiveReviews, bookings: currentOnly }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({ scopeKey: "business:biz_1#booking_trend" });
    // Sparsity is the one cause that time fixes, so the scheduler keeps asking.
    expect(outcome.failure.retryable).toBe(true);
  });
});

describe("listing staleness", () => {
  it("is computable for a business with no reviews and no bookings at all", () => {
    const abandoned = observations({
      business: business({ updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
      packages: [pkg({ updatedAt: new Date("2026-01-02T00:00:00.000Z") })]
    });

    expect(isListingStale(abandoned, NOW)).toBe(true);
  });

  it("counts a package edit as the owner touching the listing", () => {
    const touched = observations({
      business: business({ updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
      packages: [pkg({ updatedAt: new Date("2026-08-01T00:00:00.000Z") })]
    });

    expect(isListingStale(touched, NOW)).toBe(false);
  });
});

describe("Popularity", () => {
  const peer = (id: string, engagement: number): PeerObservation => ({
    business: business({ id }),
    packages: [pkg({ id: `pkg_${id}`, businessId: id })],
    engagement,
    serviceDemand: new Map()
  });

  const busy = observations({
    bookings: bothHalves,
    visits: Array.from({ length: 20 }, (_, index) =>
      visit({ occurredAt: new Date(`2026-07-${String((index % 28) + 1).padStart(2, "0")}T10:00:00.000Z`) })
    )
  });

  it("refuses without a comparison set — a rank needs a field", () => {
    const outcome = computePopularity(busy, { peers: [peer("biz_2", 5)] }, NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.evidence.requiredPeers).toBe(MODEL_EVIDENCE_FLOOR.popularity.minPeers);
  });

  it("ranks against peers when there are enough of them", () => {
    const peers = [1, 2, 3, 4, 5].map((index) => peer(`biz_${index + 1}`, index));
    const outcome = computePopularity(busy, { peers }, NOW);

    expect(outcome.status).toBe("computed");
    expect(valueOrNull(outcome)).toBe(1);
  });
});

describe("PeakHours", () => {
  const fridayEvenings = Array.from({ length: 24 }, (_, index) =>
    visit({
      occurredAt: new Date(
        `2026-07-${String(3 + (index % 4) * 7).padStart(2, "0")}T13:00:00.000Z`
      )
    })
  );

  it("refuses below the observation floor", () => {
    const outcome = computePeakHours(observations({ visits: [visit()] }), NOW);

    expect(outcome.status).toBe("insufficient_data");
  });

  it("reads peaks in marketplace-local time", () => {
    const outcome = computePeakHours(observations({ visits: fridayEvenings }), NOW);

    expect(outcome.status).toBe("computed");
    const profile = valueOrNull(outcome);

    expect(profile?.windows[0]).toEqual({
      day: "friday",
      startLocalTime: "18:00",
      endLocalTime: "19:00"
    });
    expect(profile?.peakIntensity).toBe(1);
  });

  it("ignores cancelled bookings — nobody was there", () => {
    const outcome = computePeakHours(
      observations({
        bookings: Array.from({ length: 30 }, (_, index) =>
          booking({ id: `x${index}`, status: "canceled" })
        )
      }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });
});

describe("TypicalCustomers", () => {
  it("reports knowledge_missing, not sparsity, when tags cannot answer it", () => {
    const outcome = computeTypicalCustomers(
      observations({ customers: [customer({ tags: ["oila"] })] }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");

    expect(outcome.failure.error).toEqual({
      kind: "knowledge_missing",
      entityId: "biz_1",
      missingKey: "customer.segment_tags"
    });
    // More traffic will not create a party-size column.
    expect(outcome.failure.retryable).toBe(false);
  });

  it("derives segments from merchant CRM tags in all three languages", () => {
    const customers = [
      ...Array.from({ length: 6 }, (_, index) =>
        customer({ id: `f${index}`, tags: ["oila", "vip"] })
      ),
      ...Array.from({ length: 4 }, (_, index) => customer({ id: `s${index}`, tags: ["студент"] }))
    ];

    const outcome = computeTypicalCustomers(observations({ customers }), NOW);
    const profiles = valueOrNull(outcome);

    expect(outcome.status).toBe("computed");
    expect(profiles?.[0]).toEqual({ segment: "families", share: 0.6, typicalPartySize: null });
    expect(profiles?.[1]).toEqual({ segment: "students", share: 0.4, typicalPartySize: null });
  });

  it("never claims a party size — no column records one", () => {
    const customers = Array.from({ length: 10 }, (_, index) =>
      customer({ id: `c${index}`, tags: ["family"] })
    );

    const profiles = valueOrNull(computeTypicalCustomers(observations({ customers }), NOW));
    expect(profiles?.every((profile) => profile.typicalPartySize === null)).toBe(true);
  });

  it("matches tags case-insensitively across scripts", () => {
    expect(segmentsOf(["Oila", "BIZNES"])).toEqual(["families", "business_guests"]);
    expect(segmentsOf([])).toEqual([]);
  });
});

describe("strengths, weaknesses and suitability", () => {
  const parkingComplaints = Array.from({ length: 3 }, (_, index) =>
    review({ id: `p${index}`, userId: `pu${index}`, rating: 1, text: "Parkovka yo'q, umuman" })
  );

  const birthdayPraise = Array.from({ length: 4 }, (_, index) =>
    review({ id: `b${index}`, userId: `bu${index}`, rating: 5, text: "Ajoyib tug'ilgan kun bo'ldi" })
  );

  it("refuses when no aspect reaches its floor", () => {
    const outcome = computeAspectSignals(
      observations({ reviews: [review({ text: "Zo'r" }), review({ id: "r2", text: "Yaxshi" })] }),
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });

  it("reads a weakness from three reviewers who named the aspect", () => {
    const outcome = computeAspectSignals(
      observations({ reviews: [...parkingComplaints, ...birthdayPraise] }),
      NOW
    );

    const signals = valueOrNull(outcome);
    expect(signals?.weaknesses.map((entry) => entry.aspect)).toContain("parking");
    expect(signals?.weaknesses[0]?.score).toBeLessThan(0);
    expect(signals?.weaknesses[0]?.evidenceCount).toBe(3);
    expect(signals?.weaknesses[0]?.source).toBe("review");
  });

  it("turns evidenced strengths into experience fit, never into a capability claim", () => {
    const signals = valueOrNull(
      computeAspectSignals(observations({ reviews: [...birthdayPraise, ...parkingComplaints] }), NOW)
    );

    const suitable = computeSuitableExperiences(signals!);
    const birthday = suitable.find((entry) => entry.experienceType === "birthday");

    expect(birthday).toBeDefined();
    expect(birthday?.fit).toBeGreaterThan(0);
    expect(birthday?.supportingCapabilityKeys).toEqual(["aspect:event_hosting"]);
  });
});

describe("AlternativeBusinesses", () => {
  const peerWith = (id: string, over: Partial<BusinessIntelligenceRow>, names: string[]) => ({
    business: business({ id, ...over }),
    packages: names.map((name, index) => pkg({ id: `${id}_${index}`, businessId: id, name })),
    engagement: 0,
    serviceDemand: new Map<string, number>()
  });

  it("refuses when there is nobody to substitute for", () => {
    const outcome = computeAlternatives(observations(), { peers: [] }, NOW);
    expect(outcome.status).toBe("insufficient_data");
  });

  it("ranks by constraint overlap and names what is gained and lost", () => {
    const outcome = computeAlternatives(
      observations({ packages: [pkg({ name: "Haircut" }), pkg({ id: "p2", name: "Beard trim" })] }),
      {
        peers: [
          peerWith("biz_2", {}, ["Haircut", "Shave"]),
          peerWith("biz_3", { district: "Chilonzor", priceTier: "premium" }, ["Massage"])
        ]
      },
      NOW
    );

    const alternatives = valueOrNull(outcome);
    expect(alternatives?.[0]?.businessId).toBe("biz_2");
    expect(alternatives?.[0]?.gainedCapabilityKeys).toEqual(["service:shave"]);
    expect(alternatives?.[0]?.lostCapabilityKeys).toEqual(["service:beard trim"]);
    // Nothing here claims a verified capability; every key is namespaced.
    expect(
      alternatives?.every((entry) =>
        [...entry.gainedCapabilityKeys, ...entry.lostCapabilityKeys].every((key) =>
          key.startsWith("service:")
        )
      )
    ).toBe(true);
  });

  it("builds a constraint set from category, area, price and services", () => {
    const keys = constraintSet(business(), [pkg()]);

    expect([...keys].sort()).toEqual([
      "area:neighborhood:Tashkent:Yunusobod",
      "category:cat_coffee",
      "price:0.5",
      "service:haircut"
    ]);
  });
});

describe("RecommendedServices", () => {
  const offeringPeer = (id: string, demand: number) => ({
    business: business({ id }),
    packages: [pkg({ id: `${id}_p`, businessId: id, name: "Beard trim" })],
    engagement: 0,
    serviceDemand: new Map([["beard trim", demand]])
  });

  it("refuses without enough peers offering it and enough observed demand", () => {
    const outcome = computeRecommendedServices(
      observations(),
      { peers: [offeringPeer("biz_2", 20), offeringPeer("biz_3", 20)] },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });

  it("recommends a service three peers offer and customers demonstrably book", () => {
    const outcome = computeRecommendedServices(
      observations(),
      { peers: [offeringPeer("biz_2", 4), offeringPeer("biz_3", 4), offeringPeer("biz_4", 4)] },
      NOW
    );

    const recommended = valueOrNull(outcome);
    expect(recommended?.[0]?.serviceKey).toBe("beard trim");
    expect(recommended?.[0]?.offeringPeerCount).toBe(3);
    expect(recommended?.[0]?.observedDemand).toBe(12);
    expect(recommended?.[0]?.medianPrice).toEqual({ amountMinor: 12_000_000, currency: "UZS" });
  });

  it("never recommends a service the business already offers", () => {
    const outcome = computeRecommendedServices(
      observations({ packages: [pkg({ name: "Beard Trim" })] }),
      { peers: [offeringPeer("biz_2", 9), offeringPeer("biz_3", 9), offeringPeer("biz_4", 9)] },
      NOW
    );

    expect(outcome.status).toBe("insufficient_data");
  });
});

describe("popular services", () => {
  it("ranks a catalog by share of its own bookings", () => {
    const bookings = [
      ...Array.from({ length: 4 }, (_, index) => booking({ id: `h${index}` })),
      ...Array.from({ length: 2 }, (_, index) =>
        booking({ id: `s${index}`, serviceName: "shave" })
      )
    ];

    const outcome = computePopularServices(
      observations({
        bookings,
        packages: [pkg({ id: "pkg_hair", name: "Haircut" }), pkg({ id: "pkg_shave", name: "Shave" })]
      }),
      NOW
    );

    const ranked = valueOrNull(outcome);
    expect(ranked?.[0]).toEqual({ serviceId: "pkg_hair", bookingShare: 0.67, rank: 1 });
    expect(ranked?.[1]).toEqual({ serviceId: "pkg_shave", bookingShare: 0.33, rank: 2 });
  });

  it("refuses below the floor rather than crowning the first booking taken", () => {
    expect(computePopularServices(observations({ bookings: [booking()] }), NOW).status).toBe(
      "insufficient_data"
    );
  });
});

describe("BusinessFactSummary", () => {
  it("leaves family share and weekend occupancy permanently null", () => {
    const facts = computeBusinessFacts(
      observations({ bookings: bothHalves, visits: [visit()], customers: [customer()] }),
      NOW
    );

    // No party size column, and no capacity column.
    expect(facts.familyShare).toBeNull();
    expect(facts.weekendOccupancy).toBeNull();
  });

  it("publishes an average visit length once enough bookings have an end time", () => {
    const facts = computeBusinessFacts(observations({ bookings: bothHalves }), NOW);

    expect(facts.averageVisitMinutes?.value).toBe(60);
    expect(facts.averageVisitMinutes?.sampleSize).toBe(6);
    expect(facts.averageVisitMinutes?.confidence).toBeGreaterThan(0);
  });

  it("withholds average spend until enough customers have spent anything", () => {
    const facts = computeBusinessFacts(observations({ customers: [customer()] }), NOW);
    expect(facts.averageSpend).toBeNull();

    const withSpend = computeBusinessFacts(
      observations({
        customers: Array.from({ length: 3 }, (_, index) => customer({ id: `c${index}` }))
      }),
      NOW
    );

    expect(withSpend.averageSpend?.value).toEqual({ amountMinor: 20_000_000, currency: "UZS" });
  });

  it("counts one page view per analytics event without inventing a visit", () => {
    const events: readonly BusinessEventRow[] = Array.from({ length: 3 }, () => ({
      businessId: "biz_1",
      type: "view",
      visitorKey: "anon",
      createdAt: new Date("2026-07-15T10:00:00.000Z")
    }));

    const facts = computeBusinessFacts(observations({ events }), NOW);
    // Page views are engagement, never visits: repeat-visitor share stays null.
    expect(facts.repeatVisitorShare).toBeNull();
  });
});

describe("peak window coverage", () => {
  it("matches on day and hour, not on day alone", () => {
    const window = { day: "friday", startLocalTime: "18:00", endLocalTime: "20:00" };

    expect(coversBucket(window, "friday", 18)).toBe(true);
    expect(coversBucket(window, "friday", 19)).toBe(true);
    expect(coversBucket(window, "friday", 20)).toBe(false);
    expect(coversBucket(window, "friday", 12)).toBe(false);
    expect(coversBucket(window, "saturday", 18)).toBe(false);
  });

  it("reads a window closing at midnight as ending at hour 24", () => {
    const window = { day: "saturday", startLocalTime: "23:00", endLocalTime: "00:00" };

    expect(coversBucket(window, "saturday", 23)).toBe(true);
    expect(coversBucket(window, "saturday", 0)).toBe(false);
  });
});
