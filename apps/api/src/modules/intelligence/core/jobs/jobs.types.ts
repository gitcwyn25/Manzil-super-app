/**
 * Layer 0 (core/jobs) — AI Jobs: intelligence is never invoked directly.
 *
 * Doc 23 §5: every intelligence operation is a Job handed to an executor.
 * Today's executor runs in-process; BullMQ later changes ONLY the executor
 * binding — job shapes, names, and idempotency semantics are frozen here.
 *
 * IDEMPOTENCY (doc 23 §4, binding for every job in the catalog): executing
 * the same job twice — same name, same payload, same `idempotencyKey` —
 * must yield the identical result and identical side effects as executing
 * it once. Executors may deduplicate on `idempotencyKey`; implementations
 * must tolerate redelivery.
 */
import type { EntityId, IsoDateTime } from "../core.primitives";

/**
 * The typed job catalog. An open registry (declaration merging) like the
 * event catalog; payloads are ids only — a job names *what* to work on, the
 * implementation queries the owning layer for current knowledge, which is
 * also what makes re-execution naturally idempotent.
 */
export interface IntelligenceJobCatalog {
  /** Rebuild one business's stored AI profile. Idempotent: same inputs ⇒ same stored summary. */
  readonly SummarizeBusinessJob: { readonly businessId: EntityId };
  /** Refresh one customer's memory tiers from recent activity. Idempotent per idempotencyKey. */
  readonly UpdateCustomerMemoryJob: { readonly customerId: EntityId };
  /** Rebuild graph nodes/edges, fully or for a scoped entity set. Idempotent: rebuilds converge. */
  readonly RebuildKnowledgeGraphJob: {
    readonly scope: "full" | "entities";
    readonly entityIds: readonly EntityId[];
  };
  /** Re-run relationship inference over an entity set. Idempotent: inference is a pure derivation. */
  readonly InferRelationshipsJob: { readonly entityIds: readonly EntityId[] };
  /** Recompute one business's health block. Idempotent: same observations ⇒ same health. */
  readonly RefreshBusinessHealthJob: { readonly businessId: EntityId };
  /** Regenerate recommendations for a customer/workspace. Idempotent per idempotencyKey. */
  readonly GenerateRecommendationsJob: {
    readonly customerId: EntityId;
    readonly workspaceId: EntityId | null;
  };
}

/** The open set of job names. */
export type IntelligenceJobName = keyof IntelligenceJobCatalog;

/** One enqueued unit of intelligence work, fully typed by its name. */
export interface IntelligenceJob<TName extends IntelligenceJobName = IntelligenceJobName> {
  readonly jobId: EntityId;
  readonly name: TName;
  readonly payload: IntelligenceJobCatalog[TName];
  /**
   * Deduplication + idempotency handle: two submissions with the same key
   * are the same logical operation and must not run to different results.
   */
  readonly idempotencyKey: string;
  /** Ties the job to the event chain that caused it. */
  readonly correlationId: EntityId;
  /** The event that triggered this job, when event-triggered. */
  readonly causationEventId: EntityId | null;
  readonly requestedAt: IsoDateTime;
}

/** Executor's answer to an enqueue — including honest deduplication. */
export interface JobAcknowledgement {
  readonly jobId: EntityId;
  readonly accepted: boolean;
  /** True when an identical `idempotencyKey` was already queued/running. */
  readonly deduplicated: boolean;
}

export type JobState = "queued" | "running" | "retrying" | "succeeded" | "failed";

/** Queryable execution state of one job. */
export interface JobStatus {
  readonly jobId: EntityId;
  readonly state: JobState;
  readonly attempts: number;
  /** Structured error class (`timeout`, `dependency_unavailable`) — never a stack trace. */
  readonly lastErrorKind: string | null;
  readonly updatedAt: IsoDateTime;
}

/**
 * Command + Query API of job execution. In-process today, BullMQ tomorrow —
 * consumers inject this contract by token and never learn which.
 */
export interface JobExecutor {
  enqueue<TName extends IntelligenceJobName>(job: IntelligenceJob<TName>): Promise<JobAcknowledgement>;
  status(jobId: EntityId): Promise<JobStatus | null>;
}
