/**
 * Layer 4.5 (Hybrid Retrieval) — the pipeline.
 *
 * ```text
 *   plan → fan out (parallel) → collect → filter → merge → dedupe → rank
 *        → score cross-engine → hydrate survivors → package
 * ```
 *
 * Three properties make this more than a `Promise.all`.
 *
 * **Failure is expected, never fatal.** The epic's rule is "engine failure →
 * continue with the rest", so the fan-out uses `allSettled` semantics by
 * construction: `BaseRetrievalEngine` guarantees no engine throws, and a
 * refusal is a typed outcome the pipeline records in `failedEngines`. A
 * retrieval where six engines answered and one refused is a *complete* answer
 * with a named gap — and `partialResults` distinguishes the case where the gap
 * was in an engine the plan marked required.
 *
 * **Scoring happens after the merge, not inside it.** The graph finds a
 * provider and knows nothing of its health; the business engine holds the
 * health and never saw the graph's hit. So every engine gets a chance to score
 * the merged list, which is why `score()` is on the contract at all.
 *
 * **Hydration happens last, and only to survivors.** Expanding 120 candidates
 * to answer with 5 is how a retrieval layer becomes the slowest thing in a
 * request; the cap is applied first, then the survivors are expanded by
 * whichever engine can serve the requested level.
 *
 * The engines arrive as one injected array (`HYBRID_RETRIEVAL_ENGINES`) and
 * this service never names one. That is what makes "every engine replaceable"
 * (ADR-006) a structural fact: adding an eighth is an edit to a provider array.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { EntityId, MetricsSink } from "../core";
import {
  INTELLIGENCE_METRICS_SINK
} from "../orchestrator-contracts/orchestrator.tokens";
import { HYBRID_RETRIEVAL_CLOCK, HYBRID_RETRIEVAL_ENGINES } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import type { RetrievalEngine, RetrievalEngineResult } from "./retrieval-engine.contract";
import { applyFilters, forbiddenFilterFailure, internalFiltersFor } from "./retrieval-filters";
import { contributingEngines, mergeAndRank } from "./retrieval-ranking";
import { planRetrieval, type RetrievalPlan, type RetrievalPlanStep } from "./retrieval-plan";
import { failureOf, isRetrieved, itemsOf, warningOf } from "./retrieval-outcome";
import { hydrationDepth } from "./hybrid-retrieval.types";
import type {
  RetrievalDiagnostics,
  RetrievalEngineFailure,
  RetrievalEngineId,
  RetrievalItem,
  RetrievalPackage,
  RetrievalQuery,
  RetrievalWarning
} from "./hybrid-retrieval.types";

/** One engine's contribution, kept together for accounting. */
interface EngineContribution {
  readonly engineId: RetrievalEngineId;
  readonly result: RetrievalEngineResult;
  readonly required: boolean;
}

@Injectable()
export class RetrievalPipelineService {
  constructor(
    @Inject(HYBRID_RETRIEVAL_ENGINES) private readonly engines: readonly RetrievalEngine[],
    @Inject(HYBRID_RETRIEVAL_CLOCK) private readonly clock: RetrievalClock,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics: MetricsSink | null = null
  ) {}

  /** The plan this query would run — exposed so callers can inspect it first. */
  plan(query: RetrievalQuery): RetrievalPlan {
    return planRetrieval(
      query,
      this.engines.map((engine) => ({
        engineId: engine.id,
        available: engine.availability.available
      }))
    );
  }

  /** Every installed engine, in whatever order they were provided. */
  get installedEngines(): readonly RetrievalEngine[] {
    return this.engines;
  }

