/**
 * Layer 2 (Marketplace Intelligence) — what makes summaries update *by
 * themselves*.
 *
 * The epic's requirement is that summarizers "update automatically on new
 * marketplace data via event-triggered jobs". This service is that mechanism,
 * and it is deliberately two mechanisms rather than one, because marketplace
 * data changes in two different ways:
 *
 * 1. **Events** — something happened to a known subject. A business was
 *    created, its reviews changed. The chain is doc 23 §2's, unchanged:
 *    `BusinessCreated → BusinessSummaryRequested → SummarizeBusinessJob →
 *    BusinessSummaryCompleted`.
 * 2. **The nightly pass** — time went by. Trends go stale in six hours whether
 *    or not anything happened, and a subject that has *never* been summarized
 *    emits no event announcing its own absence.
 *
 * Both produce the same thing: `IntelligenceJob`s handed to the
 * `JobExecutor`. Nothing here calls a summarizer directly, because doc 23 §5
 * says intelligence is never invoked directly and a "trigger" that bypassed
 * the executor would be exactly that.
 *
 * The executor, publisher and subscriber are all `@Optional()` — Epic 03.5
 * owns the bus and has not shipped. Until it does, `plan()` still returns the
 * jobs it would have enqueued, so the schedule is testable and reviewable
 * today and turns on when 03.5 binds the tokens, with no change here.
 */
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type {
  EntityId,
  EventPublisher,
  EventSubscriber,
  IntelligenceEvent,
  IntelligenceJob,
  IntelligenceJobName,
  IsoDateTime,
  JobExecutor
} from "../core";
import {
  INTELLIGENCE_EVENT_PUBLISHER,
  INTELLIGENCE_EVENT_SUBSCRIBER,
  INTELLIGENCE_JOB_EXECUTOR
} from "../orchestrator-contracts/orchestrator.tokens";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository } from "./summary.repository";
import type { SummaryKind } from "./marketplace-intelligence.slots";

/** Ceiling on jobs one nightly plan enqueues, so a pass cannot run away. */
export const MAX_PLANNED_JOBS = 400;

/** Which job refreshes which summary kind. */
export const JOB_FOR_KIND = {
  business: "SummarizeBusinessJob",
  business_features: "SummarizeBusinessJob",
  customer: "SummarizeCustomerJob",
  customer_features: "SummarizeCustomerJob",
  neighborhood: "SummarizeNeighborhoodJob",
  neighborhood_features: "SummarizeNeighborhoodJob",
  demand: "SummarizeNeighborhoodJob",
  demand_prediction: "SummarizeNeighborhoodJob",
  service: "SummarizeServiceJob",
  campaign: "SummarizeCampaignJob",
  workspace: "SummarizeWorkspaceJob",
  trend: "RefreshMarketplaceTrendsJob"
} as const satisfies Readonly<Record<SummaryKind, IntelligenceJobName>>;

/** One planned unit of work, before it becomes an `IntelligenceJob`. */
export interface PlannedJob {
  readonly name: IntelligenceJobName;
  readonly subjectId: EntityId;
  /** Why it is planned — an event, or the schedule. */
  readonly reason: "created" | "reviews_changed" | "nightly_refresh" | "never_summarized" | "manual";
}

/** The result of asking the executor to run a plan. */
export interface TriggerResult {
  readonly planned: readonly PlannedJob[];
  readonly jobs: readonly IntelligenceJob[];
  /** True when a `JobExecutor` was bound and accepted them. */
  readonly enqueued: boolean;
}

