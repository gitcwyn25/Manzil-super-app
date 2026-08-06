/**
 * Layer 6 boundary — the injection tokens of the Intelligence Platform.
 *
 * One token per contract, following the `GURMAN_RETRIEVER` seed pattern:
 * consumers inject the interface by token, so any implementation — including
 * none at all today — can sit behind it without touching consumers. Tokens
 * are namespaced `INTELLIGENCE_*` to stay collision-free in the flat
 * AppModule provider list.
 *
 * This file is the *only* coupling point between layers at runtime: modules
 * share types at compile time, but object wiring happens exclusively through
 * these tokens.
 */

/** Layer 0 — `EventPublisher` (core/events); EventEmitter today, BullMQ later. */
export const INTELLIGENCE_EVENT_PUBLISHER = "INTELLIGENCE_EVENT_PUBLISHER";

/** Layer 0 — `EventSubscriber` (core/events). */
export const INTELLIGENCE_EVENT_SUBSCRIBER = "INTELLIGENCE_EVENT_SUBSCRIBER";

/** Layer 0 — `EventStoreContract` (core/event-store); replayable log. */
export const INTELLIGENCE_EVENT_STORE = "INTELLIGENCE_EVENT_STORE";

/** Layer 0 — `JobExecutor` (core/jobs); the only way intelligence work runs. */
export const INTELLIGENCE_JOB_EXECUTOR = "INTELLIGENCE_JOB_EXECUTOR";

/** Layer 0 — `MetricsSink` (core/metrics). */
export const INTELLIGENCE_METRICS_SINK = "INTELLIGENCE_METRICS_SINK";

/** Layer 2 — `FeatureStoreProvider` (feature-store); derived facts, computed once. */
export const INTELLIGENCE_FEATURE_STORE = "INTELLIGENCE_FEATURE_STORE";

/** Layer 3 — `KnowledgeGraphProvider` (knowledge-graph). */
export const INTELLIGENCE_KNOWLEDGE_GRAPH = "INTELLIGENCE_KNOWLEDGE_GRAPH";

/** Layer 2 — `MarketplaceIntelligenceProvider` (marketplace-intelligence). */
export const INTELLIGENCE_MARKETPLACE = "INTELLIGENCE_MARKETPLACE";

/** Layer 2 — `BusinessIntelligenceProvider` (business-intelligence). */
export const INTELLIGENCE_BUSINESS = "INTELLIGENCE_BUSINESS";

/** Layer 2 — `CustomerIntelligenceProvider` (customer-intelligence). */
export const INTELLIGENCE_CUSTOMER = "INTELLIGENCE_CUSTOMER";

/** Layer 2 — `TrustScoreProvider` (trust-engine). */
export const INTELLIGENCE_TRUST = "INTELLIGENCE_TRUST";

/** Layer 4 — `MemoryEngineProvider` (memory-engine). */
export const INTELLIGENCE_MEMORY = "INTELLIGENCE_MEMORY";

/** Layer 5 — `PolicyEngine` (decision-engine); all business policy, centralized. */
export const INTELLIGENCE_POLICY_ENGINE = "INTELLIGENCE_POLICY_ENGINE";

/** Layer 5 — `IntentAnalyzer` (reasoning-engine). */
export const INTELLIGENCE_INTENT_ANALYZER = "INTELLIGENCE_INTENT_ANALYZER";

/** Layer 5 — `ConstraintBuilder` (reasoning-engine). */
export const INTELLIGENCE_CONSTRAINT_BUILDER = "INTELLIGENCE_CONSTRAINT_BUILDER";

/** Layer 5 — `CandidateGenerator` (reasoning-engine). */
export const INTELLIGENCE_CANDIDATE_GENERATOR = "INTELLIGENCE_CANDIDATE_GENERATOR";

/** Layer 5 — `RankingEngine` (reasoning-engine; contract in ranking-engine). */
export const INTELLIGENCE_RANKING_ENGINE = "INTELLIGENCE_RANKING_ENGINE";

/** Layer 5 — `RecommendationEngine` (reasoning-engine). */
export const INTELLIGENCE_RECOMMENDATION_ENGINE = "INTELLIGENCE_RECOMMENDATION_ENGINE";

/** Layer 5 — `ExplanationBuilder` (reasoning-engine; vocabulary in explanation-engine). */
export const INTELLIGENCE_EXPLANATION_BUILDER = "INTELLIGENCE_EXPLANATION_BUILDER";

/** Layer 5 — `ReplacementEngine` (reasoning-engine). */
export const INTELLIGENCE_REPLACEMENT_ENGINE = "INTELLIGENCE_REPLACEMENT_ENGINE";

/** Layer 5 — `PackageBuilder` (reasoning-engine). */
export const INTELLIGENCE_PACKAGE_BUILDER = "INTELLIGENCE_PACKAGE_BUILDER";

/** Layer 5 — `AvailabilityPlanner` (reasoning-engine). */
export const INTELLIGENCE_AVAILABILITY_PLANNER = "INTELLIGENCE_AVAILABILITY_PLANNER";

/** Layer 5 — `ConflictDetector` (reasoning-engine). */
export const INTELLIGENCE_CONFLICT_DETECTOR = "INTELLIGENCE_CONFLICT_DETECTOR";

/** Layer 5 — `IntentRegistry` (reasoning-engine); intents are data, never enums. */
export const INTELLIGENCE_INTENT_REGISTRY = "INTELLIGENCE_INTENT_REGISTRY";

/** Boundary — future `ToolOrchestratorContract` (ADR-001 seed: `/v1/gurman/ask`). */
export const INTELLIGENCE_TOOL_ORCHESTRATOR = "INTELLIGENCE_TOOL_ORCHESTRATOR";

/** Boundary — `CapabilityRegistry`; every AI capability is data (patch A). */
export const INTELLIGENCE_CAPABILITY_REGISTRY = "INTELLIGENCE_CAPABILITY_REGISTRY";

/** Boundary — future `ContextWindowManager`; budget-aware context assembly (patch G). */
export const INTELLIGENCE_CONTEXT_WINDOW_MANAGER = "INTELLIGENCE_CONTEXT_WINDOW_MANAGER";

/** Layer 6 — future `ConversationRenderer`; the only token an LLM adapter may bind. */
export const INTELLIGENCE_CONVERSATION_RENDERER = "INTELLIGENCE_CONVERSATION_RENDERER";
