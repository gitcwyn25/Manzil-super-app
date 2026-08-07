/**
 * Layer 4 (Memory Engine) — the memory jobs.
 *
 * Doc 23 §5 is binding: intelligence services are never called directly,
 * everything is a Job. Memory changes on a schedule through two of them, and
 * both:
 *
 * - are **idempotent** (§4) — same name, same payload, same `idempotencyKey`
 *   returns the identical result, event ids included, and performs its side
 *   effects once;
 * - **announce** rather than deliver (§2, §3) — a `MemoryUpdated` envelope
 *   carrying a customer id and the tiers that changed, never the knowledge
 *   itself;
 * - are **measured** (§8) — execution time always, memory freshness where
 *   there is a memory to be fresh, typed failure cause when something breaks.
 *
 * `ExpireMemoryJob` is added to `IntelligenceJobCatalog` by declaration
 * merging — the extension mechanism Epic 03 designed in — so the frozen file
 * is never edited. It exists because expiry must not depend on somebody
 * reading: a mission that expired last night has to be gone this morning even
 * if nobody asked, or the platform is holding knowledge it promised to
 * destroy.
 */
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type {
  AnyIntelligenceEvent,
  EntityId,
  IntelligenceFailure,
  IntelligenceJob,
  MemoryTier,
  MetricsSink
} from "../core";
import { INTELLIGENCE_METRICS_SINK } from "../orchestrator-contracts/orchestrator.tokens";
import { MEMORY_ENGINE_CLOCK } from "./memory-engine.tokens";
import type { MemoryClock } from "./memory-engine.clock";
import { MemoryCacheService } from "./memory-cache.service";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService } from "./memory-retrieval.service";
import { MemoryWriterService, type MemoryWriteContext } from "./memory-writer.service";
import { ageSeconds } from "./memory.lifecycle";
import type { MemoryScope } from "./memory.scope";

declare module "../core/jobs/jobs.types" {
  interface IntelligenceJobCatalog {
    /**
     * Sweep expired memory objects. `customerId: null` sweeps every subject.
     * Idempotent: expiry is convergent — the second run finds nothing left to
     * expire and announces nothing.
     */
    readonly ExpireMemoryJob: { readonly customerId: EntityId | null };
  }
}

/** Bound on the idempotency ledger, so a long-lived process cannot leak. */
export const MAX_MEMORY_LEDGER_ENTRIES = 500;

export interface MemoryJobResult {
  readonly jobId: EntityId;
  readonly name: "UpdateCustomerMemoryJob" | "ExpireMemoryJob";
  readonly idempotencyKey: string;
  /** True when this exact job had already run and the result was replayed. */
  readonly deduplicated: boolean;
  /** The customer whose memory this job touched; null for a global sweep. */
  readonly customerId: EntityId | null;
  /** Tiers whose contents actually changed — the payload of the event. */
  readonly updatedTiers: readonly MemoryTier[];
  /** Slots the job removed (expiry only). */
  readonly expiredScopes: readonly MemoryScope[];
  /** Built whether or not a publisher exists; empty when nothing changed. */
  readonly events: readonly AnyIntelligenceEvent[];
  readonly published: boolean;
  readonly failure: IntelligenceFailure | null;
}

@Injectable()
export class MemoryEngineJobs {
  private readonly logger = new Logger(MemoryEngineJobs.name);

  /**
   * In-process idempotency ledger.
   *
   * The honest analogue of what BullMQ will do with `idempotencyKey` once Epic
   * 03.5 lands: a resubmitted job replays its recorded result instead of
   * repeating its side effects. Bounded and FIFO-evicted — a ledger that grows
   * forever would be a slower leak, not a safer one.
   */
  private readonly ledger = new Map<string, MemoryJobResult>();

  constructor(
    private readonly repository: MemoryRepository,
    private readonly retrieval: MemoryRetrievalService,
    private readonly writer: MemoryWriterService,
    private readonly cache: MemoryCacheService,
    @Inject(MEMORY_ENGINE_CLOCK) private readonly clock: MemoryClock,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics?: MetricsSink
  ) {}

