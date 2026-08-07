/**
 * Layer 4.5 (Hybrid Retrieval) — the invalidation job.
 *
 * Retrieval owns no knowledge, so unlike Epics 04–06 it has almost nothing to
 * schedule. It owns exactly one piece of mutable state — the cache — and doc
 * 23 §5 is still binding about how that changes: not by a service call from
 * wherever noticed, but by a Job.
 *
 * The job matters because of what the canonical chain says (doc 23 §2):
 *
 * ```text
 *   … → KnowledgeGraphUpdated → MemoryUpdated → RecommendationsInvalidated
 * ```
 *
 * Every one of those three means some cached retrieval is now a confident
 * wrong answer. `RETRIEVAL_INVALIDATION_TRIGGERS` maps them to this job as
 * data, so a fourth event that should invalidate retrieval is a row rather
 * than an edit to a subscriber.
 *
 * The job is **idempotent** (doc 23 §4): invalidation is namespace-versioned,
 * so running it twice costs one extra version bump and changes nothing. The
 * ledger is still kept, because a redelivered job must *replay* its result
 * rather than produce a second one.
 *
 * The publisher and metrics sink are `@Optional()`: Epic 03.5 owns the
 * in-process bus and has not shipped. The event is still built on every run
 * and returned in the result, so the chain is asserted in tests today and turns
 * on when 03.5 binds the token, with no change here.
 */
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type {
  EntityId,
  EventPublisher,
  IntelligenceEvent,
  IntelligenceEventType,
  IntelligenceJob,
  IsoDateTime,
  MetricsSink
} from "../core";
import {
  INTELLIGENCE_EVENT_PUBLISHER,
  INTELLIGENCE_METRICS_SINK
} from "../orchestrator-contracts/orchestrator.tokens";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { RetrievalCacheService } from "./retrieval-cache.service";

declare module "../core/jobs/jobs.types" {
  interface IntelligenceJobCatalog {
    /**
     * Drop cached retrieval packages after knowledge changed.
     *
     * `scope` is `full` today because invalidation is namespace-versioned and
     * there is no per-entity index over cache keys; `entityIds` travels anyway
     * so a future keyed invalidation is a change of implementation rather than
     * a change of contract.
     */
    readonly InvalidateRetrievalCacheJob: {
      readonly scope: "full" | "entities";
      readonly entityIds: readonly EntityId[];
    };
  }
}

declare module "../core/events/events.types" {
  interface IntelligenceEventCatalog {
    /** Cached retrieval was dropped; downstream caches may follow. */
    readonly RetrievalCacheInvalidated: {
      readonly scope: string;
      readonly entityIds: readonly EntityId[];
      readonly invalidatedAt: IsoDateTime;
    };
  }
}

/**
 * Which events invalidate cached retrieval, as data.
 *
 * All three of the chain's tail events. `BusinessSummaryCompleted` is
 * deliberately absent: it is *followed* by `KnowledgeGraphUpdated` in the
 * canonical chain, so acting on both would invalidate twice for one change.
 */
export const RETRIEVAL_INVALIDATION_TRIGGERS = [
  "KnowledgeGraphUpdated",
  "MemoryUpdated",
  "RecommendationsInvalidated"
] as const satisfies readonly IntelligenceEventType[];

/** Bound on the idempotency ledger, so a long-lived process cannot leak. */
export const MAX_RETRIEVAL_LEDGER_ENTRIES = 200;

/** The one job this module executes. */
export type RetrievalJobName = "InvalidateRetrievalCacheJob";

export interface RetrievalJobResult {
  readonly jobId: EntityId;
  readonly name: RetrievalJobName;
  readonly idempotencyKey: string;
  /** True when this exact job had already run and the result was replayed. */
  readonly deduplicated: boolean;
  readonly scope: "full" | "entities";
  readonly entityIds: readonly EntityId[];
  /** Built always; published only when Epic 03.5 has bound the publisher. */
  readonly event: IntelligenceEvent<"RetrievalCacheInvalidated">;
  readonly executionMs: number;
}

@Injectable()
export class HybridRetrievalJobs {
  private readonly logger = new Logger(HybridRetrievalJobs.name);
  private readonly ledger = new Map<string, RetrievalJobResult>();

  constructor(
    private readonly cache: RetrievalCacheService,
    @Inject(HYBRID_RETRIEVAL_CLOCK) private readonly clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_EVENT_PUBLISHER)
    private readonly publisher: EventPublisher | null = null,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics: MetricsSink | null = null
  ) {}

  /**
   * Drops cached retrieval and announces it.
   *
   * Replays on redelivery: the same `idempotencyKey` returns the stored result,
   * event id included, so a retried job cannot publish a second event for one
   * logical invalidation.
   */
  async invalidate(
    job: IntelligenceJob<"InvalidateRetrievalCacheJob">
  ): Promise<RetrievalJobResult> {
    const replayed = this.ledger.get(job.idempotencyKey);
    if (replayed) return { ...replayed, deduplicated: true };

    const started = this.clock.monotonicMs();
    await this.cache.invalidate();
    const at = this.clock.now();

    const event: IntelligenceEvent<"RetrievalCacheInvalidated"> = {
      eventId: this.clock.newId(),
      eventType: "RetrievalCacheInvalidated",
      eventVersion: 1,
      timestamp: at,
      aggregateId: job.payload.entityIds[0] ?? job.jobId,
      correlationId: job.correlationId,
      causationId: job.causationEventId,
      payload: {
        scope: job.payload.scope,
        entityIds: job.payload.entityIds,
        invalidatedAt: at
      }
    };

    const result: RetrievalJobResult = {
      jobId: job.jobId,
      name: "InvalidateRetrievalCacheJob",
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      scope: job.payload.scope,
      entityIds: job.payload.entityIds,
      event,
      executionMs: Math.max(0, Math.round(this.clock.monotonicMs() - started))
    };

    this.remember(job.idempotencyKey, result);

    await this.publisher?.publish(event);
    this.metrics?.record({
      kind: "execution_time",
      operation: "InvalidateRetrievalCacheJob",
      durationMs: result.executionMs,
      at
    });

    this.logger.debug(`invalidated retrieval cache (scope=${job.payload.scope})`);
    return result;
  }

  /** Ledger write with a FIFO bound; a replay must not cost unbounded memory. */
  private remember(key: string, result: RetrievalJobResult): void {
    if (this.ledger.size >= MAX_RETRIEVAL_LEDGER_ENTRIES) {
      const oldest = this.ledger.keys().next().value;
      if (oldest) this.ledger.delete(oldest);
    }

    this.ledger.set(key, result);
  }

  /** True when an event type should invalidate cached retrieval. */
  static invalidatesRetrieval(eventType: IntelligenceEventType): boolean {
    return (RETRIEVAL_INVALIDATION_TRIGGERS as readonly string[]).includes(eventType);
  }
}
