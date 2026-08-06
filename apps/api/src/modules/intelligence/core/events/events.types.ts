/**
 * Layer 0 (core/events) — the event abstraction of the Intelligence Platform.
 *
 * Doc 23 §1–3: in-process domain events are the approved temporary bus, but
 * NO module may depend on EventEmitter (or BullMQ, or Kafka) directly —
 * everything speaks these interfaces, so the transport is swappable without
 * touching business logic. Intelligence chains are async-only, always:
 * `publish` and every handler return Promises even while the whole chain
 * runs in one process, so moving a step out of process changes nothing.
 */
import type { EntityId, IsoDateTime, MemoryTier } from "../core.primitives";

/**
 * The versioned envelope of every domain event (doc 23 §3, field-for-field).
 * Future migrations depend on this envelope: `eventVersion` gates payload
 * migrations, `correlationId` ties a whole chain together, and `causationId`
 * names the event that directly caused this one.
 */
export interface DomainEvent<TType extends string, TPayload extends object> {
  readonly eventId: EntityId;
  readonly eventType: TType;
  /** Payload schema version, starting at 1; bump on breaking payload change. */
  readonly eventVersion: number;
  readonly timestamp: IsoDateTime;
  /** The entity this event is about (business, customer, workspace…). */
  readonly aggregateId: EntityId;
  /** Shared by every event of one intelligence chain. */
  readonly correlationId: EntityId;
  /** The event that caused this one; `null` only for chain roots. */
  readonly causationId: EntityId | null;
  readonly payload: TPayload;
}

/**
 * The typed event catalog of the canonical intelligence chain (doc 23 §2):
 * BusinessCreated → BusinessSummaryRequested → BusinessSummaryCompleted →
 * KnowledgeGraphUpdated → MemoryUpdated → RecommendationsInvalidated.
 *
 * An interface so future chains extend it via declaration merging — the same
 * open-registry pattern as `RelationshipKindRegistry`. Payloads are ids and
 * outcomes only: events announce that knowledge changed, they never carry
 * the knowledge itself (subscribers query the owning layer).
 */
export interface IntelligenceEventCatalog {
  /** Chain root: a business entered the platform. */
  readonly BusinessCreated: { readonly businessId: EntityId };
  /** The pipeline decided a summary (re)build is due. */
  readonly BusinessSummaryRequested: {
    readonly businessId: EntityId;
    readonly trigger: "created" | "reviews_changed" | "nightly_refresh" | "manual";
  };
  /** The stored AI profile was rebuilt (doc 22: stored summaries, not regeneration). */
  readonly BusinessSummaryCompleted: {
    readonly businessId: EntityId;
    readonly summaryUpdatedAt: IsoDateTime;
  };
  /** Graph nodes/edges changed as a consequence of new knowledge. */
  readonly KnowledgeGraphUpdated: { readonly entityIds: readonly EntityId[] };
  /** Memory tiers were refreshed from the new knowledge. */
  readonly MemoryUpdated: {
    readonly customerId: EntityId | null;
    readonly updatedTiers: readonly MemoryTier[];
  };
  /** Cached/derived recommendations downstream are now stale. */
  readonly RecommendationsInvalidated: {
    readonly customerId: EntityId | null;
    readonly businessIds: readonly EntityId[];
    readonly cause: "knowledge_changed" | "memory_changed" | "policy_changed" | "availability_changed";
  };
}

/** The open set of intelligence event types. */
export type IntelligenceEventType = keyof IntelligenceEventCatalog;

/** A fully-typed event of one catalog entry. */
export type IntelligenceEvent<TType extends IntelligenceEventType = IntelligenceEventType> =
  DomainEvent<TType, IntelligenceEventCatalog[TType]>;

/** Any event of the intelligence catalog. */
export type AnyIntelligenceEvent = {
  [TType in IntelligenceEventType]: IntelligenceEvent<TType>;
}[IntelligenceEventType];

/**
 * Command API — how a module announces that knowledge changed. Async-only by
 * signature; there is no synchronous publish and never will be (doc 23 §2).
 */
export interface EventPublisher {
  publish<TType extends IntelligenceEventType>(event: IntelligenceEvent<TType>): Promise<void>;
}

/** An async handler for one event type. Must be idempotent (doc 23 §4). */
export type IntelligenceEventHandler<TType extends IntelligenceEventType> = (
  event: IntelligenceEvent<TType>
) => Promise<void>;

/** Handle for cancelling a subscription (module shutdown, test teardown). */
export interface EventSubscription {
  unsubscribe(): Promise<void>;
}

/**
 * Command API — how a module reacts to knowledge changing. Implementations
 * wrap EventEmitter today and BullMQ/Kafka later; subscribers never know.
 */
export interface EventSubscriber {
  subscribe<TType extends IntelligenceEventType>(
    eventType: TType,
    handler: IntelligenceEventHandler<TType>
  ): Promise<EventSubscription>;
}