  /**
   * Refreshes one customer's memory from recent activity.
   *
   * The job derives the preference tier from what the customer has actually
   * done and writes it through the conflict rule, so an explicitly remembered
   * preference is refined by behaviour rather than flattened by it. Then it
   * expires whatever aged out for that customer, because the natural moment to
   * notice a dead mission is while looking at the same person's memory.
   *
   * Naturally convergent beneath the ledger: the same rows derive the same
   * preference, and re-writing identical knowledge resolves to a stable tie
   * that writes nothing.
   */
  async updateCustomerMemory(
    job: IntelligenceJob<"UpdateCustomerMemoryJob">
  ): Promise<MemoryJobResult> {
    const replayed = this.replay(job.name, job.idempotencyKey);
    if (replayed) return replayed;

    const startedAt = Date.now();
    const customerId = job.payload.customerId;
    const context: MemoryWriteContext = {
      correlationId: job.correlationId,
      causationEventId: job.causationEventId,
      customerId
    };

    // Behaviour changed, so the cached derivation is stale by definition —
    // dropping it first is what makes the job read the world as it is now.
    await this.cache.invalidate();

    const updatedTiers: MemoryTier[] = [];
    const events: AnyIntelligenceEvent[] = [];
    let published = false;
    let failure: IntelligenceFailure | null = null;

    const projected = await this.retrieval.projectPreference(customerId);

    if (projected) {
      const announcement = await this.writer.remember(projected, context);

      if (announcement.result.failure) {
        failure = announcement.result.failure;
        this.record("failure", job.name, 0, failure);
      }

      if (announcement.result.outcome === "written") {
        updatedTiers.push("preference_context");
        events.push(...announcement.events);
        published = announcement.published || published;
      }

      if (announcement.result.memory) {
        this.recordFreshness(customerId, ageSeconds(announcement.result.memory, this.clock.now()));
      }
    } else {
      this.logger.debug(`no activity to project memory from for customer ${customerId}`);
    }

    // Scoped to this customer: a job about one person must not silently
    // delete another's memory, because that deletion is announced to nobody.
    const expiredHere = await this.repository.sweepExpired(this.clock.now(), customerId);

    if (expiredHere.length > 0) {
      const tiers = MemoryRepository.tiersOf(expiredHere);
      const announcement = await this.writer.announce(tiers, context);
      updatedTiers.push(...tiers);
      events.push(...announcement.events);
      published = announcement.published || published;
    }

    this.record("execution_time", job.name, Date.now() - startedAt);

    return this.remember({
      jobId: job.jobId,
      name: job.name,
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      customerId,
      updatedTiers: [...new Set(updatedTiers)].sort(),
      expiredScopes: expiredHere,
      events,
      published,
      failure
    });
  }

  /**
   * Destroys what has aged out, everywhere or for one customer.
   *
   * Expiry is enforced on read as well (`MemoryRepository.readMany` drops and
   * deletes what it finds expired), so this job is not what makes recall
   * correct. It is what makes the *promise* correct: AI Bible v1.2 says
   * volatile memory is "destroyed when appropriate", and a mission that
   * survives because nobody happened to read it has not been destroyed.
   */
  async expireMemory(job: IntelligenceJob<"ExpireMemoryJob">): Promise<MemoryJobResult> {
    const replayed = this.replay(job.name, job.idempotencyKey);
    if (replayed) return replayed;

    const startedAt = Date.now();
    const customerId = job.payload.customerId;

    const expired = await this.repository.sweepExpired(this.clock.now(), customerId);
    const tiers = MemoryRepository.tiersOf(expired);
    const announcement = await this.writer.announce(tiers, {
      correlationId: job.correlationId,
      causationEventId: job.causationEventId,
      customerId
    });

    this.record("execution_time", job.name, Date.now() - startedAt);

    return this.remember({
      jobId: job.jobId,
      name: job.name,
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      customerId,
      updatedTiers: tiers,
      expiredScopes: expired,
      events: announcement.events,
      published: announcement.published,
      failure: null
    });
  }

  private record(
    kind: "execution_time" | "failure",
    operation: string,
    durationMs: number,
    failure?: IntelligenceFailure
  ): void {
    if (!this.metrics) return;

    const at = this.clock.now();

    if (kind === "execution_time") {
      this.metrics.record({ kind: "execution_time", operation, durationMs, at });
    } else if (failure) {
      this.metrics.record({ kind: "failure", operation, errorKind: failure.error.kind, at });
    }
  }

  /** Doc 23 §8 names memory freshness explicitly; this is where it is emitted. */
  private recordFreshness(customerId: EntityId, seconds: number): void {
    this.metrics?.record({
      kind: "freshness",
      subject: "memory",
      entityId: customerId,
      ageSeconds: seconds,
      at: this.clock.now()
    });
  }

  private replay(name: string, idempotencyKey: string): MemoryJobResult | null {
    const stored = this.ledger.get(`${name}|${idempotencyKey}`);
    return stored ? { ...stored, deduplicated: true } : null;
  }

  private remember(result: MemoryJobResult): MemoryJobResult {
    if (this.ledger.size >= MAX_MEMORY_LEDGER_ENTRIES) {
      const oldest = this.ledger.keys().next().value;
      if (oldest) this.ledger.delete(oldest);
    }

    this.ledger.set(`${result.name}|${result.idempotencyKey}`, result);
    return result;
  }
}
