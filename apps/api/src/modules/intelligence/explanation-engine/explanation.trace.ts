/**
 * Layer 5 (Reasoning) — explainability as a record, not a string.
 *
 * Doc 23 v1.1 §12: every recommendation produces a traceable record — reason
 * codes WITH numeric score contributions ("cuisine match +22, distance +18,
 * budget +30"), what was consulted, which policies applied, how long it
 * took. One record serves four consumers: debugging, algorithm improvement,
 * user-facing "why", and owner insights ("you ranked low because…").
 *
 * The Layer 5 `Recommendation` type requires a `RecommendationTrace`, so an
 * untraceable recommendation is unrepresentable — the structural counterpart
 * of `Explanation`'s non-empty factors.
 */
import type { Confidence, EntityId, NonEmptyArray } from "../core";
import type { PolicyRuleId } from "../decision-engine";
import type { ReasonCode } from "./explanation.types";

/** One reason code with its numeric contribution to the final score. */
export interface ScoredReasonCode {
  readonly code: ReasonCode;
  /** Signed contribution in ranking-score points (e.g. +22, -5). */
  readonly scoreContribution: number;
}

/** The full audit record behind one recommendation. */
export interface RecommendationTrace {
  readonly recommendationId: EntityId;
  /** Every scored reason, largest contribution first; never empty. */
  readonly scoredReasons: NonEmptyArray<ScoredReasonCode>;
  readonly confidence: Confidence;
  /** How many knowledge-graph nodes were consulted for this decision. */
  readonly knowledgeNodesConsulted: number;
  /** How many memory objects were consulted (ids live in `AiDecisionContext`). */
  readonly memoryObjectsConsulted: number;
  /** Policy rules that shaped this result (exclusions, caps, disclosures). */
  readonly policiesApplied: readonly PolicyRuleId[];
  readonly executionTimeMs: number;
}
