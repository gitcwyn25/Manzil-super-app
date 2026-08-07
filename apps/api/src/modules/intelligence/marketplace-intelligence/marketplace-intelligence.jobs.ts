/**
 * Layer 2 (Marketplace Intelligence) — the summarization jobs.
 *
 * Doc 23 §5 is binding: intelligence services are never called directly,
 * everything is a Job. These eight are the only ways Layer 2 knowledge
 * changes, and each one:
 *
 * - is **idempotent** (§4) — same name, same payload, same `idempotencyKey`
 *   replays the identical result, event ids included, and performs its side
 *   effects once. Beneath the ledger they are naturally convergent too: the
 *   same rows derive the same summary, and an identical payload resolves to
 *   `unchanged`, which announces nothing;
 * - **announces** rather than delivers (§2, §3) — a versioned envelope
 *   carrying ids and a timestamp, never the summary itself. Subscribers query
 *   this layer for the knowledge;
 * - is **measured** (§8) — execution time always, summary freshness where
 *   there is a summary to be fresh, typed failure cause when a model refuses.
 *
 * Two of the eight (`SummarizeBusinessJob`, `RefreshBusinessHealthJob`) are in
 * the frozen Epic 03 catalog. The other six are added by **declaration
 * merging** — the extension mechanism Epic 03 designed in — so the frozen file
 * is never edited. Two events are added the same way.
 *
 * The publisher and metrics sink are `@Optional()`: Epic 03.5 owns the
 * in-process bus and has not shipped. Events are still *built* on every run
 * and returned in the result, so the chain is asserted in tests today and
 * turns on when 03.5 binds the token, with no change here.
 */
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type {
  AnyIntelligenceEvent,
  EntityId,
  EventPublisher,
  IntelligenceEvent,
  IntelligenceFailure,
  IntelligenceJob,
  IsoDateTime,
  MetricsSink
} from "../core";
import {
  INTELLIGENCE_EVENT_PUBLISHER,
  INTELLIGENCE_METRICS_SINK
} from "../orchestrator-contracts/orchestrator.tokens";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { BusinessSummarizerService } from "./business-summarizer.service";
import { CustomerSummarizerService } from "./customer-summarizer.service";
import { NeighborhoodSummarizerService } from "./neighborhood-summarizer.service";
import { ServiceSummarizerService } from "./service-summarizer.service";
import { TrendSummarizerService } from "./trend-summarizer.service";
import { CampaignSummarizerService } from "./campaign-summarizer.service";
import { WorkspaceSummarizerService } from "./workspace-summarizer.service";
import type { IntelligenceGap } from "./marketplace-intelligence.evidence";
import type { SummaryKind } from "./marketplace-intelligence.slots";

declare module "../core/jobs/jobs.types" {
  interface IntelligenceJobCatalog {
    /** Rebuild one customer's stored summary, snapshot and feature vector. */
    readonly SummarizeCustomerJob: { readonly customerId: EntityId };
    /** Rebuild one district's summary, features, demand and forecast. */
    readonly SummarizeNeighborhoodJob: { readonly neighborhoodId: EntityId };
    /** Rebuild one marketplace-level service summary. */
    readonly SummarizeServiceJob: { readonly serviceId: EntityId };
    /** Rebuild one business's campaign programme summary. */
    readonly SummarizeCampaignJob: { readonly businessId: EntityId };
    /**
     * Rebuild one workspace summary. Always refuses today — no Workspace
     * model exists — and is scheduled anyway, so the seam is exercised.
     */
    readonly SummarizeWorkspaceJob: { readonly workspaceId: EntityId };
    /** Refresh every tracked trend metric for one subject. */
    readonly RefreshMarketplaceTrendsJob: { readonly subjectEntityId: EntityId };
  }
}

declare module "../core/events/events.types" {
  interface IntelligenceEventCatalog {
    /** One customer's stored summary was rebuilt. */
    readonly CustomerSummaryCompleted: {
      readonly customerId: EntityId;
      readonly summaryUpdatedAt: IsoDateTime;
    };
    /**
     * A marketplace-wide summary was rebuilt.
     *
     * One event for neighborhoods, services, trends, campaigns and demand
     * rather than five: subscribers care that Layer 2 knowledge about a
     * subject moved, and the `kind` tells them which. Five near-identical
     * event types would make every subscriber a five-way switch.
     */
    readonly MarketplaceSummaryCompleted: {
      readonly kind: string;
      readonly subjectId: EntityId;
      readonly summaryUpdatedAt: IsoDateTime;
    };
  }
}

