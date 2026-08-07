// Query API — the vocabulary of retrieval (structured in, structured out)
export * from "./hybrid-retrieval.types";
// Query API — the binding engine order, checked against the frozen constants
export * from "./retrieval-priority";
// Query API — the honesty rule: typed refusals, never fabricated results.
// Re-exported by name, not by `*`. Three helpers here are deliberate duplicates
// of lower layers' — `refuseSparse` (marketplace-intelligence), `fact`
// (marketplace-intelligence), `clamp01` (marketplace-intelligence.statistics) —
// because Layer 4.5 speaks about *retrieval* refusals and retrieval facts over
// the same primitives, and one name per concept (`core/domain-language.ts`) is
// the rule. Epic 06 made the identical call about `toIso` and
// `normalizeServiceName`: the lower layer's copies stay the ones the platform
// barrel exports, and these stay module-private.
export {
  failureOf,
  isRetrieved,
  itemsOf,
  refuseEngineFault,
  refuseForbidden,
  refuseMissingKnowledge,
  refuseTimeout,
  refuseUnavailableFeature,
  refused,
  retrieved,
  warningOf
} from "./retrieval-outcome";
// Query API — item identity, freshness, scoring, filters, ranking — all pure
export {
  booleanFact,
  buildItem,
  factValue,
  freshnessOf,
  numericFact,
  parseRetrievalItemId,
  payloadOf,
  RETRIEVAL_FACT_KEYS,
  RETRIEVAL_ID_SEPARATOR,
  RETRIEVAL_TTL,
  retrievalItemId,
  stringFact,
  stringListFact
} from "./retrieval-item";
export type { RetrievalItemInput } from "./retrieval-item";
export {
  buildScore,
  contributingSignals,
  distanceScoreOf,
  EMPTY_SCORE_INPUT,
  freshnessScoreOf,
  measuredComponentCount,
  mergeReasonCodes,
  mergeScores,
  overallScore,
  RETRIEVAL_SCORE_COMPONENTS,
  RETRIEVAL_SCORE_WEIGHTS,
  roundScore,
  scoreComponents
} from "./retrieval-scoring";
export type { RetrievalScoreComponent, RetrievalScoreInput } from "./retrieval-scoring";
export * from "./retrieval-filters";
export * from "./retrieval-ranking";
export * from "./retrieval-plan";
export * from "./context-package";
// Query API — the uniform engine contract all seven satisfy
export * from "./retrieval-engine.contract";
export * from "./retrieval-engine.base";
// Query API — the semantic seam: one interface, six possible stores, no impl
export * from "./semantic-provider.contract";
// Implementations (Epic 07) — bound by token via HYBRID_RETRIEVAL_PROVIDERS
export * from "./hybrid-retrieval.tokens";
export * from "./hybrid-retrieval.clock";
export * from "./retrieval-cache.service";
// The seven engines, in the binding retrieval order
export * from "./workspace.engine";
export * from "./memory.engine";
export * from "./feature-store.engine";
export * from "./knowledge-graph.engine";
export * from "./business.engine";
export * from "./marketplace.engine";
export * from "./semantic.engine";
// The pipeline, the context assembler, and the one provider Layer 5 injects
export * from "./retrieval-pipeline.service";
export * from "./context-assembly.service";
export * from "./hybrid-retrieval.service";
// Command API — the only way this layer's state changes (doc 23 §5)
export * from "./hybrid-retrieval.jobs";
export * from "./hybrid-retrieval.providers";
