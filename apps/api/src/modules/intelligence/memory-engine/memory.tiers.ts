/**
 * Layer 4 (Memory Engine) — the six memory tiers.
 *
 * Doc 22: memory is *structured knowledge, never chat* — `{preference:
 * cuisine=japanese, confidence: 0.91, source: conversation, updated: today}`.
 * AI Bible v1.2 mandates two tiers (Mission vs Preference) and forbids
 * confusing them; Epic 03 extends the same discipline to six tiers. No tier
 * carries transcript text: every payload is a typed knowledge shape, which is
 * what makes raw chat unrepresentable here.
 *
 * Layer 4 sits above the graph (Layer 3) and the fact layer (Layer 2), so it
 * may embed their types; it knows nothing of reasoning (Layer 5) or the LLM
 * (Layer 6).
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  IsoDate,
  IsoDateTime,
  KnowledgeFact,
  KnowledgeSource,
  MemoryTier
} from "../core";
import type {
  BusinessSummary
} from "../business-intelligence";
import type { CustomerPreference } from "../customer-intelligence";
import type {
  DemandSummary,
  TrendSummary
} from "../marketplace-intelligence";
import type { ExperienceTimelineEntry } from "../experience-graph";
import type { RetrievalPriorityRank } from "./memory.retrieval";

/**
 * The mandatory envelope of every memory object. The bookkeeping fields are
 * the Epic 03 contract: nothing may enter memory without provenance,
 * confidence, lifecycle timestamps, and its place in the retrieval order.
 * `memoryId` was added by the doc-23 amendment (§9 AI Context IDs) so
 * recommendations can name exactly which memories they consulted.
 */
export interface MemoryObject<TTier extends MemoryTier, TKnowledge extends object> {
  readonly memoryId: EntityId;
  readonly tier: TTier;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly created: IsoDateTime;
  readonly updated: IsoDateTime;
  /** `null` = does not expire on its own (long-term tiers). Volatile tiers must set this. */
  readonly expires: IsoDateTime | null;
  /** Index into `RETRIEVAL_PRIORITY`; lower = consulted first. */
  readonly retrievalPriority: RetrievalPriorityRank;
  /** The structured knowledge payload — never conversation text. */
  readonly knowledge: TKnowledge;
}

/**
 * Tier 1 payload — the current objective: "Birthday · tomorrow · 6 guests ·
 * budget 2.5M · near Yunusabad" (AI Bible v1.2). Volatile by contract:
 * `expires` must be set, and this tier is destroyed when the mission ends —
 * it must never leak into durable preference knowledge.
 */
export interface MissionKnowledge {
  readonly customerId: EntityId;
  readonly experienceType: ExperienceType | null;
  readonly targetDate: IsoDate | null;
  readonly guestCount: number | null;
  readonly budget: BudgetRange | null;
  readonly nearNeighborhoodId: EntityId | null;
  /** Capability keys the mission requires (`private_rooms`, `parking`, `halal`). */
  readonly requiredCapabilityKeys: readonly string[];
  /** The workspace this mission is being planned in, once one exists. */
  readonly workspaceId: EntityId | null;
}

export type MissionContext = MemoryObject<"mission_context", MissionKnowledge>;

/**
 * Tier 2 payload — durable tastes that survive across months (AI Bible v1.2):
 * cuisines, ambiance, price band, planning habits. Never treated as today's
 * objective.
 */
export interface PreferenceKnowledge {
  readonly customerId: EntityId;
  readonly preferences: readonly CustomerPreference[];
  readonly budget: BudgetRange | null;
  readonly dietary: readonly KnowledgeFact<string>[];
  readonly favoriteBusinessIds: readonly EntityId[];
}

export type PreferenceContext = MemoryObject<"preference_context", PreferenceKnowledge>;

/** A person the customer shares experiences with, and what recurs with them. */
export interface CompanionKnowledge {
  readonly companionId: EntityId;
  /** Recurring occasions tied to this companion ("birthday", anniversary date). */
  readonly recurringOccasions: readonly KnowledgeFact<{
    readonly experienceType: ExperienceType;
    readonly annualDate: IsoDate | null;
  }>[];
  readonly sharedVisitCount: number;
}

/**
 * Tier 3 payload — who experiences happen *with* (doc 21 memory graph:
 * "visited Restaurant A → with Sarah → birthday 2027"). Relationship memory
 * is what lets next year's plan start from context instead of zero.
 */
export interface RelationshipKnowledge {
  readonly customerId: EntityId;
  readonly companions: readonly CompanionKnowledge[];
}

export type RelationshipContext = MemoryObject<"relationship_context", RelationshipKnowledge>;

/**
 * Tier 4 payload — the Workspace Timeline, the highest-priority retrieval
 * source of all (AI Bible v1.2): if the plan already holds a date or budget,
 * Gurman never asks again.
 */
export interface WorkspaceTimelineKnowledge {
  readonly workspaceId: EntityId;
  readonly experienceId: EntityId | null;
  readonly entries: readonly ExperienceTimelineEntry[];
}

export type WorkspaceTimeline = MemoryObject<"workspace_timeline", WorkspaceTimelineKnowledge>;

/**
 * Tier 5 payload — what the platform knows about businesses relevant to the
 * current retrieval: stored Layer 2 profiles, loaded as memory rather than
 * regenerated (doc 22: stored summaries, not regeneration).
 */
export interface BusinessContextKnowledge {
  readonly summaries: readonly BusinessSummary[];
}

export type BusinessContext = MemoryObject<"business_context", BusinessContextKnowledge>;

/**
 * Tier 6 payload — city-and-market awareness: trends and demand pressure the
 * reasoning layer should weigh ("weekend crowded", "underserved area").
 */
export interface MarketplaceContextKnowledge {
  readonly trends: readonly TrendSummary[];
  readonly demand: readonly DemandSummary[];
  readonly cityEventIds: readonly EntityId[];
}

export type MarketplaceContext = MemoryObject<"marketplace_context", MarketplaceContextKnowledge>;

/** Any memory object of any tier. */
export type AnyMemoryObject =
  | MissionContext
  | PreferenceContext
  | RelationshipContext
  | WorkspaceTimeline
  | BusinessContext
  | MarketplaceContext;

/**
 * Everything the Memory Engine hands Layer 5 for one request. Tiers may be
 * absent (`null`) — a first-time visitor has no preference context — but the
 * bundle shape itself is total, so reasoning code always states what it
 * expected.
 */
export interface MemoryBundle {
  readonly mission: MissionContext | null;
  readonly preferences: PreferenceContext | null;
  readonly relationships: RelationshipContext | null;
  readonly workspaceTimeline: WorkspaceTimeline | null;
  readonly businessContext: BusinessContext | null;
  readonly marketplaceContext: MarketplaceContext | null;
}

/**
 * Read-side contract of the Memory Engine. Implementations (and their
 * storage) arrive in a later epic; Layer 5 is written against this today.
 */
export interface MemoryEngineProvider {
  /** Load every applicable tier for one customer/workspace pair. */
  recall(customerId: EntityId, workspaceId: EntityId | null): Promise<MemoryBundle>;
  /** Record structured knowledge into a tier; raw text is not part of the contract. */
  remember(memory: AnyMemoryObject): Promise<void>;
  /** Destroy a volatile mission when it completes (AI Bible v1.2: "destroyed when appropriate"). */
  forgetMission(customerId: EntityId, workspaceId: EntityId | null): Promise<void>;
}