/** Bound on the idempotency ledger, so a long-lived process cannot leak. */
export const MAX_MARKETPLACE_LEDGER_ENTRIES = 500;

/** Every job name this module executes. */
export type MarketplaceJobName =
  | "SummarizeBusinessJob"
  | "RefreshBusinessHealthJob"
  | "SummarizeCustomerJob"
  | "SummarizeNeighborhoodJob"
  | "SummarizeServiceJob"
  | "SummarizeCampaignJob"
  | "SummarizeWorkspaceJob"
  | "RefreshMarketplaceTrendsJob";

export interface MarketplaceJobResult {
  readonly jobId: EntityId;
  readonly name: MarketplaceJobName;
  readonly idempotencyKey: string;
  /** True when this exact job had already run and the result was replayed. */
  readonly deduplicated: boolean;
  /** The entity this job summarized. */
  readonly subjectId: EntityId;
  /** Summary kinds whose stored knowledge actually changed. */
  readonly updatedKinds: readonly SummaryKind[];
  /** Models that refused, with the typed cause and the counts. */
  readonly gaps: readonly IntelligenceGap[];
  /** Built whether or not a publisher exists; empty when nothing changed. */
  readonly events: readonly AnyIntelligenceEvent[];
  readonly published: boolean;
  readonly failure: IntelligenceFailure | null;
}

@Injectable()
export class MarketplaceIntelligenceJobs {
  private readonly logger = new Logger(MarketplaceIntelligenceJobs.name);

  /**
   * In-process idempotency ledger.
   *
   * The honest analogue of what BullMQ will do with `idempotencyKey` once
   * Epic 03.5 lands: a resubmitted job replays its recorded result instead of
   * repeating its side effects. Bounded and FIFO-evicted — a ledger that grows
   * forever would be a slower leak, not a safer one.
   */
  private readonly ledger = new Map<string, MarketplaceJobResult>();

  constructor(
    private readonly business: BusinessSummarizerService,
    private readonly customer: CustomerSummarizerService,
    private readonly neighborhood: NeighborhoodSummarizerService,
    private readonly service: ServiceSummarizerService,
    private readonly trends: TrendSummarizerService,
    private readonly campaign: CampaignSummarizerService,
    private readonly workspace: WorkspaceSummarizerService,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock,
    @Optional() @Inject(INTELLIGENCE_EVENT_PUBLISHER) private readonly publisher?: EventPublisher,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics?: MetricsSink
  ) {}

