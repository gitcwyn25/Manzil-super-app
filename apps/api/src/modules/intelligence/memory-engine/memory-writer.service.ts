/**
 * Layer 4 (Memory Engine) — the write path, and the only place memory
 * announces itself.
 *
 * Doc 23 §2–3: knowledge changing is an *event*, published through the
 * `EventPublisher` seam in the versioned envelope, carrying ids and never
 * knowledge. Every mutation in this module — a job refreshing preferences, a
 * caller remembering a mission, a completed mission being destroyed — passes
 * through here, so there is exactly one implementation of "memory changed, say
 * so" rather than one per caller.
 *
 * This layer emits `MemoryUpdated` only. `RecommendationsInvalidated` is the
 * next link in the canonical chain, and it belongs to the layer that owns
 * recommendations: a subscriber decides that a memory change staled *its*
 * cache. Announcing on another layer's behalf is how a chain becomes a knot.
 *
 * The publisher and the metrics sink are `@Optional()` — Epic 03.5 owns the
 * in-process bus and has not shipped. Events are still *built* on every write
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
  MemoryTier,
  MetricsSink
} from "../core";
import {
  INTELLIGENCE_EVENT_PUBLISHER,
  INTELLIGENCE_METRICS_SINK
} from "../orchestrator-contracts/orchestrator.tokens";
import { MEMORY_ENGINE_CLOCK } from "./memory-engine.tokens";
import type { MemoryClock } from "./memory-engine.clock";
import { MemoryRepository, type MemoryWriteResult } from "./memory.repository";
import { isCustomerScoped, type MemoryScope } from "./memory.scope";
import type { AnyMemoryObject } from "./memory.tiers";

/** Ties a write to the chain that caused it (doc 23 §3). */
export interface MemoryWriteContext {
  readonly correlationId: EntityId;
  readonly causationEventId: EntityId | null;
  /** The customer the change is about; null for market-wide memory. */
  readonly customerId: EntityId | null;
}

/** A write, its announcement, and whether the announcement went anywhere. */
export interface MemoryWriteAnnouncement {
  readonly result: MemoryWriteResult;
  readonly events: readonly AnyIntelligenceEvent[];
  readonly published: boolean;
}

/** A deletion and its announcement. */
export interface MemoryForgetAnnouncement {
  readonly forgotten: boolean;
  readonly events: readonly AnyIntelligenceEvent[];
  readonly published: boolean;
}

/** `aggregateId` when a change is about the market rather than one person. */
export const MEMORY_ENGINE_AGGREGATE_ID = "memory-engine";

@Injectable()
export class MemoryWriterService {
  private readonly logger = new Logger(MemoryWriterService.name);

  constructor(
    private readonly repository: MemoryRepository,
    @Inject(MEMORY_ENGINE_CLOCK) private readonly clock: MemoryClock,
    @Optional() @Inject(INTELLIGENCE_EVENT_PUBLISHER) private readonly publisher?: EventPublisher,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics?: MetricsSink
  ) {}

  /**
   * Records structured knowledge into its tier and announces the change.
   *
   * Nothing is announced when nothing changed: a redelivered write that
   * resolves to the memory already held returns `kept_existing`, publishes no
   * event, and leaves every subscriber's cache alone. An announcement is a
   * claim that the world moved.
   */
  async remember(
    memory: AnyMemoryObject,
    context: MemoryWriteContext
  ): Promise<MemoryWriteAnnouncement> {
    const result = await this.repository.write(memory);

    if (result.failure) this.recordFailure("MemoryEngine.remember", result.failure);

    if (result.outcome !== "written") {
      return { result, events: [], published: false };
    }

    const events = [this.memoryUpdated(context, [memory.tier])];
    return { result, events, published: await this.publishAll(events) };
  }

  /** Destroys one slot and announces it, when something was actually there. */
  async forget(scope: MemoryScope, context: MemoryWriteContext): Promise<MemoryForgetAnnouncement> {
    const forgotten = await this.repository.forget(scope);
    if (!forgotten) return { forgotten, events: [], published: false };

    const events = [this.memoryUpdated(context, [scope.tier])];
    return { forgotten, events, published: await this.publishAll(events) };
  }

  /**
   * Announces tiers that changed without this service writing them — the
   * expiry sweep, which removes memory rather than replacing it.
   */
  async announce(
    tiers: readonly MemoryTier[],
    context: MemoryWriteContext
  ): Promise<{ readonly events: readonly AnyIntelligenceEvent[]; readonly published: boolean }> {
    if (tiers.length === 0) return { events: [], published: false };

    const events = [this.memoryUpdated(context, tiers)];
    return { events, published: await this.publishAll(events) };
  }

  /** The doc 23 §3 envelope for a memory change. */
  memoryUpdated(
    context: MemoryWriteContext,
    tiers: readonly MemoryTier[]
  ): IntelligenceEvent<"MemoryUpdated"> {
    const updatedTiers = [...new Set(tiers)].sort();

    return {
      eventId: this.clock.newId(),
      eventType: "MemoryUpdated",
      eventVersion: 1,
      timestamp: this.clock.now(),
      // A change to customer-scoped memory is about that customer; a change to
      // market-wide memory is about the engine itself, because no customer
      // owns it.
      aggregateId:
        context.customerId && updatedTiers.some((tier) => isCustomerScoped(tier))
          ? context.customerId
          : MEMORY_ENGINE_AGGREGATE_ID,
      correlationId: context.correlationId,
      causationId: context.causationEventId,
      payload: { customerId: context.customerId, updatedTiers }
    };
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

  private recordFailure(operation: string, failure: IntelligenceFailure): void {
    this.metrics?.record({
      kind: "failure",
      operation,
      errorKind: failure.error.kind,
      at: this.clock.now()
    });
  }
}
