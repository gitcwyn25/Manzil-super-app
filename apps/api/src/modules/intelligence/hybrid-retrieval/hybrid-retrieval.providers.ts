/**
 * Layer 4.5 (Hybrid Retrieval) — DI wiring, as a provider array.
 *
 * A `Provider[]` rather than a Nest module, following `KNOWLEDGE_GRAPH_PROVIDERS`,
 * `MEMORY_ENGINE_PROVIDERS` and `MARKETPLACE_INTELLIGENCE_PROVIDERS` before it,
 * for the same structural reason: this layer needs `CacheService`, which
 * AppModule provides directly and no module exports. A
 * `HybridRetrievalModule` would have to provide its own — a second instance
 * and a second Redis connection — or import a module that does not exist.
 *
 * `IntelligenceModule` stays provider-empty and safe to import, exactly as
 * `ARCHITECTURE.md` promises; nothing here is wired until a consumer needs
 * retrieval, at which point it is one line:
 *
 * ```ts
 * providers: [ …, ...HYBRID_RETRIEVAL_PROVIDERS ]
 * ```
 *
 * Two things about this array are load-bearing.
 *
 * **The engines are one factory-built array.** `HYBRID_RETRIEVAL_ENGINES`
 * resolves to `readonly RetrievalEngine[]`, and the pipeline injects that array
 * rather than seven classes. Adding an eighth engine is one line here and no
 * line anywhere else — which is what ADR-006's "every engine replaceable"
 * means in practice.
 *
 * **The semantic provider is absent on purpose.** There is no entry for
 * `HYBRID_RETRIEVAL_SEMANTIC_PROVIDER`. The engine injects it `@Optional()`,
 * finds nothing, and reports `feature_unavailable` — which is the proof that
 * vector search is optional rather than merely described as optional.
 *
 * The engines themselves inject the *frozen* tokens (`INTELLIGENCE_MEMORY`,
 * `INTELLIGENCE_KNOWLEDGE_GRAPH`, …) `@Optional()`, so this array can be spread
 * on its own: a deployment that has not wired Epics 04–06 gets a retrieval
 * layer whose engines all report themselves unavailable, which is exactly what
 * is true.
 */
import type { Provider } from "@nestjs/common";
import { INTELLIGENCE_CONTEXT_WINDOW_MANAGER } from "../orchestrator-contracts/orchestrator.tokens";
import {
  HYBRID_RETRIEVAL_CACHE_STORE,
  HYBRID_RETRIEVAL_CLOCK,
  HYBRID_RETRIEVAL_ENGINES,
  HYBRID_RETRIEVAL_PROVIDER
} from "./hybrid-retrieval.tokens";
import { SystemRetrievalClock } from "./hybrid-retrieval.clock";
import {
  InProcessRetrievalCache,
  RetrievalCacheService,
  SharedRetrievalCache,
  UnavailableRetrievalCacheStore
} from "./retrieval-cache.service";
import { WorkspaceRetrievalEngine } from "./workspace.engine";
import { MemoryRetrievalEngine } from "./memory.engine";
import { FeatureStoreRetrievalEngine } from "./feature-store.engine";
import { KnowledgeGraphRetrievalEngine } from "./knowledge-graph.engine";
import { BusinessRetrievalEngine } from "./business.engine";
import { MarketplaceRetrievalEngine } from "./marketplace.engine";
import { SemanticRetrievalEngine } from "./semantic.engine";
import { RetrievalPipelineService } from "./retrieval-pipeline.service";
import { ContextAssemblyService } from "./context-assembly.service";
import { HybridRetrievalService } from "./hybrid-retrieval.service";
import { HybridRetrievalJobs } from "./hybrid-retrieval.jobs";
import type { RetrievalEngine } from "./retrieval-engine.contract";

/**
 * The engine array, built in `ENGINE_RETRIEVAL_ORDER`.
 *
 * The order here is documentation, not contract — the pipeline sorts by
 * `engineRank` and the ranker sorts by source priority, so shuffling this list
 * cannot change an answer. It is written in priority order anyway, because a
 * reader who sees Workspace first and Semantic last has learned the
 * architecture from the wiring.
 */
export const HYBRID_RETRIEVAL_ENGINES_PROVIDER: Provider = {
  provide: HYBRID_RETRIEVAL_ENGINES,
  useFactory: (
    workspace: WorkspaceRetrievalEngine,
    memory: MemoryRetrievalEngine,
    features: FeatureStoreRetrievalEngine,
    graph: KnowledgeGraphRetrievalEngine,
    business: BusinessRetrievalEngine,
    marketplace: MarketplaceRetrievalEngine,
    semantic: SemanticRetrievalEngine
  ): readonly RetrievalEngine[] => [
    workspace,
    memory,
    features,
    graph,
    business,
    marketplace,
    semantic
  ],
  inject: [
    WorkspaceRetrievalEngine,
    MemoryRetrievalEngine,
    FeatureStoreRetrievalEngine,
    KnowledgeGraphRetrievalEngine,
    BusinessRetrievalEngine,
    MarketplaceRetrievalEngine,
    SemanticRetrievalEngine
  ]
};

export const HYBRID_RETRIEVAL_PROVIDERS: readonly Provider[] = [
  // Infrastructure.
  { provide: HYBRID_RETRIEVAL_CLOCK, useClass: SystemRetrievalClock },
  InProcessRetrievalCache,
  SharedRetrievalCache,
  RetrievalCacheService,
  // L3 is a contract with no storage until M1; the binding reports that
  // honestly rather than being absent, so `tiers.l3` is a fact not a guess.
  { provide: HYBRID_RETRIEVAL_CACHE_STORE, useClass: UnavailableRetrievalCacheStore },
  // The seven engines, in the binding retrieval order.
  WorkspaceRetrievalEngine,
  MemoryRetrievalEngine,
  FeatureStoreRetrievalEngine,
  KnowledgeGraphRetrievalEngine,
  BusinessRetrievalEngine,
  MarketplaceRetrievalEngine,
  SemanticRetrievalEngine,
  HYBRID_RETRIEVAL_ENGINES_PROVIDER,
  // The pipeline and the read side.
  RetrievalPipelineService,
  ContextAssemblyService,
  HybridRetrievalService,
  // The only way this layer's state changes (doc 23 §5).
  HybridRetrievalJobs,
  // Contract tokens: consumers inject the interface, never the class.
  { provide: HYBRID_RETRIEVAL_PROVIDER, useExisting: HybridRetrievalService },
  // The frozen patch-G token this epic implements.
  { provide: INTELLIGENCE_CONTEXT_WINDOW_MANAGER, useExisting: ContextAssemblyService }
];