  /**
   * Rebuilds one business's stored profile and feature vector.
   *
   * The middle of the canonical chain: `BusinessCreated →
   * BusinessSummaryRequested → SummarizeBusinessJob → BusinessSummaryCompleted
   * → KnowledgeGraphUpdated → …`. This layer emits the third link and stops
   * there; announcing a graph update on Layer 3's behalf is how a chain
   * becomes a knot (Epic 05 drew the same line about `MemoryUpdated`).
   */
  summarizeBusiness(job: IntelligenceJob<"SummarizeBusinessJob">): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.businessId, async (businessId) => {
      const result = await this.business.summarize(businessId);

      return {
        updatedKinds: kindsOf(result.writes.map((write) => write.slot.kind), result.writes),
        gaps: result.gaps,
        events: result.changed
          ? [this.businessSummaryCompleted(job, businessId, result.profile?.updatedAt)]
          : [],
        freshness: result.profile ? businessId : null,
        failure: firstFailure(result.writes.map((write) => write.failure))
      };
    });
  }

  /** Recomputes one business's health block and patches the stored profile. */
  refreshBusinessHealth(
    job: IntelligenceJob<"RefreshBusinessHealthJob">
  ): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.businessId, async (businessId) => {
      const result = await this.business.refreshHealth(businessId);

      return {
        updatedKinds: kindsOf(result.writes.map((write) => write.slot.kind), result.writes),
        gaps: result.gaps,
        events: result.changed
          ? [this.businessSummaryCompleted(job, businessId, result.profile?.updatedAt)]
          : [],
        freshness: result.profile ? businessId : null,
        failure: firstFailure(result.writes.map((write) => write.failure))
      };
    });
  }

  /** Rebuilds one customer's summary, memory snapshot and feature vector. */
  summarizeCustomer(job: IntelligenceJob<"SummarizeCustomerJob">): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.customerId, async (customerId) => {
      const result = await this.customer.summarize(customerId);

      return {
        updatedKinds: kindsOf(result.writes.map((write) => write.slot.kind), result.writes),
        gaps: result.gaps,
        events: result.changed
          ? [
              this.event(job, "CustomerSummaryCompleted", customerId, {
                customerId,
                summaryUpdatedAt: result.profile?.updatedAt ?? this.clock.now()
              })
            ]
          : [],
        freshness: result.profile ? customerId : null,
        failure: firstFailure(result.writes.map((write) => write.failure))
      };
    });
  }

  /** Rebuilds one district's summary, features, demand pressure and forecast. */
  summarizeNeighborhood(
    job: IntelligenceJob<"SummarizeNeighborhoodJob">
  ): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.neighborhoodId, async (neighborhoodId) => {
      const result = await this.neighborhood.summarize(neighborhoodId);

      return {
        updatedKinds: kindsOf(result.writes.map((write) => write.slot.kind), result.writes),
        gaps: result.gaps,
        events: result.changed
          ? [this.marketplaceSummaryCompleted(job, "neighborhood", neighborhoodId)]
          : [],
        freshness: result.summary ? neighborhoodId : null,
        failure: firstFailure(result.writes.map((write) => write.failure))
      };
    });
  }

  /** Rebuilds one marketplace-level service summary. */
  summarizeService(job: IntelligenceJob<"SummarizeServiceJob">): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.serviceId, async (serviceId) => {
      const result = await this.service.summarize(serviceId);

      return {
        updatedKinds: result.write && result.changed ? (["service"] as const) : [],
        gaps: result.gaps,
        events: result.changed
          ? [this.marketplaceSummaryCompleted(job, "service", serviceId)]
          : [],
        freshness: result.summary ? serviceId : null,
        failure: result.write?.failure ?? null
      };
    });
  }

  /** Rebuilds one business's campaign programme summary. */
  summarizeCampaign(job: IntelligenceJob<"SummarizeCampaignJob">): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.businessId, async (businessId) => {
      const result = await this.campaign.summarize(businessId);

      return {
        updatedKinds: result.write && result.changed ? (["campaign"] as const) : [],
        gaps: result.gaps,
        events: result.changed
          ? [this.marketplaceSummaryCompleted(job, "campaign", businessId)]
          : [],
        freshness: result.summary ? businessId : null,
        failure: result.write?.failure ?? null
      };
    });
  }

  /**
   * Rebuilds one workspace summary — that is, records that it cannot.
   *
   * Scheduled deliberately even though it always refuses: a seam that is never
   * exercised is a seam nobody notices has rotted, and the gap it returns is
   * the platform's standing, machine-readable statement that workspaces are
   * not yet modelled.
   */
  summarizeWorkspace(job: IntelligenceJob<"SummarizeWorkspaceJob">): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.workspaceId, async (workspaceId) => {
      const result = await this.workspace.summarize(workspaceId);

      return {
        updatedKinds: [],
        gaps: result.gaps,
        events: [],
        freshness: null,
        failure: null
      };
    });
  }

  /** Refreshes every tracked trend metric for one subject. */
  refreshMarketplaceTrends(
    job: IntelligenceJob<"RefreshMarketplaceTrendsJob">
  ): Promise<MarketplaceJobResult> {
    return this.run(job, job.payload.subjectEntityId, async (subjectEntityId) => {
      const result = await this.trends.summarize(subjectEntityId);

      return {
        updatedKinds: result.changed ? (["trend"] as const) : [],
        gaps: result.gaps,
        events: result.changed
          ? [this.marketplaceSummaryCompleted(job, "trend", subjectEntityId)]
          : [],
        freshness: result.trends.length > 0 ? subjectEntityId : null,
        failure: firstFailure(result.writes.map((write) => write.failure))
      };
    });
  }

  // -------------------------------------------------------------------------
  // The shared spine: replay, execute, measure, announce, remember
  // -------------------------------------------------------------------------

  private async run(
    job: IntelligenceJob,
    subjectId: EntityId,
    execute: (subjectId: EntityId) => Promise<{
      readonly updatedKinds: readonly SummaryKind[];
      readonly gaps: readonly IntelligenceGap[];
      readonly events: readonly AnyIntelligenceEvent[];
      /** Subject whose summary freshness to record, when one was produced. */
      readonly freshness: EntityId | null;
      readonly failure: IntelligenceFailure | null;
    }>
  ): Promise<MarketplaceJobResult> {
    const name = job.name as MarketplaceJobName;
    const replayed = this.replay(name, job.idempotencyKey);
    if (replayed) return replayed;

    const startedAt = Date.now();
    const outcome = await execute(subjectId);

    if (outcome.failure) {
      this.record("failure", name, 0, outcome.failure);
    }

    // A gap is not a job failure — it is the job succeeding at saying "not
    // enough evidence". It is measured as a typed cause so a dashboard can see
    // *which* models the marketplace is still too small for, without the job
    // being marked failed and retried into the same answer.
    for (const gap of outcome.gaps) {
      this.record("failure", `${name}.${gap.model}`, 0, gap.failure);
    }

    const published = await this.publishAll(outcome.events);

    if (outcome.freshness) {
      this.recordFreshness(outcome.freshness, 0);
    }

    this.record("execution_time", name, Date.now() - startedAt);

    return this.remember({
      jobId: job.jobId,
      name,
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      subjectId,
      updatedKinds: [...new Set(outcome.updatedKinds)].sort(),
      gaps: outcome.gaps,
      events: outcome.events,
      published,
      failure: outcome.failure
    });
  }

  private businessSummaryCompleted(
    job: IntelligenceJob,
    businessId: EntityId,
    updatedAt: IsoDateTime | undefined
  ): IntelligenceEvent<"BusinessSummaryCompleted"> {
    return this.event(job, "BusinessSummaryCompleted", businessId, {
      businessId,
      summaryUpdatedAt: updatedAt ?? this.clock.now()
    });
  }

  private marketplaceSummaryCompleted(
    job: IntelligenceJob,
    kind: SummaryKind,
    subjectId: EntityId
  ): IntelligenceEvent<"MarketplaceSummaryCompleted"> {
    return this.event(job, "MarketplaceSummaryCompleted", subjectId, {
      kind,
      subjectId,
      summaryUpdatedAt: this.clock.now()
    });
  }

  /** The doc 23 §3 envelope, built the same way for every event this layer emits. */
  private event<TType extends AnyIntelligenceEvent["eventType"]>(
    job: IntelligenceJob,
    eventType: TType,
    aggregateId: EntityId,
    payload: Extract<AnyIntelligenceEvent, { eventType: TType }>["payload"]
  ): IntelligenceEvent<TType> {
    return {
      eventId: this.clock.newId(),
      eventType,
      eventVersion: 1,
      timestamp: this.clock.now(),
      aggregateId,
      correlationId: job.correlationId,
      causationId: job.causationEventId,
      payload
    } as IntelligenceEvent<TType>;
  }

  private async publishAll(events: readonly AnyIntelligenceEvent[]): Promise<boolean> {
    if (events.length === 0) return false;

    if (!this.publisher) {
      // Epic 03.5 owns the bus. Saying so beats silently dropping the chain,
      // and beats inventing a second bus here.
      this.logger.debug(
        `${events.length} intelligence event(s) built with no publisher bound (Epic 03.5)`
      );
      return false;
    }

    for (const event of events) {
      await this.publisher.publish(event);
    }

    return true;
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

  /** Doc 23 §8 names summary freshness explicitly; this is where it is emitted. */
  private recordFreshness(entityId: EntityId, seconds: number): void {
    this.metrics?.record({
      kind: "freshness",
      subject: "summary",
      entityId,
      ageSeconds: seconds,
      at: this.clock.now()
    });
  }

  private replay(name: MarketplaceJobName, idempotencyKey: string): MarketplaceJobResult | null {
    const stored = this.ledger.get(`${name}|${idempotencyKey}`);
    return stored ? { ...stored, deduplicated: true } : null;
  }

  private remember(result: MarketplaceJobResult): MarketplaceJobResult {
    if (this.ledger.size >= MAX_MARKETPLACE_LEDGER_ENTRIES) {
      const oldest = this.ledger.keys().next().value;
      if (oldest) this.ledger.delete(oldest);
    }

    this.ledger.set(`${result.name}|${result.idempotencyKey}`, result);
    return result;
  }
}

/** Kinds whose write actually changed something. */
function kindsOf(
  kinds: readonly SummaryKind[],
  writes: readonly { readonly outcome: string }[]
): readonly SummaryKind[] {
  return kinds.filter((_, index) => writes[index]?.outcome === "written");
}

/** The first typed failure among a set of writes, or null. */
function firstFailure(
  failures: readonly (IntelligenceFailure | null)[]
): IntelligenceFailure | null {
  return failures.find((failure): failure is IntelligenceFailure => failure !== null) ?? null;
}
