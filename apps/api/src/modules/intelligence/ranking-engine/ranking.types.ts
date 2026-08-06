/**
 * Layer 5 (Reasoning) — the ranking contract.
 *
 * Doc 22's pipeline ends "… → graph → ranking → constraint solver →
 * candidates": ranking is a specialized service the reasoning engine asks
 * (doc 16: "the AI never manually filters businesses"). This module fixes
 * the *inputs* (the eight mandated signals) and *outputs* (ordered
 * candidates + reason codes + confidence) so any future algorithm — weighted
 * sum, learned model — slots in behind the same shape. No scoring math lives
 * in Epic 03.
 */
import type {
  Confidence,
  EntityId,
  InferenceBudget,
  IsoDateTime,
  NonEmptyArray
} from "../core";
import type { BusinessHealth } from "../business-intelligence";
import type { TrustScore } from "../trust-engine";
import type { ReasonCode } from "../explanation-engine";

/**
 * The signals ranking is allowed to weigh, one bundle per candidate. Each is
 * nullable: a missing signal is an honest gap the algorithm must handle,
 * never a silent zero.
 */
export interface RankingSignals {
  /** Distance from the mission's anchor point, in km. */
  readonly distanceKm: number | null;
  /** Whether the candidate can serve the requested window, if known. */
  readonly available: boolean | null;
  /** How well the estimated cost fits the mission budget, in [0, 1]. */
  readonly budgetFit: Confidence | null;
  readonly trust: TrustScore | null;
  /** Match against Tier-2 preference knowledge, in [0, 1]. */
  readonly preferenceMatch: Confidence | null;
  /** Share of workspace/mission constraints satisfied, in [0, 1]. */
  readonly workspaceConstraintFit: Confidence | null;
  /** Graph-derived relationship strength (past visits, companion history, co-bookings), in [0, 1]. */
  readonly relationshipScore: Confidence | null;
  readonly businessHealth: BusinessHealth | null;
}

/** One candidate as handed *to* the ranking engine. */
export interface RankingCandidate {
  readonly entityId: EntityId;
  /** The service being considered at this provider, when the mission is service-scoped. */
  readonly serviceId: EntityId | null;
  readonly signals: RankingSignals;
}

/** A ranking request: candidates plus the mission they compete for. */
export interface RankingRequest {
  /** Mission/experience the ranking serves; lets audit trails tie rankings to plans. */
  readonly missionExperienceId: EntityId | null;
  readonly candidates: readonly RankingCandidate[];
  /** Cost envelope of this request (patch F). */
  readonly budget: InferenceBudget;
}

/**
 * One candidate as returned *by* the ranking engine. Reason codes are
 * non-empty by type: an unexplainable position in the list is
 * unrepresentable, which feeds the Confidence Indicator (doc 16).
 */
export interface RankedCandidate {
  readonly entityId: EntityId;
  readonly serviceId: EntityId | null;
  /** 1-based position in the result. */
  readonly rank: number;
  /** Normalized ranking score in [0, 1]; comparable only within one result. */
  readonly score: Confidence;
  readonly reasonCodes: NonEmptyArray<ReasonCode>;
  readonly confidence: Confidence;
}

/** The full ranking output, ordered best-first. */
export interface RankingResult {
  readonly missionExperienceId: EntityId | null;
  readonly candidates: readonly RankedCandidate[];
  /** Overall confidence in the ordering itself (sparse signals ⇒ low). */
  readonly confidence: Confidence;
  readonly rankedAt: IsoDateTime;
}
