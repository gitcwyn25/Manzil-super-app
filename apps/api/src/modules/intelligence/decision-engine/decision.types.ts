/**
 * Layer 5 (Decision Engine) — centralized business policy, never scattered.
 *
 * Doc 23 v1.1 §11: all business policy lives in one policy engine sitting in
 * the candidate pipeline — Candidate Generator → POLICY ENGINE → Ranking —
 * removing what may not be recommended (closed, suspended, expired
 * subscription, out of radius, slot-unavailable, campaign-violating) and
 * constraining how the rest may be ranked (sponsored-boost caps, trust
 * de-emphasis, premium fairness, moderation, regulation, fraud).
 *
 * Policies are DATA-described contracts (rule id + scope + effect), never
 * hardcoded logic: a new market regulation is a new rule row, not a code
 * branch in six services. Imports `core` only, so both the explanation layer
 * (traces name applied rules) and the reasoning layer (pipeline position)
 * can depend on it without cycles.
 */
import type { EntityId, GeoPoint, IsoDateTime, TimeWindow } from "../core";

/** Stable identifier of one policy rule; what traces and audits cite. */
export type PolicyRuleId = string;

/**
 * The twelve policy scopes of the v1.1 amendment. Closed: a new scope is an
 * architecture decision (it changes what the platform may refuse or reshape),
 * not a data change — new *rules* within a scope are just data.
 */
export type PolicyScope =
  | "availability"
  | "admin_suspension"
  | "subscription_expiry"
  | "travel_radius"
  | "booking_slot_availability"
  | "campaign_rules"
  | "sponsored_boost_cap"
  | "trust_de_emphasis"
  | "premium_fairness"
  | "moderation"
  | "regulatory"
  | "fraud";

/**
 * What a rule does to a candidate. Discriminated so each effect carries
 * exactly its parameters — an uncapped boost or an unbounded penalty is
 * unrepresentable.
 */
export type PolicyEffect =
  | { readonly kind: "exclude" }
  | {
      /** Sponsored placement may lift, but never past the cap (premium ≠ unfair ranking). */
      readonly kind: "cap_boost";
      readonly maxScoreDelta: number;
    }
  | {
      /** Lower emphasis without hiding (e.g. declining trust), bounded. */
      readonly kind: "de_emphasize";
      readonly maxScorePenalty: number;
    }
  | {
      /** Keep the candidate but require a labeled disclosure in the result. */
      readonly kind: "require_disclosure";
    };

/** One policy rule as data: id, scope, effect — auditable, versionable, loadable per market. */
export interface PolicyRule {
  readonly ruleId: PolicyRuleId;
  readonly scope: PolicyScope;
  readonly effect: PolicyEffect;
  /** Human-auditable statement of the rule; documentation, never logic. */
  readonly description: string;
  readonly active: boolean;
  readonly updatedAt: IsoDateTime;
}

/**
 * The situation policies are evaluated against — ids and mission facts only,
 * no entities.
 */
export interface PolicyContext {
  readonly customerId: EntityId | null;
  readonly workspaceId: EntityId | null;
  /** The window the plan targets; drives availability/slot policies. */
  readonly targetWindow: TimeWindow | null;
  /** Mission anchor; drives travel-radius policies. */
  readonly anchorPoint: GeoPoint | null;
  readonly maxTravelKm: number | null;
  readonly evaluatedAt: IsoDateTime;
}

/**
 * The minimum a candidate must expose to be screened. Structural, so both
 * the reasoning layer's `Candidate` and the ranking layer's
 * `RankingCandidate` satisfy it without this module importing either —
 * which is what keeps the Decision Engine cycle-free at the bottom of
 * Layer 5.
 */
export interface PolicyScreenable {
  readonly entityId: EntityId;
  readonly serviceId: EntityId | null;
}

/** Why one candidate was removed — always attributable to a rule. */
export interface PolicyExclusion {
  readonly entityId: EntityId;
  readonly ruleId: PolicyRuleId;
  readonly scope: PolicyScope;
}

/** A bounded score adjustment ranking MUST honor (caps and de-emphasis). */
export interface PolicyAdjustment {
  readonly entityId: EntityId;
  readonly ruleId: PolicyRuleId;
  /** Signed bound: the ranking layer may not exceed it in the rule's direction. */
  readonly scoreDeltaLimit: number;
}

/** The screened pipeline stage output: what ranking is allowed to see and how. */
export interface PolicyScreenResult<TCandidate extends PolicyScreenable> {
  readonly admitted: readonly TCandidate[];
  readonly exclusions: readonly PolicyExclusion[];
  readonly adjustments: readonly PolicyAdjustment[];
  /** Every rule consulted — fed into `RecommendationTrace.policiesApplied`. */
  readonly appliedRuleIds: readonly PolicyRuleId[];
  readonly screenedAt: IsoDateTime;
}

/**
 * The Decision Engine. Generic over the candidate shape so its position is
 * typed at the call site (reasoning pins `PolicyEngine` between candidate
 * generation and ranking) while this module stays import-free of both.
 */
export interface PolicyEngine {
  screen<TCandidate extends PolicyScreenable>(
    candidates: readonly TCandidate[],
    context: PolicyContext
  ): Promise<PolicyScreenResult<TCandidate>>;
  /** Query API: the active rulebook, optionally by scope — for audits and owner insights. */
  activeRules(scope?: PolicyScope): Promise<readonly PolicyRule[]>;
}
