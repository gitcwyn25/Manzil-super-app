/**
 * Layer 5 (Reasoning) — the structured objects reasoning trades in.
 *
 * Doc 22: "intent → workspace → budget → distance → availability → graph →
 * ranking → constraint solver → candidates. The reasoning engine decides; the
 * LLM never does." Every shape here is a decision artifact — no field ever
 * carries model-generated prose, which is how "returns structured objects,
 * never text" is enforced by the compiler rather than by review.
 */
import type {
  AiDecisionContext,
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  GeoPoint,
  IntelligenceLocale,
  IsoDate,
  IsoDateTime,
  MoneyAmount,
  NonEmptyArray,
  TimeWindow
} from "../core";
import type { Explanation, RecommendationTrace } from "../explanation-engine";
import type { RankingSignals } from "../ranking-engine";
import type { MemoryBundle } from "../memory-engine";

/** What the user is trying to accomplish — intent over category (AI Bible v1.1). */
export type IntentKind =
  | "discover"
  | "plan_experience"
  | "book"
  | "reschedule"
  | "cancel"
  | "replace"
  | "optimize_plan"
  | "concierge_question"
  | "compare";

/** A missing essential the AI may ask for — as few as possible (AI Bible clarification rules). */
export interface ClarificationNeed {
  readonly field: "budget" | "date" | "guest_count" | "location" | "experience_type" | "time";
  /** Why memory could not answer it (retrieve before asking — AI Bible v1.1). */
  readonly whyUnknown: "not_in_memory" | "conflicting_memory" | "expired" | "user_never_stated";
}

/**
 * The single utterance being analyzed, with the memory that must be
 * consulted first. The text is consumed at this boundary and never stored —
 * only the structured `Intent` survives (memory is never raw chat).
 */
export interface IntentAnalysisInput {
  readonly customerId: EntityId;
  readonly utterance: string;
  readonly locale: IntelligenceLocale;
  readonly memory: MemoryBundle;
}

/** The structured reading of what the user wants. */
export interface Intent {
  readonly kind: IntentKind;
  readonly experienceType: ExperienceType | null;
  readonly targetDate: IsoDate | null;
  readonly guestCount: number | null;
  readonly budget: BudgetRange | null;
  readonly anchorNeighborhoodId: EntityId | null;
  /** Entity the intent operates on (the booking to move, the venue to replace). */
  readonly subjectEntityId: EntityId | null;
  readonly clarificationsNeeded: readonly ClarificationNeed[];
  readonly confidence: Confidence;
}

/**
 * One constraint the plan must (hard) or should (soft) satisfy — the typed
 * form of "Italian · private room · Saturday · 20 guests · parking · ≤$200"
 * (doc 21). A discriminated union so each constraint kind carries exactly
 * its own data.
 */
export type Constraint =
  | {
      readonly kind: "capability";
      readonly capabilityKey: string;
      readonly expected: boolean | number | string;
      readonly hard: boolean;
    }
  | { readonly kind: "budget"; readonly range: BudgetRange; readonly hard: boolean }
  | {
      readonly kind: "distance";
      readonly maxKm: number;
      readonly from: GeoPoint | null;
      readonly fromNeighborhoodId: EntityId | null;
      readonly hard: boolean;
    }
  | { readonly kind: "schedule"; readonly window: TimeWindow; readonly hard: boolean }
  | { readonly kind: "party_size"; readonly size: number; readonly hard: boolean }
  | { readonly kind: "min_trust"; readonly minOverall: number; readonly hard: boolean };

/** The full constraint picture for one mission, with provenance per the memory contract. */
export interface ConstraintSet {
  readonly missionExperienceId: EntityId | null;
  readonly constraints: readonly Constraint[];
  readonly builtAt: IsoDateTime;
}

/** A candidate provider/service pair with its constraint verdicts and ranking signals. */
export interface Candidate {
  readonly businessId: EntityId;
  readonly serviceId: EntityId | null;
  readonly satisfiedConstraints: readonly Constraint[];
  readonly violatedConstraints: readonly Constraint[];
  readonly signals: RankingSignals;
}

