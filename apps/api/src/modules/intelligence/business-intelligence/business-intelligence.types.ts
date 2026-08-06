/**
 * Layer 2 (Marketplace Intelligence) — the per-business AI profile.
 *
 * Doc 22: "every business gets a continuously-updated AI profile
 * (strengths/weaknesses/best-for) from its 500 reviews + 800 stories" —
 * *stored summaries, not regeneration*. Doc 16 shows the target shape:
 * "Italian. Great for birthdays. Fast service. Private room. Weak parking."
 *
 * Everything here is a structured, provenance-carrying summary that Gurman
 * reads instantly; nothing is generated at question time and nothing is
 * prose-first. Imports `core` only.
 */
import type {
  Confidence,
  EntityId,
  ExperienceType,
  IsoDateTime,
  KnowledgeSource,
  MoneyAmount,
  WeeklyWindow
} from "../core";

/**
 * The aspects a business can be strong or weak in. A closed union (not free
 * text) so strengths/weaknesses stay comparable across businesses and
 * renderable in any locale.
 */
export type BusinessAspect =
  | "food_quality"
  | "service_speed"
  | "staff_friendliness"
  | "atmosphere"
  | "cleanliness"
  | "value_for_money"
  | "parking"
  | "kids_friendliness"
  | "group_handling"
  | "event_hosting"
  | "wait_time"
  | "noise_level"
  | "accessibility"
  | "media_presence";

/** One evidenced strength or weakness of a business. */
export interface BusinessAspectAssessment {
  readonly aspect: BusinessAspect;
  /** Sentiment in [-1, 1]: negative = weakness, positive = strength. */
  readonly score: number;
  /** How many extracted signals (reviews, stories, complaints) support this. */
  readonly evidenceCount: number;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
}

/** Operational health of a business as the marketplace observes it. */
export interface BusinessHealth {
  readonly businessId: EntityId;
  /** Composite health in [0, 100]; component scores explain it. */
  readonly overall: number;
  readonly bookingTrend: "growing" | "stable" | "declining";
  readonly reviewFreshnessDays: number;
  readonly responseRate: Confidence;
  readonly cancellationRate: Confidence;
  /** True when the listing itself looks stale (Marketplace Brain: "which listings are stale"). */
  readonly listingStale: boolean;
  readonly computedAt: IsoDateTime;
}

/** A service ranked within one business's own catalog. */
export interface PopularService {
  readonly serviceId: EntityId;
  readonly bookingShare: Confidence;
  readonly rank: number;
}

/** Who actually visits this business — group shape, not identities. */
export interface TypicalCustomerProfile {
  readonly segment:
    | "families"
    | "couples"
    | "friend_groups"
    | "solo"
    | "business_guests"
    | "tourists"
    | "students";
  /** Share of observed visits from this segment, in [0, 1]. */
  readonly share: Confidence;
  readonly typicalPartySize: number | null;
}

/** When this business is busy, as observed — not as the owner claims. */
export interface PeakHoursProfile {
  readonly businessId: EntityId;
  readonly windows: readonly WeeklyWindow[];
  /** Occupancy pressure during peaks, in [0, 1]. */
  readonly peakIntensity: Confidence;
  readonly computedAt: IsoDateTime;
}

/** How well this business fits one experience type ("Birthday Ready" — doc 16 missions). */
export interface SuitableExperience {
  readonly experienceType: ExperienceType;
  readonly fit: Confidence;
  /** Capability keys that make it fit (e.g. `private_rooms`, `cake_allowed`). */
  readonly supportingCapabilityKeys: readonly string[];
}

/** A substitute provider, precomputed so replacement is a lookup, not a search. */
export interface AlternativeBusiness {
  readonly businessId: EntityId;
  /** How much of the original's satisfied constraint set this one covers, in [0, 1]. */
  readonly constraintOverlap: Confidence;
  /** Capability keys the alternative adds over the original. */
  readonly gainedCapabilityKeys: readonly string[];
  /** Capability keys the alternative loses versus the original. */
  readonly lostCapabilityKeys: readonly string[];
}

/**
 * The stored AI profile of one business — everything Gurman may say about a
 * provider comes from here or the graph, never from model imagination (AI
 * Bible trust rule: never fabricate business information).
 */
export interface BusinessSummary {
  readonly businessId: EntityId;
  readonly strengths: readonly BusinessAspectAssessment[];
  readonly weaknesses: readonly BusinessAspectAssessment[];
  readonly health: BusinessHealth;
  readonly popularServices: readonly PopularService[];
  readonly typicalCustomers: readonly TypicalCustomerProfile[];
  readonly peakHours: PeakHoursProfile;
  readonly suitableExperiences: readonly SuitableExperience[];
  readonly alternatives: readonly AlternativeBusiness[];
  readonly averageSpend: MoneyAmount | null;
  readonly updatedAt: IsoDateTime;
}

/**
 * Read-side contract for business profiles. The nightly pipeline writes them;
 * Layer 5 reads them through this interface only.
 */
export interface BusinessIntelligenceProvider {
  summary(businessId: EntityId): Promise<BusinessSummary | null>;
  summaries(businessIds: readonly EntityId[]): Promise<ReadonlyMap<EntityId, BusinessSummary>>;
  health(businessId: EntityId): Promise<BusinessHealth | null>;
  alternatives(businessId: EntityId): Promise<readonly AlternativeBusiness[]>;
}
