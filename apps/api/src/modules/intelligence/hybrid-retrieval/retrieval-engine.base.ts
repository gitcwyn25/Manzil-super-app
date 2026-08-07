/**
 * Layer 4.5 (Hybrid Retrieval) — the shared engine body.
 *
 * Seven engines implement one contract, and roughly a third of each of them
 * would otherwise be the same three paragraphs: time the call, cap the result,
 * turn a thrown error into a typed failure, and project an explanation. Written
 * seven times, those paragraphs drift — one engine forgets the cap, another
 * lets an exception escape and takes the whole fan-out down with it.
 *
 * So they are written once. What a concrete engine supplies is only what makes
 * it *that* engine: its identity, what it can honestly serve, and two
 * retrieval methods. Everything the pipeline relies on — that no engine
 * throws, that every engine respects `limits.perEngine`, that every result
 * carries an execution time and a truncation flag — is a property of this
 * class rather than a convention seven files agreed to follow.
 *
 * `hydrate` and `score` have honest defaults: return the items unchanged. An
 * engine that cannot expand or cannot add a signal says so by not overriding,
 * and the `hydration` field that did not move is the evidence.
 */
import type { EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import type { RetrievalSource } from "../memory-engine";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import type {
  RetrievalEngine,
  RetrievalEngineAvailability,
  RetrievalEngineResult
} from "./retrieval-engine.contract";
import { frozenSourceRank } from "./retrieval-priority";
import { contributingSignals } from "./retrieval-scoring";
import { isRetrieved, refuseEngineFault } from "./retrieval-outcome";
import type {
  CacheStatus,
  HydrationLevel,
  RetrievalEngineId,
  RetrievalExplanation,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalOutcome,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** What a concrete engine returns from its two retrieval methods. */
export type EngineOutcome = RetrievalOutcome<readonly RetrievalItem[]>;

/** Optional accounting a concrete engine can attach to its outcome. */
export interface EngineRun {
  readonly outcome: EngineOutcome;
  readonly cacheStatus?: CacheStatus;
}

export abstract class BaseRetrievalEngine implements RetrievalEngine {
  abstract readonly id: RetrievalEngineId;
  abstract readonly retrievalSource: RetrievalSource | null;
  abstract readonly contextSection: ContextSection;
  abstract readonly itemKinds: readonly RetrievalItemKind[];
  abstract readonly hydrationLevels: readonly HydrationLevel[];
  abstract readonly availability: RetrievalEngineAvailability;

  protected constructor(protected readonly clock: RetrievalClock) {}

  /** The engine's own search. May throw; the wrapper below makes that safe. */
  protected abstract runSearch(query: RetrievalQuery): Promise<EngineRun>;

  /** The engine's own keyed read. May throw; the wrapper below makes that safe. */
  protected abstract runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun>;

  search(query: RetrievalQuery): Promise<RetrievalEngineResult> {
    return this.measure("search", query, () => this.runSearch(query));
  }

  lookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<RetrievalEngineResult> {
    return this.measure("lookup", query, () => this.runLookup(ids, query));
  }

  /** Default: nothing deeper exists here. Overridden by engines that can expand. */
  async hydrate(
    items: readonly RetrievalItem[],
    _level: HydrationLevel
  ): Promise<readonly RetrievalItem[]> {
    return items;
  }

  /** Default: this engine has no signal to add beyond what it already scored. */
  async score(
    items: readonly RetrievalItem[],
    _query: RetrievalQuery
  ): Promise<readonly RetrievalItem[]> {
    return items;
  }

  /**
   * The explanation projection.
   *
   * Identical for all seven, because an explanation is a *projection* of the
   * item, not an opinion about it: the reasons, the measured signals, the
   * frozen source rank, and the freshness. An engine that wanted to say
   * something else here would be writing prose, which this layer does not do.
   */
  explain(item: RetrievalItem): RetrievalExplanation {
    return {
      retrievalItemId: item.retrievalItemId,
      engineId: item.engineId,
      retrievalSource: item.retrievalSource,
      sourceRank: frozenSourceRank(item.engineId),
      reasonCodes: item.score.reasonCodes,
      contributingSignals: contributingSignals(item.score),
      overallScore: item.score.overallScore,
      cacheStatus: item.cacheStatus,
      freshness: item.freshness
    };
  }

  /**
   * Times a run, caps it, and guarantees it does not throw.
   *
   * "Engine failure → continue with the rest" is the epic's failure rule, and
   * a rule that depends on every engine remembering to catch is not a rule.
   * The thrown value is discarded rather than logged into the result: a stack
   * trace is prose, and prose does not leave this module.
   */
  private async measure(
    operation: "search" | "lookup",
    query: RetrievalQuery,
    run: () => Promise<EngineRun>
  ): Promise<RetrievalEngineResult> {
    const started = this.clock.monotonicMs();

    try {
      const { outcome, cacheStatus } = await run();
      const capped = this.cap(outcome, query.limits.perEngine);

      return {
        engineId: this.id,
        outcome: capped.outcome,
        executionMs: this.elapsed(started),
        cacheStatus: cacheStatus ?? "miss",
        generatedAt: this.clock.now(),
        truncated: capped.truncated
      };
    } catch {
      return {
        engineId: this.id,
        outcome: refuseEngineFault(this.id, operation, this.clock.now()),
        executionMs: this.elapsed(started),
        cacheStatus: "uncacheable",
        generatedAt: this.clock.now(),
        truncated: false
      };
    }
  }

  private cap(
    outcome: EngineOutcome,
    perEngine: number
  ): { readonly outcome: EngineOutcome; readonly truncated: boolean } {
    if (!isRetrieved(outcome) || perEngine <= 0 || outcome.value.length <= perEngine) {
      return { outcome, truncated: false };
    }

    return {
      outcome: { ...outcome, value: outcome.value.slice(0, perEngine) },
      truncated: true
    };
  }

  private elapsed(startedMs: number): number {
    return Math.max(0, Math.round(this.clock.monotonicMs() - startedMs));
  }
}