/**
 * A decided recommendation. Four things are structurally mandatory, so their
 * absence cannot compile: `explanation` (AI Bible: always answer "why"),
 * `sponsored` (trust rule: always label ads), `context` (doc 23 §9: every
 * recommendation names the workspace, customer, businesses and memories it
 * consulted), and `trace` (doc 23 v1.1 §12: explainability is a record, not
 * a string).
 */
export interface Recommendation {
  readonly id: EntityId;
  readonly businessId: EntityId;
  readonly serviceId: EntityId | null;
  readonly rank: number;
  readonly confidence: Confidence;
  readonly explanation: Explanation;
  readonly sponsored: boolean;
  readonly context: AiDecisionContext;
  readonly trace: RecommendationTrace;
}

/** The recommendation result; may be honestly empty, but never unexplained. */
export interface RecommendationResult {
  readonly intent: Intent;
  readonly recommendations: readonly Recommendation[];
  readonly generatedAt: IsoDateTime;
}

/** Request to swap one plan element while keeping everything else (doc 21). */
export interface ReplacementRequest {
  readonly experienceId: EntityId;
  readonly replaceBusinessId: EntityId;
  /** Constraints the replacement must preserve; defaults to all satisfied ones. */
  readonly preserveConstraints: readonly Constraint[];
}

/** One replacement option with its constraint diff — "keeps every requirement and adds outdoor seating". */
export interface ReplacementOption {
  readonly businessId: EntityId;
  /** Fit against the preserved constraint set, in [0, 1] (doc 16's "97% fit"). */
  readonly constraintFit: Confidence;
  readonly preservedConstraints: readonly Constraint[];
  readonly gainedCapabilityKeys: readonly string[];
  readonly lostCapabilityKeys: readonly string[];
  readonly explanation: Explanation;
}

/** The replacement decision: scored alternatives, never "random restaurants". */
export interface ReplacementPlan {
  readonly request: ReplacementRequest;
  readonly options: readonly ReplacementOption[];
  readonly generatedAt: IsoDateTime;
}

/** One procured piece of a package (venue, cake, taxi, photographer). */
export interface PackageItem {
  readonly serviceId: EntityId;
  readonly businessId: EntityId;
  readonly window: TimeWindow | null;
  readonly estimatedCost: MoneyAmount | null;
  readonly explanation: Explanation;
}

/** A complete multi-service experience proposal — ONE itinerary, not separate bookings (AI Bible). */
export interface ExperiencePackage {
  readonly experienceType: ExperienceType;
  readonly items: NonEmptyArray<PackageItem>;
  readonly totalEstimate: MoneyAmount | null;
  readonly withinBudget: boolean | null;
  readonly confidence: Confidence;
}

/** One scheduled slot inside an availability plan. */
export interface ScheduledSlot {
  readonly businessId: EntityId;
  readonly serviceId: EntityId | null;
  readonly window: TimeWindow;
  readonly status: "proposed" | "on_hold" | "confirmed";
}

/** The feasibility verdict for a package against real availability. */
export interface AvailabilityPlan {
  readonly experienceId: EntityId | null;
  readonly feasible: boolean;
  readonly slots: readonly ScheduledSlot[];
  /** Conflicts that make (or nearly make) the plan infeasible. */
  readonly conflicts: readonly PlanConflict[];
  readonly plannedAt: IsoDateTime;
}

/**
 * A structured problem inside a plan — including the event-aware triggers
 * from the AI Bible strategic amendment (venue closed, weather risk), which
 * must always be tied to an active plan, never free-floating.
 */
export interface PlanConflict {
  readonly kind:
    | "time_overlap"
    | "budget_exceeded"
    | "distance_infeasible"
    | "availability_lost"
    | "constraint_violation"
    | "provider_closed"
    | "weather_risk";
  readonly severity: "blocking" | "warning";
  readonly affectedEntityIds: NonEmptyArray<EntityId>;
  readonly detectedAt: IsoDateTime;
}