@Injectable()
export class MarketplaceIntelligenceTriggers {
  private readonly logger = new Logger(MarketplaceIntelligenceTriggers.name);

  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock,
    @Optional() @Inject(INTELLIGENCE_JOB_EXECUTOR) private readonly executor?: JobExecutor,
    @Optional() @Inject(INTELLIGENCE_EVENT_PUBLISHER) private readonly publisher?: EventPublisher,
    @Optional() @Inject(INTELLIGENCE_EVENT_SUBSCRIBER) private readonly subscriber?: EventSubscriber
  ) {}

  /**
   * Wires this layer to the event bus.
   *
   * Called by whoever owns startup once Epic 03.5 binds a subscriber. Without
   * one it is a logged no-op rather than a throw: a module that refuses to
   * start because an unshipped epic has not shipped is a module nobody can
   * deploy.
   */
  async register(): Promise<void> {
    if (!this.subscriber) {
      this.logger.debug("no event subscriber bound (Epic 03.5) — triggers run on schedule only");
      return;
    }

    await this.subscriber.subscribe("BusinessCreated", async (event) => {
      await this.onBusinessCreated(event);
    });

    await this.subscriber.subscribe("BusinessSummaryRequested", async (event) => {
      await this.enqueue(
        [{ name: "SummarizeBusinessJob", subjectId: event.payload.businessId, reason: event.payload.trigger === "manual" ? "manual" : "nightly_refresh" }],
        event.correlationId,
        event.eventId
      );
    });
  }

  /**
   * A business entered the platform.
   *
   * Publishes `BusinessSummaryRequested` *and* enqueues the job. Publishing
   * alone would rely on this service's own subscription to close the loop,
   * which works only when a bus exists; enqueueing alone would skip the link
   * doc 23 §2 names. Doing both keeps the announced chain honest whether or
   * not 03.5 has shipped — and the job's `idempotencyKey` means the two paths
   * cannot summarize the same business twice.
   */
  async onBusinessCreated(event: IntelligenceEvent<"BusinessCreated">): Promise<TriggerResult> {
    const requested = this.businessSummaryRequested(event, "created");
    await this.publish(requested);

    return this.enqueue(
      [{ name: "SummarizeBusinessJob", subjectId: event.payload.businessId, reason: "created" }],
      event.correlationId,
      requested.eventId
    );
  }

  /**
   * New reviews landed for a business.
   *
   * The most common reason a stored profile is wrong: strengths, weaknesses,
   * response rate and review freshness all move when a review arrives, and
   * `BusinessSummaryRequested` has a `reviews_changed` trigger precisely for
   * this.
   */
  async onReviewsChanged(businessId: EntityId, correlationId?: EntityId): Promise<TriggerResult> {
    const correlation = correlationId ?? this.clock.newId();
    const requested = this.requestedEvent(businessId, correlation, "reviews_changed");
    await this.publish(requested);

    return this.enqueue(
      [{ name: "SummarizeBusinessJob", subjectId: businessId, reason: "reviews_changed" }],
      correlation,
      requested.eventId
    );
  }

  /** A booking reached a terminal state — health moved, the profile did not. */
  async onBookingSettled(businessId: EntityId, correlationId?: EntityId): Promise<TriggerResult> {
    return this.enqueue(
      [{ name: "RefreshBusinessHealthJob", subjectId: businessId, reason: "nightly_refresh" }],
      correlationId ?? this.clock.newId(),
      null
    );
  }

  /** A completed experience — the moment doc 22 names for a customer rebuild. */
  async onCustomerActivity(customerId: EntityId, correlationId?: EntityId): Promise<TriggerResult> {
    return this.enqueue(
      [{ name: "SummarizeCustomerJob", subjectId: customerId, reason: "nightly_refresh" }],
      correlationId ?? this.clock.newId(),
      null
    );
  }

  /**
   * The scheduled pass: everything stale, plus everything never summarized.
   *
   * Two halves, because a store keyed by slot has no row for a subject nobody
   * has ever summarized — so "what is stale?" and "what is missing?" are
   * different questions and only the first one the store can answer.
   */
  async plan(now: IsoDateTime = this.clock.now()): Promise<readonly PlannedJob[]> {
    const planned = new Map<string, PlannedJob>();

    const add = (job: PlannedJob) => {
      const key = `${job.name}|${job.subjectId}`;
      if (!planned.has(key)) planned.set(key, job);
    };

    // Half one — subjects with a stored summary that has aged past its TTL.
    for (const [kind, name] of Object.entries(JOB_FOR_KIND) as [SummaryKind, IntelligenceJobName][]) {
      const stale = await this.summaries.staleSlots(kind, now);
      for (const slot of stale) {
        add({ name, subjectId: slot.subjectId, reason: "nightly_refresh" });
      }
    }

    // Half two — subjects that exist in Layer 1 and have never been summarized.
    const [businessIds, neighborhoodIds, serviceIds, customerIds] = await Promise.all([
      this.projection.businessIds(),
      this.projection.neighborhoodIds(),
      this.projection.serviceIds(),
      this.projection.customerSubjectIds()
    ]);

    for (const businessId of businessIds) {
      add({ name: "SummarizeBusinessJob", subjectId: businessId, reason: "never_summarized" });
      add({ name: "SummarizeCampaignJob", subjectId: businessId, reason: "never_summarized" });
      add({
        name: "RefreshMarketplaceTrendsJob",
        subjectId: businessId,
        reason: "never_summarized"
      });
    }

    for (const neighborhood of neighborhoodIds) {
      add({ name: "SummarizeNeighborhoodJob", subjectId: neighborhood, reason: "never_summarized" });
    }

    for (const serviceId of serviceIds) {
      add({ name: "SummarizeServiceJob", subjectId: serviceId, reason: "never_summarized" });
    }

    for (const customerId of customerIds) {
      add({ name: "SummarizeCustomerJob", subjectId: customerId, reason: "never_summarized" });
    }

    return [...planned.values()].slice(0, MAX_PLANNED_JOBS);
  }

  /** Plans the scheduled pass and hands it to the executor. */
  async nightly(now: IsoDateTime = this.clock.now()): Promise<TriggerResult> {
    const planned = await this.plan(now);
    return this.enqueue(planned, this.clock.newId(), null);
  }

  /**
   * Turns planned work into typed jobs and enqueues them.
   *
   * The `idempotencyKey` is `name:subject:day`. Deliberately day-scoped: two
   * reviews landing an hour apart should produce one summarization, and a
   * nightly pass following an event-triggered run for the same business should
   * be deduplicated rather than repeat it. A key that included the timestamp
   * would make every submission unique and idempotency decorative.
   */
  async enqueue(
    planned: readonly PlannedJob[],
    correlationId: EntityId,
    causationEventId: EntityId | null
  ): Promise<TriggerResult> {
    const requestedAt = this.clock.now();
    const day = requestedAt.slice(0, 10);

    const jobs: IntelligenceJob[] = planned.map((plan) => ({
      jobId: this.clock.newId(),
      name: plan.name,
      payload: payloadFor(plan.name, plan.subjectId),
      idempotencyKey: `${plan.name}:${plan.subjectId}:${day}`,
      correlationId,
      causationEventId,
      requestedAt
    })) as IntelligenceJob[];

    if (!this.executor) {
      this.logger.debug(
        `${jobs.length} intelligence job(s) planned with no executor bound (Epic 03.5)`
      );
      return { planned, jobs, enqueued: false };
    }

    for (const job of jobs) {
      await this.executor.enqueue(job);
    }

    return { planned, jobs, enqueued: true };
  }

  private businessSummaryRequested(
    event: IntelligenceEvent<"BusinessCreated">,
    trigger: "created" | "reviews_changed" | "nightly_refresh" | "manual"
  ): IntelligenceEvent<"BusinessSummaryRequested"> {
    return this.requestedEvent(
      event.payload.businessId,
      event.correlationId,
      trigger,
      event.eventId
    );
  }

  private requestedEvent(
    businessId: EntityId,
    correlationId: EntityId,
    trigger: "created" | "reviews_changed" | "nightly_refresh" | "manual",
    causationId: EntityId | null = null
  ): IntelligenceEvent<"BusinessSummaryRequested"> {
    return {
      eventId: this.clock.newId(),
      eventType: "BusinessSummaryRequested",
      eventVersion: 1,
      timestamp: this.clock.now(),
      aggregateId: businessId,
      correlationId,
      causationId,
      payload: { businessId, trigger }
    };
  }

  private async publish(event: IntelligenceEvent<"BusinessSummaryRequested">): Promise<boolean> {
    if (!this.publisher) return false;

    await this.publisher.publish(event);
    return true;
  }
}

/**
 * The payload each job name expects, from one subject id.
 *
 * The catalog types payloads per name, and every job in this module takes
 * exactly one id — so this is the single place the id is given its name, and
 * the `satisfies` on `JOB_FOR_KIND` above is what keeps the two lists aligned.
 */
function payloadFor(name: IntelligenceJobName, subjectId: EntityId): Record<string, unknown> {
  switch (name) {
    case "SummarizeBusinessJob":
    case "RefreshBusinessHealthJob":
    case "SummarizeCampaignJob":
      return { businessId: subjectId };
    case "SummarizeCustomerJob":
      return { customerId: subjectId };
    case "SummarizeNeighborhoodJob":
      return { neighborhoodId: subjectId };
    case "SummarizeServiceJob":
      return { serviceId: subjectId };
    case "SummarizeWorkspaceJob":
      return { workspaceId: subjectId };
    case "RefreshMarketplaceTrendsJob":
      return { subjectEntityId: subjectId };
    default:
      return { entityIds: [subjectId] };
  }
}
