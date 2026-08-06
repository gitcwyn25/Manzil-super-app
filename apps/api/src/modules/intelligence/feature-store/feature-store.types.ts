/**
 * Layer 2 (AI Feature Store) — the canonical repository of derived facts.
 *
 * Doc 23 (CTO addition): computed once, reused everywhere — search ranking,
 * recommendations, Gurman, dashboards, targeting, analytics all read the
 * SAME features instead of each recomputing its own. First-class alongside
 * the Knowledge Graph and the Memory Engine: this is the piece separating an
 * intelligent platform from a chatbot. Imports `core` only.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  IsoDateTime,
  KnowledgeSource,
  WeeklyWindow
} from "../core";

/**
 * One derived feature value. The amendment's mandatory quartet — value,
 * confidence, computedAt, source — so no consumer can mistake a stale or
 * weakly-evidenced feature for a fresh, solid one.
 */
export interface FeatureValue<TValue> {
  readonly value: TValue;
  readonly confidence: Confidence;
  readonly computedAt: IsoDateTime;
  readonly source: KnowledgeSource;
}

/** Observed noise character of a venue. */
export type NoiseLevel = "quiet" | "medium" | "loud";

/** Weekly rhythm of a customer or an area, as coarse structured buckets. */
export interface ActivityPattern {
  /** Most active day-parts, e.g. mornings vs evenings, in [0, 1] per bucket. */
  readonly morningShare: number;
  readonly daytimeShare: number;
  readonly eveningShare: number;
  readonly nightShare: number;
}

/** The business feature vector (doc 23 catalog, field-for-field). */
export interface BusinessFeatures {
  readonly businessId: EntityId;
  readonly popularity: FeatureValue<number> | null;
  /** Mirror of the trust engine's overall score, cached as a feature. */
  readonly trust: FeatureValue<number> | null;
  readonly familyScore: FeatureValue<Confidence> | null;
  readonly luxuryScore: FeatureValue<Confidence> | null;
  readonly averageVisitMinutes: FeatureValue<number> | null;
  readonly peakHours: FeatureValue<readonly WeeklyWindow[]> | null;
  readonly noise: FeatureValue<NoiseLevel> | null;
  /** How stable prices have been over the window, in [0, 1] (1 = fully stable). */
  readonly priceStability: FeatureValue<Confidence> | null;
  readonly computedAt: IsoDateTime;
}

/** The customer feature vector (doc 23 catalog, field-for-field). */
export interface CustomerFeatures {
  readonly customerId: EntityId;
  readonly budgetPreference: FeatureValue<BudgetRange> | null;
  readonly travelRadiusKm: FeatureValue<number> | null;
  /** Cuisines ranked by affinity, strongest first. */
  readonly cuisineRanking: FeatureValue<readonly string[]> | null;
  readonly activityPattern: FeatureValue<ActivityPattern> | null;
  /** Weekend-specific behavior: how weekend habits differ from weekday ones. */
  readonly weekendBehavior: FeatureValue<ActivityPattern> | null;
  /**
   * Probability the customer is planning a birthday soon (Marketplace Brain:
   * "who is likely planning a birthday next month"), in [0, 1].
   */
  readonly birthdayProbability: FeatureValue<Confidence> | null;
  readonly computedAt: IsoDateTime;
}

/** The neighborhood feature vector (doc 23 catalog, field-for-field). */
export interface NeighborhoodFeatures {
  readonly neighborhoodId: EntityId;
  readonly morningActivity: FeatureValue<Confidence> | null;
  readonly nightActivity: FeatureValue<Confidence> | null;
  readonly parkingAvailability: FeatureValue<Confidence> | null;
  readonly familyFriendliness: FeatureValue<Confidence> | null;
  readonly walkability: FeatureValue<Confidence> | null;
  readonly demandTrend: FeatureValue<"rising" | "stable" | "declining"> | null;
  readonly computedAt: IsoDateTime;
}

/**
 * Query API of the feature store. Writes happen exclusively through AI Jobs
 * (`core/jobs`) — there is deliberately no `set` here, so no service can
 * sneak a feature in without the pipeline's provenance discipline.
 */
export interface FeatureStoreProvider {
  businessFeatures(businessId: EntityId): Promise<BusinessFeatures | null>;
  customerFeatures(customerId: EntityId): Promise<CustomerFeatures | null>;
  neighborhoodFeatures(neighborhoodId: EntityId): Promise<NeighborhoodFeatures | null>;
}
