/**
 * Layer 4.5 (Hybrid Retrieval) — the provider.
 *
 * One class, one token (`HYBRID_RETRIEVAL_PROVIDER`), and Layer 5 never learns
 * that seven engines, a planner, a filter pipeline, a three-tier cache, a
 * ranker and a context assembler sit behind it. That is the same shape
 * `KnowledgeGraphService`, `MemoryEngineService` and
 * `MarketplaceIntelligenceService` present for their layers, and it is what
 * makes ADR-006's "every engine replaceable" invisible from above.
 *
 * The service adds three things the pipeline deliberately does not have:
 *
 * - **the cache**, because caching is a policy about answers and the pipeline
 *   is the thing that produces them;
 * - **the Context Package**, the twelve-box shape the epic specifies;
 * - **health**, so an operator can ask which engines are live without running
 *   a retrieval — and get the honest answer, including the two that are
 *   unavailable by design.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId, InferenceBudget, IsoDateTime } from "../core";
import type { ContextBudget } from "../orchestrator-contracts/context-window.contract";
import { HYBRID_RETRIEVAL_CLOCK, HYBRID_RETRIEVAL_ENGINES } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { RetrievalPipelineService } from "./retrieval-pipeline.service";
import { RetrievalCacheService } from "./retrieval-cache.service";
import { ContextAssemblyService, type ContextAssemblyResult } from "./context-assembly.service";
import { engineHealth, type RetrievalEngine, type RetrievalEngineHealth } from "./retrieval-engine.contract";
import { toContextPackage, type ContextPackage } from "./context-package";
import type { RetrievalPlan } from "./retrieval-plan";
import {
  DEFAULT_RETRIEVAL_LIMITS,
  type RetrievalIntent,
  type RetrievalPackage,
  type RetrievalQuery
} from "./hybrid-retrieval.types";

/** The retrieval budget used when a caller states none. */
export const DEFAULT_RETRIEVAL_BUDGET: InferenceBudget = {
  estimatedTokens: null,
  estimatedLatencyMs: null,
  estimatedCost: null,
  cacheEligible: true,
  priority: "interactive"
};

/** A retrieval and the twelve-box package it sorts into. */
export interface RetrievalResult {
  readonly package: RetrievalPackage;
  readonly context: ContextPackage;
}

/** What the whole layer can honestly promise right now. */
export interface RetrievalHealth {
  readonly engines: readonly RetrievalEngineHealth[];
  readonly availableEngines: number;
  readonly cacheTiers: Readonly<Record<"l1" | "l2" | "l3", boolean>>;
  /** False while L2 is a second in-process map rather than a shared tier. */
  readonly l2Shared: boolean;
  readonly at: IsoDateTime;
}

/**
 * Query API of hybrid retrieval. The one interface Layer 5 injects.
 *
 * Named `HybridRetrievalProvider` to match the `*Provider` convention every
 * frozen read-side contract in this platform uses.
 */
export interface HybridRetrievalProvider {
  retrieve(query: RetrievalQuery): Promise<RetrievalPackage>;
  retrieveContext(query: RetrievalQuery): Promise<RetrievalResult>;
  health(): RetrievalHealth;
}

@Injectable()
export class HybridRetrievalService implements HybridRetrievalProvider {
  constructor(
    private readonly pipeline: RetrievalPipelineService,
    private readonly cache: RetrievalCacheService,
    private readonly assembly: ContextAssemblyService,
    @Inject(HYBRID_RETRIEVAL_ENGINES) private readonly engines: readonly RetrievalEngine[],
    @Inject(HYBRID_RETRIEVAL_CLOCK) private readonly clock: RetrievalClock
  ) {}

  /**
   * One retrieval, cached.
   *
   * A cache hit is returned with its `cacheStatus` rewritten to say so — the
   * stored package recorded how *it* was produced, and a consumer needs to know
   * how *this* answer was served. Everything else about it, including its
   * freshness readings, is left exactly as stored: rewriting those would be
   * inventing a measurement.
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalPackage> {
    const cached = await this.cache.read(query);
    if (cached.package) {
      return { ...cached.package, cacheStatus: cached.status };
    }

    const produced = await this.pipeline.run(query);
    const result: RetrievalPackage = { ...produced, cacheStatus: cached.status };

    await this.cache.write(query, result);
    return result;
  }

  /** The same retrieval, plus the twelve-box Context Package. */
  async retrieveContext(query: RetrievalQuery): Promise<RetrievalResult> {
    const pkg = await this.retrieve(query);

    return {
      package: pkg,
      context: toContextPackage(pkg.retrievalId, pkg.items, this.clock.now())
    };
  }

  /**
   * Retrieval followed by budget-aware context assembly.
   *
   * Separate from `retrieveContext` because a token budget is a *consumer's*
   * constraint, not a property of the knowledge: the same package fits one
   * window and not another, and forcing every caller to state a budget would
   * make retrieval depend on a provider nobody has chosen.
   */
  async retrieveAssembled(
    query: RetrievalQuery,
    budget: ContextBudget
  ): Promise<RetrievalResult & { readonly assembly: ContextAssemblyResult }> {
    const result = await this.retrieveContext(query);

    return {
      ...result,
      assembly: await this.assembly.assemble(result.package, budget, query.reasoningSessionId)
    };
  }

  /** The plan a query would run, without running it. */
  plan(query: RetrievalQuery): RetrievalPlan {
    return this.pipeline.plan(query);
  }

  /** Drops every cached retrieval. Idempotent. */
  invalidate(): Promise<void> {
    return this.cache.invalidate();
  }

  /**
   * Which engines can serve, and which cache tiers exist.
   *
   * Exposed because it changes what an answer means: while the workspace engine
   * has no schema behind it, an answer with no workspace constraints may mean
   * "this platform cannot store plans", not "this plan is unconstrained" — and
   * a health check that cannot say so is a health check that lies.
   */
  health(): RetrievalHealth {
    const engines = this.engines.map(engineHealth);

    return {
      engines,
      availableEngines: engines.filter((entry) => entry.availability.available).length,
      cacheTiers: this.cache.tiers,
      l2Shared: this.cache.l2Shared,
      at: this.clock.now()
    };
  }

  /**
   * Builds a query with the module's defaults filled in.
   *
   * A constructor rather than a builder because `RetrievalQuery` is total by
   * design — every field is required so nobody forgets the audience or the
   * budget — and a caller that had to spell out fifteen fields would copy the
   * first example it found, defaults included.
   */
  newQuery(input: {
    readonly intent: RetrievalIntent;
    readonly customerId?: EntityId | null;
    readonly workspaceId?: EntityId | null;
    readonly reasoningSessionId?: string | null;
    readonly audience?: RetrievalQuery["audience"];
    readonly filters?: RetrievalQuery["filters"];
    readonly limits?: RetrievalQuery["limits"];
    readonly budget?: InferenceBudget;
  }): RetrievalQuery {
    return {
      retrievalId: this.clock.newId(),
      queryId: this.clock.newId(),
      customerId: input.customerId ?? null,
      workspaceId: input.workspaceId ?? null,
      reasoningSessionId: input.reasoningSessionId ?? null,
      audience: input.audience ?? "customer",
      intent: input.intent,
      filters: input.filters ?? [],
      limits: input.limits ?? DEFAULT_RETRIEVAL_LIMITS,
      budget: input.budget ?? DEFAULT_RETRIEVAL_BUDGET,
      requestedAt: this.clock.now()
    };
  }
}