  /**
   * Runs one retrieval end to end.
   *
   * The forbidden-filter check happens before anything else: a query a
   * principal may not ask is refused as a whole, not answered with the
   * permitted subset. Answering partially would leak the shape of the internal
   * filter through the difference in results.
   */
  async run(query: RetrievalQuery): Promise<RetrievalPackage> {
    const started = this.clock.monotonicMs();
    const now = this.clock.now();

    const forbidden = internalFiltersFor(query.filters);
    if (forbidden.length > 0 && query.audience !== "internal") {
      const failure = forbiddenFilterFailure(forbidden, query.audience, now);

      return this.emptyPackage(query, now, this.elapsed(started), [
        warningOf(null, `filter:${forbidden.join(",")}`, failure)
      ]);
    }

    const plan = this.plan(query);
    const contributions = await this.fanOut(plan, query);

    const warnings: RetrievalWarning[] = [];
    const failedEngines: RetrievalEngineFailure[] = [];
    const collected: RetrievalItem[] = [];

    for (const contribution of contributions) {
      const { engineId, result } = contribution;

      if (isRetrieved(result.outcome)) {
        collected.push(...itemsOf(result.outcome));

        if (result.truncated) {
          warnings.push(
            warningOf(engineId, `limit:per_engine`, {
              error: { kind: "marketplace_sparse", scopeKey: `engine:${engineId}`, sampleSize: query.limits.perEngine },
              retryable: false,
              occurredAt: result.generatedAt
            })
          );
        }
        continue;
      }

      const failure = failureOf(result.outcome);
      if (failure) {
        failedEngines.push({ engineId, failure, executionMs: result.executionMs });
        warnings.push(warningOf(engineId, `engine:${engineId}`, failure));
        this.metrics?.record({
          kind: "failure",
          operation: `retrieval.${engineId}`,
          errorKind: failure.error.kind,
          at: result.generatedAt
        });
      }
    }

    const filtered = applyFilters(collected, query.filters, now);
    warnings.push(...filtered.warnings);

    const rankingStarted = this.clock.monotonicMs();
    const merged = mergeAndRank(filtered.items, query.limits.total);
    const scored = await this.crossScore(merged, query);
    const ranked = mergeAndRank(scored, query.limits.total);
    const rankingMs = this.elapsed(rankingStarted);

    const hydrationStarted = this.clock.monotonicMs();
    const hydrated = await this.hydrate(ranked, query, warnings);
    const hydrationMs = this.elapsed(hydrationStarted);

    const executionMs = this.elapsed(started);
    const requiredFailed = failedEngines.some((entry) =>
      plan.steps.some((step) => step.engineId === entry.engineId && step.required)
    );

    this.metrics?.record({ kind: "execution_time", operation: "retrieval.run", durationMs: executionMs, at: now });

    return {
      retrievalId: query.retrievalId,
      queryId: query.queryId,
      customerId: query.customerId,
      workspaceId: query.workspaceId,
      items: hydrated,
      diagnostics: this.diagnostics(query, plan, contributions, hydrated, {
        executionMs,
        rankingMs,
        hydrationMs
      }),
      warnings,
      partialResults: requiredFailed || failedEngines.length > 0,
      failedEngines,
      generatedAt: now,
      cacheStatus: "miss"
    };
  }

  /**
   * The parallel fan-out.
   *
   * `Promise.all` rather than `allSettled` because the base engine already
   * guarantees no rejection — an engine that throws returns a typed
   * `reasoning_failure` instead. Using `allSettled` here would add a second,
   * weaker failure channel whose entries carry no taxonomy kind, and the
   * failure dashboard would have two shapes to aggregate.
   */
  private async fanOut(
    plan: RetrievalPlan,
    query: RetrievalQuery
  ): Promise<readonly EngineContribution[]> {
    const byId = new Map(this.engines.map((engine) => [engine.id, engine]));

    const runs = plan.steps.map(async (step: RetrievalPlanStep): Promise<EngineContribution | null> => {
      const engine = byId.get(step.engineId);
      if (!engine) return null;

      const scopedQuery: RetrievalQuery = { ...query, limits: step.limits };
      const result =
        step.operation === "lookup"
          ? await engine.lookup(step.ids, scopedQuery)
          : await engine.search(scopedQuery);

      return { engineId: step.engineId, result, required: step.required };
    });

    const settled = await Promise.all(runs);
    return settled.filter((entry): entry is EngineContribution => entry !== null);
  }

