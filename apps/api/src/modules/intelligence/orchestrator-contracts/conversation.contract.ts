/**
 * Layer 6 (Conversation) — the contract that keeps the LLM out of decisions.
 *
 * Doc 22: "the LLM explains decisions in natural language. It doesn't
 * think." Doc 23 §10 hardens the boundary: any future provider receives
 * ONLY `{context, reasoning, candidateResults, explanationData}` — never
 * raw entities, repositories, or ORM models. The envelope below is exactly
 * those four fields, and its entire type graph is built from ids and
 * Layer 5 decision artifacts: no `GraphEntity`, no provider interface, no
 * Prisma type is reachable from it, so leaking one is a compile error, not
 * a review comment.
 *
 * No SDK, no prompt shapes, no streaming — provider integration is a later
 * epic and, per doc 22, must always be a config change, never a rewrite.
 */
import type { AiDecisionContext, EntityId, IntelligenceLocale } from "../core";
import type { Explanation } from "../explanation-engine";
import type {
  AvailabilityPlan,
  ClarificationNeed,
  ExperiencePackage,
  Intent,
  PlanConflict,
  RecommendationResult,
  ReplacementPlan
} from "../reasoning-engine";

/** Who/where/what-was-consulted — ids and locale only. */
export interface ConversationContext {
  readonly session: AiDecisionContext;
  readonly locale: IntelligenceLocale;
}

/** What Layer 5 concluded: the intent, the questions worth asking, the plan verdicts. */
export interface ReasoningOutcome {
  readonly intent: Intent;
  /** Already minimized by Layer 5 (AI Bible: as few questions as possible). */
  readonly clarifications: readonly ClarificationNeed[];
  readonly conflicts: readonly PlanConflict[];
  readonly availability: AvailabilityPlan | null;
}

/** What to present. Absent sections are `null` — the renderer may not invent them. */
export interface CandidateResults {
  readonly recommendations: RecommendationResult | null;
  readonly replacement: ReplacementPlan | null;
  readonly packages: readonly ExperiencePackage[] | null;
}

/** Why, keyed by recommendation id — the renderer's only source of justification. */
export interface ExplanationData {
  readonly byRecommendationId: ReadonlyMap<EntityId, Explanation>;
}

/**
 * Everything the conversation layer will ever receive, sealed. Exactly the
 * four fields of doc 23 §10 — adding a fifth is an ADR-level decision.
 */
export interface DecisionEnvelope {
  readonly context: ConversationContext;
  readonly reasoning: ReasoningOutcome;
  readonly candidateResults: CandidateResults;
  readonly explanationData: ExplanationData;
}

/**
 * The rendered turn. `text` is the only generative field, and
 * `narratedRecommendationIds` must reference ids present in the envelope —
 * grounding stays verifiable exactly as the Gurman seed verifies suggestion
 * ids today (`gurman.grounding.ts`).
 */
export interface RenderedNarration {
  readonly text: string;
  readonly narratedRecommendationIds: readonly EntityId[];
  readonly locale: IntelligenceLocale;
}

/**
 * The whole surface of the future LLM integration. One method, in one
 * direction: decisions in, narration out.
 */
export interface ConversationRenderer {
  render(envelope: DecisionEnvelope): Promise<RenderedNarration>;
}
