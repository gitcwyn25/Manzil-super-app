/**
 * Layer 2 (Marketplace Intelligence) — continuously generated facts from OUR
 * data (doc 22: "avg visit 82min · families 61% · peak 08:00 · weekend
 * crowded"). None of it comes from an LLM.
 *
 * This module is the *marketplace-wide* fact vocabulary: aggregates about
 * businesses, customers, relationships, trends, demand, neighborhoods, and
 * services. Deep per-entity AI profiles live in `business-intelligence/` and
 * `customer-intelligence/`. Imports `core` only — Layer 2 references graph
 * entities by id, never by node type, which is what keeps it below Layer 3.
 */
import type {
  Confidence,
  EntityId,
  IsoDateTime,
  MoneyAmount,
  TimeWindow,
  WeeklyWindow
} from "../core";

/**
 * One generated marketplace fact: a typed value plus the statistical context
 * (sample size, observation window) that ranking and explanation need to
 * weigh it honestly. A fact computed from 3 visits must never be
 * indistinguishable from one computed from 3,000.
 */
export interface MarketplaceFact<TValue> {
  readonly value: TValue;
  readonly sampleSize: number;
  readonly window: TimeWindow;
  readonly confidence: Confidence;
  readonly generatedAt: IsoDateTime;
}

/** Aggregate behavioral facts about one business, regenerated nightly. */
export interface BusinessFactSummary {
  readonly businessId: EntityId;
  readonly averageVisitMinutes: MarketplaceFact<number> | null;
  /** Share of visits that are family groups, in [0, 1]. */
  readonly familyShare: MarketplaceFact<number> | null;
  readonly peakHours: MarketplaceFact<readonly WeeklyWindow[]> | null;
  /** Share of capacity typically used on weekends, in [0, 1]. */
  readonly weekendOccupancy: MarketplaceFact<number> | null;
  readonly averageSpend: MarketplaceFact<MoneyAmount> | null;
  readonly repeatVisitorShare: MarketplaceFact<number> | null;
  readonly generatedAt: IsoDateTime;
}

/** Aggregate behavioral facts about one customer (facts, not preferences — tastes live in Layer 4). */
export interface CustomerFactSummary {
  readonly customerId: EntityId;
  readonly visitsPerMonth: MarketplaceFact<number> | null;
  readonly averageSpend: MarketplaceFact<MoneyAmount> | null;
  readonly typicalPartySize: MarketplaceFact<number> | null;
  readonly mostVisitedNeighborhoodId: MarketplaceFact<EntityId> | null;
  readonly generatedAt: IsoDateTime;
}

/**
 * A discovered connection between two marketplace entities — the raw material
 * for the Marketplace Brain's questions: which businesses substitute for each
 * other, which services are booked together, who should collaborate (doc 21).
 */
export interface RelationshipFactSummary {
  readonly fromEntityId: EntityId;
  readonly toEntityId: EntityId;
  readonly pattern:
    | "substitution"
    | "co_booking"
    | "co_visit"
    | "sequential_visit"
    | "collaboration_opportunity";
  readonly strength: MarketplaceFact<number>;
}

/** Direction of a trend over its observation window. */
export type TrendDirection = "rising" | "stable" | "declining";

/** Momentum of one entity (business, service, category, neighborhood) over a window. */
export interface TrendSummary {
  readonly subjectEntityId: EntityId;
  readonly direction: TrendDirection;
  /** Relative change over the window, e.g. 0.35 = +35%. */
  readonly changeRate: MarketplaceFact<number>;
  readonly metric: "bookings" | "views" | "reviews" | "story_mentions" | "searches";
}

/**
 * Demand vs. supply for a service or category in an area and window — powers
 * "which neighborhoods are underserved" and "who is likely planning a
 * birthday next month" (Marketplace Brain).
 */
export interface DemandSummary {
  readonly serviceOrCategoryId: EntityId;
  readonly neighborhoodId: EntityId | null;
  readonly window: TimeWindow;
  /** Demand events observed (searches, intents, bookings attempted). */
  readonly demandVolume: MarketplaceFact<number>;
  /** Providers able to serve that demand. */
  readonly supplyCount: MarketplaceFact<number>;
  /** demand/supply pressure; > 1 means underserved. */
  readonly pressure: MarketplaceFact<number>;
}

/** Marketplace character of one neighborhood. */
export interface NeighborhoodSummary {
  readonly neighborhoodId: EntityId;
  readonly businessCount: MarketplaceFact<number>;
  /** Category/service ids with unmet demand here. */
  readonly underservedServiceIds: readonly EntityId[];
  readonly averagePriceLevel: MarketplaceFact<number> | null;
  readonly peakActivity: MarketplaceFact<readonly WeeklyWindow[]> | null;
  readonly generatedAt: IsoDateTime;
}

/** Marketplace-level facts about one service ("Haircut" across all 120 providers). */
export interface ServiceSummary {
  readonly serviceId: EntityId;
  readonly providerCount: MarketplaceFact<number>;
  readonly medianPrice: MarketplaceFact<MoneyAmount> | null;
  readonly medianBookingLeadHours: MarketplaceFact<number> | null;
  /** Service ids most often booked together with this one. */
  readonly frequentlyBookedWithServiceIds: readonly EntityId[];
  readonly generatedAt: IsoDateTime;
}

/**
 * Read-side contract for Layer 2 facts. Implementations arrive with the
 * nightly pipeline (doc 22) — this sprint ships the shape only, so Layer 5
 * can be written against it from day one.
 */
export interface MarketplaceIntelligenceProvider {
  businessFacts(businessId: EntityId): Promise<BusinessFactSummary | null>;
  customerFacts(customerId: EntityId): Promise<CustomerFactSummary | null>;
  demand(serviceOrCategoryId: EntityId, neighborhoodId: EntityId | null): Promise<DemandSummary | null>;
  neighborhood(neighborhoodId: EntityId): Promise<NeighborhoodSummary | null>;
  service(serviceId: EntityId): Promise<ServiceSummary | null>;
  trends(subjectEntityIds: readonly EntityId[]): Promise<readonly TrendSummary[]>;
  relationships(entityId: EntityId): Promise<readonly RelationshipFactSummary[]>;
}
