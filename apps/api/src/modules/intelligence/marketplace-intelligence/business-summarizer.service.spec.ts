import {
  assembleBusinessSummary,
  BusinessSummarizerService,
  type StoredBusinessProfile
} from "./business-summarizer.service";
import { BusinessIntelligenceService } from "./business-intelligence.service";
import { FeatureStoreService } from "./feature-store.service";
import { MarketplaceIntelligenceService } from "./marketplace-intelligence.service";
import { SummaryRepository } from "./summary.repository";
import { InProcessSummaryStore } from "./intelligence-summary.store";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import type { BusinessObservations, PeerObservation } from "./business.model";
import type {
  BookingIntelligenceRow,
  BusinessIntelligenceRow,
  CustomerIntelligenceRow,
  PackageIntelligenceRow,
  ReviewIntelligenceRow
} from "./marketplace-intelligence.projection";

const NOW = "2026-08-07T09:00:00.000Z";
const decimal = (value: string) => ({ toString: () => value });

function makeClock(now = NOW): MarketplaceClock & { set(at: string): void } {
  let current = now;
  let sequence = 0;

  return {
    now: () => current,
    newId: () => `evt_${(sequence += 1)}`,
    set: (at: string) => {
      current = at;
    }
  };
}

function business(id = "biz_1", over: Partial<BusinessIntelligenceRow> = {}): BusinessIntelligenceRow {
  return {
    id,
    categoryId: "cat_coffee",
    categorySlug: "coffee",
    city: "Tashkent",
    district: "Yunusobod",
    priceTier: "premium",
    status: "claimed",
    verificationStatus: "verified",
    avgRating: decimal("4.6"),
    reviewCount: 5,
    lat: decimal("41.30"),
    lng: decimal("69.24"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
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

function review(over: Partial<ReviewIntelligenceRow> = {}): ReviewIntelligenceRow {
  return {
    id: `rev_${Math.random()}`,
    businessId: "biz_1",
    userId: `usr_${Math.random()}`,
    rating: 5,
    text: "Ajoyib tug'ilgan kun, bolalar ham xursand",
    moderationStatus: "approved",
    bookingId: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    hasReply: true,
    ...over
  };
}

function booking(startsAt: string, over: Partial<BookingIntelligenceRow> = {}): BookingIntelligenceRow {
  const start = new Date(startsAt);

  return {
    id: `bok_${startsAt}`,
    businessId: "biz_1",
    customerId: "cus_1",
    serviceName: "Haircut",
    startsAt: start,
    endsAt: new Date(start.getTime() + 3_600_000),
    status: "completed",
    createdAt: new Date(start.getTime() - 86_400_000),
    ...over
  };
}

const richObservations: BusinessObservations = {
  business: business(),
  reviews: Array.from({ length: 5 }, () => review()),
  bookings: [
    booking("2026-06-15T13:00:00.000Z"),
    booking("2026-06-20T13:00:00.000Z"),
    booking("2026-06-25T13:00:00.000Z"),
    booking("2026-07-15T13:00:00.000Z"),
    booking("2026-07-20T13:00:00.000Z"),
    booking("2026-08-01T13:00:00.000Z")
  ],
  // Enough visits for a weekly rhythm to exist: `BusinessSummary` has a
  // non-nullable `peakHours`, so a complete profile needs the peak model to
  // clear its floor as well as health.
  visits: Array.from({ length: 24 }, (_, index) => ({
    businessId: "biz_1",
    customerId: `cus_${index}`,
    occurredAt: new Date("2026-07-03T13:00:00.000Z")
  })),
  events: [],
  packages: [pkg()],
  customers: []
};

/** Health clears its floor, but nobody was ever recorded arriving. */
const healthWithoutRhythm: BusinessObservations = { ...richObservations, visits: [] };

const thinObservations: BusinessObservations = {
  business: business("biz_thin"),
  reviews: [],
  bookings: [],
  visits: [],
  events: [],
  packages: [pkg({ businessId: "biz_thin" })],
  customers: [] as readonly CustomerIntelligenceRow[]
};

const peer: PeerObservation = {
  business: business("biz_2"),
  packages: [pkg({ id: "pkg_2", businessId: "biz_2", name: "Shave" })],
  engagement: 3,
  serviceDemand: new Map()
};

function makeSummarizer(observations: BusinessObservations | null, peers: PeerObservation[] = [peer]) {
  const clock = makeClock();
  const store = new InProcessSummaryStore();
  const repository = new SummaryRepository(store);

  const projection = {
    businessObservations: jest.fn().mockResolvedValue(observations),
    peerContext: jest.fn().mockResolvedValue({ peers })
  };

  const summarizer = new BusinessSummarizerService(projection as never, repository, clock);
  const business = new BusinessIntelligenceService(repository, clock);
  const features = new FeatureStoreService(repository, clock);
  const marketplace = new MarketplaceIntelligenceService(repository, clock);

  return { summarizer, repository, store, clock, projection, business, features, marketplace };
}

describe("the business summarizer", () => {
  it("stores the profile and the feature vector, not a recomputation", async () => {
    const { summarizer, store } = makeSummarizer(richObservations);

    const result = await summarizer.summarize("biz_1");

    expect(result.changed).toBe(true);
    expect(store.size).toBe(2);
    expect(result.writes.map((write) => write.slot.kind)).toEqual([
      "business",
      "business_features"
    ]);
  });

  it("serves the frozen BusinessSummary from what it stored", async () => {
    const { summarizer, business } = makeSummarizer(richObservations);
    await summarizer.summarize("biz_1");

    const summary = await business.summary("biz_1");

    expect(summary?.businessId).toBe("biz_1");
    expect(summary?.health?.overall).toBeGreaterThan(0);
    expect(summary?.strengths.map((entry) => entry.aspect)).toContain("event_hosting");
  });

  it("withholds the frozen summary when health is known but the rhythm is not", async () => {
    const { summarizer, business } = makeSummarizer(healthWithoutRhythm);
    await summarizer.summarize("biz_1");

    // `BusinessSummary.peakHours` is not nullable, so a complete profile needs
    // both models. The health block is still stored and still readable.
    expect(await business.summary("biz_1")).toBeNull();
    expect((await business.health("biz_1"))?.overall).toBeGreaterThan(0);
    expect((await business.gaps("biz_1")).map((gap) => gap.model)).toContain("peak_hours");
  });

  it("returns no frozen summary — and an explicit gap — when health refuses", async () => {
    const { summarizer, business } = makeSummarizer(thinObservations, []);

    const result = await summarizer.summarize("biz_thin");

    expect(await business.summary("biz_thin")).toBeNull();
    expect(await business.health("biz_thin")).toBeNull();

    const gaps = await business.gaps("biz_thin");
    const health = gaps.find((gap) => gap.model === "business_health");

    expect(health?.failure.error).toMatchObject({ kind: "marketplace_sparse" });
    expect(health?.observations).toBe(0);
    expect(health?.required).toBeGreaterThan(0);
    // The refusal is recorded, not silent: an absent field looks like a bug.
    expect(result.gaps.length).toBeGreaterThan(3);
  });

  it("still stores the facts it does know about a business it cannot rate", async () => {
    const { summarizer, marketplace } = makeSummarizer(thinObservations, []);
    await summarizer.summarize("biz_thin");

    const facts = await marketplace.businessFacts("biz_thin");

    expect(facts?.businessId).toBe("biz_thin");
    // Nullable field by field, so honest absence costs no real knowledge.
    expect(facts?.familyShare).toBeNull();
    expect(facts?.weekendOccupancy).toBeNull();
  });

  it("writes a feature vector whose unknowable fields are null, never zero", async () => {
    const { summarizer, features } = makeSummarizer(richObservations, []);
    await summarizer.summarize("biz_1");

    const vector = await features.businessFeatures("biz_1");

    // A trust score the Trust Engine has not shipped is not a zero score.
    expect(vector?.trust).toBeNull();
    // Price stability needs a price history; the schema keeps one price.
    expect(vector?.priceStability).toBeNull();
    // Popularity refuses without peers.
    expect(vector?.popularity).toBeNull();
    // But the merchant's own price tier is real, and restated with certainty.
    expect(vector?.luxuryScore).toEqual({
      value: 1,
      confidence: 1,
      computedAt: NOW,
      source: "merchant_input"
    });
  });

  it("reads a family score out of reviews that mention children", async () => {
    const { summarizer, features } = makeSummarizer(richObservations);
    await summarizer.summarize("biz_1");

    const vector = await features.businessFeatures("biz_1");

    expect(vector?.familyScore?.value).toBeGreaterThan(0.5);
    expect(vector?.familyScore?.source).toBe("review");
  });

  it("converges: a second pass over the same rows changes nothing", async () => {
    const { summarizer } = makeSummarizer(richObservations);

    await summarizer.summarize("biz_1");
    const second = await summarizer.summarize("biz_1");

    expect(second.changed).toBe(false);
    expect(second.writes.every((write) => write.outcome === "unchanged")).toBe(true);
  });

  it("does nothing at all for a business that does not exist", async () => {
    const { summarizer, store } = makeSummarizer(null);

    const result = await summarizer.summarize("ghost");

    expect(result.profile).toBeNull();
    expect(result.writes).toEqual([]);
    expect(store.size).toBe(0);
  });

  it("publishes substitution facts for the alternatives it found", async () => {
    const { summarizer, marketplace } = makeSummarizer(richObservations);
    await summarizer.summarize("biz_1");

    const relationships = await marketplace.relationships("biz_1");

    expect(relationships).toHaveLength(1);
    expect(relationships[0]).toMatchObject({
      fromEntityId: "biz_1",
      toEntityId: "biz_2",
      pattern: "substitution"
    });
  });
});

describe("refreshing health alone", () => {
  it("patches the stored profile without re-running the other models", async () => {
    const { summarizer, projection, business } = makeSummarizer(richObservations);
    await summarizer.summarize("biz_1");
    projection.peerContext.mockClear();

    const result = await summarizer.refreshHealth("biz_1");

    expect(projection.peerContext).not.toHaveBeenCalled();
    expect(result.writes.map((write) => write.slot.kind)).toEqual(["business"]);
    // Strengths survived: this job did not re-derive them and did not drop them.
    expect((await business.summary("biz_1"))?.strengths.length).toBeGreaterThan(0);
  });

  it("replaces only its own gap, leaving other models' gaps untouched", async () => {
    const { summarizer, business } = makeSummarizer(thinObservations, []);
    await summarizer.summarize("biz_thin");
    const before = await business.gaps("biz_thin");

    await summarizer.refreshHealth("biz_thin");
    const after = await business.gaps("biz_thin");

    expect(after.filter((gap) => gap.model === "business_health")).toHaveLength(1);
    expect(after.map((gap) => gap.model).sort()).toEqual(before.map((gap) => gap.model).sort());
  });

  it("falls back to a full summarization when nothing has been stored yet", async () => {
    const { summarizer, store } = makeSummarizer(richObservations);

    await summarizer.refreshHealth("biz_1");

    expect(store.size).toBe(2);
  });
});

describe("assembling the frozen contract", () => {
  const profile: StoredBusinessProfile = {
    businessId: "biz_1",
    strengths: [],
    weaknesses: [],
    health: null,
    popularServices: [],
    typicalCustomers: [],
    peakHours: null,
    suitableExperiences: [],
    alternatives: [],
    averageSpend: null,
    facts: {
      businessId: "biz_1",
      averageVisitMinutes: null,
      familyShare: null,
      peakHours: null,
      weekendOccupancy: null,
      averageSpend: null,
      repeatVisitorShare: null,
      generatedAt: NOW
    },
    recommendedServices: [],
    relationships: [],
    gaps: [],
    updatedAt: NOW
  };

  it("refuses to build a summary without health — the contract has no nullable one", () => {
    expect(assembleBusinessSummary(profile)).toBeNull();
  });

  it("refuses without peak hours for the same reason", () => {
    expect(
      assembleBusinessSummary({
        ...profile,
        health: {
          businessId: "biz_1",
          overall: 70,
          bookingTrend: "stable",
          reviewFreshnessDays: 3,
          responseRate: 0.5,
          cancellationRate: 0.1,
          listingStale: false,
          computedAt: NOW
        }
      })
    ).toBeNull();
  });
});
