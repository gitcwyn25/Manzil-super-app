/**
 * Layer 5 (Reasoning) — the ten reasoning services, as interfaces only.
 *
 * These are the components of "the reasoning engine decides; the LLM never
 * does" (doc 22). Each is a separate interface (not methods on one god
 * object) so implementations can arrive independently, be replaced
 * independently, and be injected via the tokens in
 * `orchestrator-contracts/`. Every method returns a structured decision
 * object — there is deliberately no interface here whose return type is
 * text.
 */
import type { EntityId } from "../core";
import type { PolicyEngine } from "../decision-engine";
import type { MemoryBundle } from "../memory-engine";
import type { RankedCandidate, RankingRequest, RankingResult } from "../ranking-engine";
import type { Explanation } from "../explanation-engine";
import type {
  AvailabilityPlan,
  Candidate,
  ConstraintSet,
  ExperiencePackage,
  Intent,
  IntentAnalysisInput,
  PlanConflict,
  RecommendationResult,
  ReplacementPlan,
  ReplacementRequest
} from "./reasoning.types";

/**
 * Turns one utterance plus memory into a structured `Intent` — the only
 * place raw user text enters the reasoning layer, and the first step of
 * every conversation (AI Bible v1.1: Intent → Constraints → Plan → Action).
 * Knows no intents of its own: it classifies into whatever the
 * `IntentRegistry` declares (patch B).
 */
export interface IntentAnalyzer {
  analyze(input: IntentAnalysisInput): Promise<Intent>;
}

/**
 * Expands an intent into the full constraint picture, consulting memory in
 * the binding retrieval order — the Workspace already knows the date, so the
 * constraint comes from there, not from a question.
 */
export interface ConstraintBuilder {
  build(intent: Intent, memory: MemoryBundle): Promise<ConstraintSet>;
}

/**
 * Asks the graph for providers satisfying a constraint set (doc 16: Gurman
 * never searches listings — it asks specialized services). Returns
 * candidates with their constraint verdicts and ranking signals attached.
 * Its output goes to the Decision Engine, never straight to ranking.
 */
export interface CandidateGenerator {
  generate(constraints: ConstraintSet): Promise<readonly Candidate[]>;
}

/**
 * Orders policy-admitted candidates using the eight mandated signals;
 * contract in `ranking-engine/`. Receives only what the Decision Engine
 * admitted, and must honor its bounded score adjustments.
 */
export interface RankingEngine {
  rank(request: RankingRequest): Promise<RankingResult>;
}

/**
 * The candidate pipeline position, as a type (doc 23 v1.1 §11): candidates
 * flow CandidateGenerator → PolicyEngine (`screen<Candidate>`) →
 * RankingEngine, in exactly this order. A tuple, so the order is part of
 * the contract rather than a comment.
 */
export type CandidatePipeline = readonly [CandidateGenerator, PolicyEngine, RankingEngine];

/**
 * The composition root of a recommendation: intent → constraints →
 * candidates → ranking → explained, sponsor-labeled recommendations. Its
 * output is what Layer 6 renders — and all Layer 6 may do is render it.
 */
export interface RecommendationEngine {
  recommend(intent: Intent, memory: MemoryBundle): Promise<RecommendationResult>;
}

/**
 * Builds the `Explanation` for a ranked candidate from its reason codes and
 * constraint verdicts. Split from ranking so "why" can grow richer without
 * touching how candidates are ordered.
 */
export interface ExplanationBuilder {
  explain(candidate: RankedCandidate, constraints: ConstraintSet): Promise<Explanation>;
}

/**
 * Graph traversal under preserved constraints (doc 21): swap one element of
 * a plan, keep everything else, and return scored alternatives with an
 * explained diff.
 */
export interface ReplacementEngine {
  replace(request: ReplacementRequest): Promise<ReplacementPlan>;
}

/**
 * Composes multi-service experiences (venue + cake + taxi + photographer)
 * into single coordinated packages — the Booking Agent mode's "ONE unified
 * itinerary" (AI Bible), before any booking is attempted.
 */
export interface PackageBuilder {
  build(intent: Intent, constraints: ConstraintSet, memory: MemoryBundle): Promise<readonly ExperiencePackage[]>;
}

/**
 * Checks a package against real availability and produces a feasible
 * schedule (or the conflicts preventing one). Booking execution itself stays
 * behind the Tool Orchestrator (ADR-001) — this plans, it never books.
 */
export interface AvailabilityPlanner {
  plan(pkg: ExperiencePackage): Promise<AvailabilityPlan>;
}

/**
 * Watches an active plan for structured problems — overlaps, budget
 * breaches, a provider closing, weather risk on an outdoor booking. Powers
 * the event-aware behavior of the AI Bible's strategic amendment: react only
 * to events tied to an active plan.
 */
export interface ConflictDetector {
  detect(experienceId: EntityId): Promise<readonly PlanConflict[]>;
}