  /**
   * Every engine's second pass over the merged list.
   *
   * Sequential rather than parallel, deliberately: each engine's `score` sees
   * the previous engine's additions, so a business item found by the graph can
   * gain a trust score and then a feature score. Running these concurrently
   * would have each engine score the pre-merge list and the last write would
   * win.
   */
  private async crossScore(
    items: readonly RetrievalItem[],
    query: RetrievalQuery
  ): Promise<readonly RetrievalItem[]> {
    let current = items;

    for (const engine of this.engines) {
      if (!engine.availability.available) continue;
      current = await engine.score(current, query);
    }

    return current;
  }

  /**
   * Expands the survivors to the requested depth.
   *
   * Only engines that declare the level are asked; an item that comes back at
   * the level it went in is recorded as a hydration gap rather than silently
   * accepted, because "we could not load the reviews" and "there are no
   * reviews" are different answers.
   */
  private async hydrate(
    items: readonly RetrievalItem[],
    query: RetrievalQuery,
    warnings: RetrievalWarning[]
  ): Promise<readonly RetrievalItem[]> {
    const level = query.limits.hydrateTo;
    if (level === "summary" || items.length === 0) return items;

    let current = items;

    for (const engine of this.engines) {
      if (!engine.availability.available) continue;
      if (!engine.hydrationLevels.includes(level)) continue;
      current = await engine.hydrate(current, level);
    }

    const unexpanded = current.filter(
      (item) => hydrationDepth(item.hydration) < hydrationDepth(level)
    );

    if (unexpanded.length > 0) {
      warnings.push(
        warningOf(null, `hydration:${level}`, {
          error: {
            kind: "feature_unavailable",
            featureKey: `retrieval.hydration.${level}`,
            entityId: null
          },
          retryable: false,
          occurredAt: this.clock.now()
        })
      );
    }

    return current;
  }

  /** The observability record the epic specifies, field for field. */
  private diagnostics(
    query: RetrievalQuery,
    plan: RetrievalPlan,
    contributions: readonly EngineContribution[],
    items: readonly RetrievalItem[],
    timings: { readonly executionMs: number; readonly rankingMs: number; readonly hydrationMs: number }
  ): RetrievalDiagnostics {
    const cacheHits = contributions.filter((entry) =>
      entry.result.cacheStatus.startsWith("hit_")
    ).length;

    return {
      retrievalId: query.retrievalId,
      queryId: query.queryId,
      workspaceId: query.workspaceId,
      customerId: query.customerId,
      enginesUsed: contributingEngines(items).length > 0
        ? contributingEngines(items)
        : contributions.map((entry) => entry.engineId),
      enginesSkipped: plan.skipped.map((skip) => skip.engineId),
      executionMs: timings.executionMs,
      entitiesRetrieved: new Set<EntityId>(items.map((item) => item.entityId)).size,
      cacheHits,
      cacheMisses: contributions.length - cacheHits,
      rankingMs: timings.rankingMs,
      hydrationMs: timings.hydrationMs
    };
  }

  /** The package a refused query produces: empty, warned, and honest. */
  private emptyPackage(
    query: RetrievalQuery,
    now: string,
    executionMs: number,
    warnings: readonly RetrievalWarning[]
  ): RetrievalPackage {
    return {
      retrievalId: query.retrievalId,
      queryId: query.queryId,
      customerId: query.customerId,
      workspaceId: query.workspaceId,
      items: [],
      diagnostics: {
        retrievalId: query.retrievalId,
        queryId: query.queryId,
        workspaceId: query.workspaceId,
        customerId: query.customerId,
        enginesUsed: [],
        enginesSkipped: this.engines.map((engine) => engine.id),
        executionMs,
        entitiesRetrieved: 0,
        cacheHits: 0,
        cacheMisses: 0,
        rankingMs: 0,
        hydrationMs: 0
      },
      warnings,
      partialResults: true,
      failedEngines: [],
      generatedAt: now,
      cacheStatus: "uncacheable"
    };
  }

  private elapsed(startedMs: number): number {
    return Math.max(0, Math.round(this.clock.monotonicMs() - startedMs));
  }
}
