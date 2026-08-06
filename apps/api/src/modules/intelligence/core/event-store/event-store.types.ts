/**
 * Layer 0 (core/event-store) — replayable event storage, contracts only.
 *
 * Doc 23 §6: every intelligence event must be replayable so future event
 * sourcing stays possible (pairs with the queued Workspace-timeline
 * recording ADR, now ADR-006). Epic 03 ships no storage — only the shape a
 * store must satisfy, so nothing built on events can accidentally assume a
 * non-replayable bus.
 */
import type { EntityId, IsoDateTime } from "../core.primitives";
import type {
  AnyIntelligenceEvent,
  IntelligenceEventType
} from "../events";

/** An event as persisted: the envelope plus its immutable position in the log. */
export interface StoredEventRecord {
  /** Global, gap-tolerant, strictly increasing position — the replay cursor. */
  readonly sequence: number;
  readonly storedAt: IsoDateTime;
  readonly event: AnyIntelligenceEvent;
}

/** One page of an event stream, cursor-based so replays never load the world. */
export interface EventStreamPage {
  readonly records: readonly StoredEventRecord[];
  /** Cursor for the next page; `null` = end of stream (for now). */
  readonly nextAfterSequence: number | null;
}

/**
 * The event store contract. Append-only by construction: there is no update
 * or delete in this interface, which is the whole replayability guarantee.
 * Reading from sequence 0 IS the replay.
 */
export interface EventStoreContract {
  append(event: AnyIntelligenceEvent): Promise<StoredEventRecord>;
  /** All events about one aggregate, oldest first. */
  readAggregate(aggregateId: EntityId, afterSequence: number, limit: number): Promise<EventStreamPage>;
  /** All events of one type, oldest first. */
  readByType(eventType: IntelligenceEventType, afterSequence: number, limit: number): Promise<EventStreamPage>;
  /** The full log, oldest first — the replay primitive. */
  readAll(afterSequence: number, limit: number): Promise<EventStreamPage>;
}
