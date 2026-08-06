/**
 * Layer 2 (Marketplace Intelligence) — the per-customer summary.
 *
 * Doc 22: "every customer a summary updated after each experience". These are
 * *derived, structured* profiles — never chat history, never sensitive
 * inference (AI Bible: memory holds only what users expect). Durable tastes
 * as live retrieval objects belong to Layer 4 (`memory-engine/`); this module
 * is the analytical summary the pipeline maintains and memory snapshots from.
 *
 * Imports `core` only.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  IsoDateTime,
  KnowledgeFact,
  KnowledgeSource
} from "../core";

/** One preference the platform has learned, as a provenance-carrying fact. */
export interface CustomerPreference {
  /** What the preference is about, e.g. `cuisine`, `seating`, `music`, `price_tier`. */
  readonly dimension: string;
  /** The preferred value, e.g. `japanese`, `outdoor`, `quiet`. */
  readonly fact: KnowledgeFact<string>;
}

/** How the customer behaves on the platform — rhythm, not identity. */
export interface BehaviorPattern {
  readonly visitsPerMonth: number | null;
  readonly typicalPartySize: number | null;
  readonly prefersWeekends: boolean | null;
  readonly typicalBookingChannel: "app" | "web" | "ai_assistant" | null;
  readonly confidence: Confidence;
}

/** What the customer typically spends, per experience type where known. */
export interface BudgetPattern {
  readonly overall: BudgetRange | null;
  readonly byExperienceType: ReadonlyMap<ExperienceType, BudgetRange>;
  readonly confidence: Confidence;
}

/** How far the customer is willing to go, and from where. */
export interface TravelPattern {
  readonly homeNeighborhoodId: EntityId | null;
  readonly typicalRadiusKm: number | null;
  readonly usesTaxi: boolean | null;
  readonly frequentNeighborhoodIds: readonly EntityId[];
  readonly confidence: Confidence;
}

/** Cuisine affinities as ranked structured facts. */
export interface CuisinePattern {
  /** Ordered by affinity, strongest first. */
  readonly favorites: readonly KnowledgeFact<string>[];
  readonly avoids: readonly KnowledgeFact<string>[];
  readonly dietary: readonly KnowledgeFact<"halal" | "vegetarian" | "vegan" | "gluten_free">[];
}

/** Who the customer shares experiences with (doc 21 memory graph: "with Sarah"). */
export interface RelationshipPattern {
  /** Companion customer/contact entity ids the platform may reference. */
  readonly frequentCompanionIds: readonly EntityId[];
  readonly celebratesRecurringEvents: boolean | null;
  readonly organizesForGroups: boolean | null;
  readonly confidence: Confidence;
}

/** How the customer plans: lead time, thoroughness, AI reliance. */
export interface PlanningPattern {
  readonly typicalLeadDays: number | null;
  readonly plansMultiServiceExperiences: boolean | null;
  readonly acceptsAiRecommendations: Confidence | null;
  readonly reusesPastPlans: boolean | null;
  readonly confidence: Confidence;
}

/**
 * The stored analytical profile of one customer. Regenerated after each
 * completed experience by the nightly pipeline (doc 22), read at plan time.
 */
export interface CustomerSummary {
  readonly customerId: EntityId;
  readonly preferences: readonly CustomerPreference[];
  readonly behavior: BehaviorPattern;
  readonly budget: BudgetPattern;
  readonly travel: TravelPattern;
  readonly cuisine: CuisinePattern;
  readonly relationships: RelationshipPattern;
  readonly planning: PlanningPattern;
  readonly completedExperienceCount: number;
  readonly updatedAt: IsoDateTime;
}

/**
 * A compact, point-in-time projection of what the platform knows about a
 * customer — the shape Layer 4 loads into working memory and Layer 5 reasons
 * over. Deliberately small: a snapshot is what a single request touches, not
 * the whole profile history.
 */
export interface MemorySnapshot {
  readonly customerId: EntityId;
  /** Strongest preferences, ordered by confidence. */
  readonly topPreferences: readonly CustomerPreference[];
  readonly budget: BudgetRange | null;
  readonly homeNeighborhoodId: EntityId | null;
  /** Business ids of provably favorite providers. */
  readonly favoriteBusinessIds: readonly EntityId[];
  /** Experience types this customer actually completes. */
  readonly completedExperienceTypes: readonly ExperienceType[];
  readonly snapshotAt: IsoDateTime;
  readonly source: KnowledgeSource;
}

/** Read-side contract for customer profiles; written by the pipeline only. */
export interface CustomerIntelligenceProvider {
  summary(customerId: EntityId): Promise<CustomerSummary | null>;
  snapshot(customerId: EntityId): Promise<MemorySnapshot | null>;
}
