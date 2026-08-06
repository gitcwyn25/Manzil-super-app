/**
 * Layer 3 (Knowledge Graph) — the two graph jobs.
 *
 * Doc 23 §5 is binding: intelligence services are never called directly,
 * everything is a Job. `RebuildKnowledgeGraphJob` and `InferRelationshipsJob`
 * are the only ways the graph changes, and both:
 *
 * - are **idempotent** (§4) — same name, same payload, same
 *   `idempotencyKey` returns the identical result, event ids included, and
 *   performs its side effects once;
 * - **announce** rather than deliver (§2, §3) — a `KnowledgeGraphUpdated`
 *   envelope carrying ids, never knowledge, published through the
 *   `EventPublisher` seam;
 * - are **measured** (§8) — execution time always, typed failure cause when
 *   something goes wrong.
 *
 * The publisher and the metrics sink are `@Optional()`: Epic 03.5 owns the
 * in-process bus and has not shipped, so nothing binds those tokens yet.
 * Events are still *built* on every run and returned in the result, so the
 * chain is exercised and asserted today, and binding 03.5's publisher turns
 * it on with no change here.
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
import { GraphCacheService } from "./graph-cache.service";
import { GraphEntityService } from "./graph-entity.service";
import { GraphProjectionRepository } from "./graph-projection.repository";
import type { GraphRelationshipRecord, GraphRelationshipStore } from "./graph-relationship.store";
import { graphId, parseGraphId, type ParsedGraphId } from "./knowledge-graph.ids";
import {
  customerIdentityKey,
  matchServiceId,
  type BookingProjectionRow,
  type BusinessPackageRow,
  type CustomerProjectionRow,
  type CustomerVisitProjectionRow
} from "./knowledge-graph.projection";
import { INFERENCE_SOURCE } from "./knowledge-graph.relationships";
import { GRAPH_RELATIONSHIP_STORE, KNOWLEDGE_GRAPH_CLOCK } from "./knowledge-graph.tokens";

/**
 * Time and identity as a dependency.
 *
 * Not a testing nicety: "the same job twice yields the identical result" is
 * only assertable if the timestamps and event ids in that result are not
 * minted from ambient globals.
 */
export interface GraphClock {
  now(): IsoDateTime;
  newId(): EntityId;
}

@Injectable()
export class SystemGraphClock implements GraphClock {
  now(): IsoDateTime {
    return new Date().toISOString();
  }

  newId(): EntityId {
    // `randomUUID` via require-free global: Node 22 exposes Web Crypto.
    return globalThis.crypto.randomUUID();
  }
}

/** `aggregateId` when an event is about the graph rather than one node. */
export const KNOWLEDGE_GRAPH_AGGREGATE_ID = "knowledge-graph";

/** Nodes re-read after an invalidation so the next reader finds a warm cache. */
export const MAX_WARMED_ENTITIES = 50;

/**
 * Shared customers at which an inferred edge stops gaining confidence.
 *
 * A transparent linear ramp, deliberately not a model: one shared customer is
 * weak evidence, ten is as strong as this signal gets.
 */
export const INFERENCE_SATURATION = 10;

/**
 * Ceiling on inferred confidence.
 *
 * Below 1.0 on purpose — certainty is reserved for projections, which restate
 * rows that exist. An inference is always a claim about the world, and the
 * ranking and trust layers read the difference.
 */
export const MAX_INFERRED_CONFIDENCE = 0.9;

/** Bound on the idempotency ledger, so a long-lived process cannot leak. */
export const MAX_LEDGER_ENTRIES = 500;

export interface GraphJobResult {
  readonly jobId: EntityId;
  readonly name: "RebuildKnowledgeGraphJob" | "InferRelationshipsJob";
  readonly idempotencyKey: string;
  /** True when this exact job had already run and the result was replayed. */
  readonly deduplicated: boolean;
  /** Nodes the job touched — the payload of the announced event. */
  readonly entityIds: readonly EntityId[];
  /** Edges the job derived (inference only). */
  readonly edges: readonly GraphRelationshipRecord[];
  /** Built whether or not a publisher exists; empty when nothing changed. */
  readonly events: readonly AnyIntelligenceEvent[];
  readonly published: boolean;
  readonly failure: IntelligenceFailure | null;
}

/** Linear confidence ramp, two decimals, capped below certainty. */
export function inferenceConfidence(coOccurrences: number): number {
  const raw = Math.min(MAX_INFERRED_CONFIDENCE, coOccurrences / INFERENCE_SATURATION);
  return Math.round(raw * 100) / 100;
}

/** Unordered pair key: the same two ids always produce the same edge. */
function pairKey(left: string, right: string): [string, string] {
  return left < right ? [left, right] : [right, left];
}

function countPairs(setsByIdentity: ReadonlyMap<string, ReadonlySet<string>>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const members of setsByIdentity.values()) {
    const sorted = [...members].sort();

    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const key = `${sorted[i]}|${sorted[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return counts;
}

export interface CoOccurrenceInput {
  readonly customers: readonly CustomerProjectionRow[];
  readonly visits: readonly CustomerVisitProjectionRow[];
  readonly bookings: readonly BookingProjectionRow[];
  readonly packagesByBusiness: ReadonlyMap<string, readonly BusinessPackageRow[]>;
  /** Only pairs touching one of these businesses are emitted. */
  readonly scopeBusinessIds: ReadonlySet<string>;
}

/**
 * Business ↔ Business, from customers who visited both.
 *
 * The identity join is `customerIdentityKey` — account id when linked, phone
 * otherwise — because `Customer` rows are business-scoped, so "the same
 * person at two providers" is two rows and no foreign key. Emitted once per
 * unordered pair, from the lexicographically smaller node, so a rebuild
 * converges instead of oscillating between two directions of one fact.
 */
export function inferCoVisitEdges(input: CoOccurrenceInput): readonly GraphRelationshipRecord[] {
  const identityByCustomer = new Map(
    input.customers.map((customer) => [customer.id, customerIdentityKey(customer)])
  );

  const businessesByIdentity = new Map<string, Set<string>>();
  for (const visit of input.visits) {
    const identity = identityByCustomer.get(visit.customerId);
    if (!identity) continue;

    const bucket = businessesByIdentity.get(identity);
    if (bucket) {
      bucket.add(visit.businessId);
    } else {
      businessesByIdentity.set(identity, new Set([visit.businessId]));
    }
  }

  return [...countPairs(businessesByIdentity).entries()]
    .map(([key, count]) => {
      const [left, right] = key.split("|") as [string, string];
      return { left, right, count };
    })
    .filter((pair) => input.scopeBusinessIds.has(pair.left) || input.scopeBusinessIds.has(pair.right))
    .sort((a, b) => a.left.localeCompare(b.left) || a.right.localeCompare(b.right))
    .map((pair) => {
      const [from, to] = pairKey(pair.left, pair.right);
      return {
        kind: "recommended_with" as const,
        fromId: graphId("business", from),
        toId: graphId("business", to),
        attributes: { coOccurrenceCount: pair.count },
        origin: "inferred" as const,
        source: INFERENCE_SOURCE,
        confidence: inferenceConfidence(pair.count)
      };
    });
}

/**
 * Service ↔ Service, from services the same person booked.
 *
 * Bookings carry a free-text service name, so a booking joins a service only
 * when its name matches an active package of the same business — the same
 * rule the projection uses, so inference and projection agree about what a
 * booking bought.
 */
export function inferCoBookingEdges(input: CoOccurrenceInput): readonly GraphRelationshipRecord[] {
  const identityByCustomer = new Map(
    input.customers.map((customer) => [customer.id, customerIdentityKey(customer)])
  );

  const servicesByIdentity = new Map<string, Set<string>>();
  const inScope = new Set<string>();

  for (const booking of input.bookings) {
    if (!booking.customerId) continue;

    const identity = identityByCustomer.get(booking.customerId);
    if (!identity) continue;

    const serviceId = matchServiceId(
      booking,
      input.packagesByBusiness.get(booking.businessId) ?? []
    );
    if (!serviceId) continue;

    if (input.scopeBusinessIds.has(booking.businessId)) {
      inScope.add(serviceId);
    }

    const bucket = servicesByIdentity.get(identity);
    if (bucket) {
      bucket.add(serviceId);
    } else {
      servicesByIdentity.set(identity, new Set([serviceId]));
    }
  }

  return [...countPairs(servicesByIdentity).entries()]
    .map(([key, count]) => {
      const [left, right] = key.split("|") as [string, string];
      return { left, right, count };
    })
    .filter((pair) => inScope.has(pair.left) || inScope.has(pair.right))
    .sort((a, b) => a.left.localeCompare(b.left) || a.right.localeCompare(b.right))
    .map((pair) => {
      const [from, to] = pairKey(pair.left, pair.right);
      return {
        kind: "booked_together" as const,
        fromId: graphId("service", from),
        toId: graphId("service", to),
        attributes: { coBookingCount: pair.count },
        origin: "inferred" as const,
        source: INFERENCE_SOURCE,
        confidence: inferenceConfidence(pair.count)
      };
    });
}

@Injectable()
export class KnowledgeGraphJobs {
  private readonly logger = new Logger(KnowledgeGraphJobs.name);

  /**
   * In-process idempotency ledger.
   *
   * The honest analogue of what BullMQ will do with `idempotencyKey` once
   * Epic 03.5 lands: a resubmitted job replays its recorded result instead of
   * repeating its side effects. Bounded and FIFO-evicted — a ledger that
   * grows forever would be a slower leak, not a safer one.
   */
  private readonly ledger = new Map<string, GraphJobResult>();

  constructor(
    private readonly projection: GraphProjectionRepository,
    private readonly entities: GraphEntityService,
    private readonly cache: GraphCacheService,
    @Inject(GRAPH_RELATIONSHIP_STORE) private readonly store: GraphRelationshipStore,
    @Inject(KNOWLEDGE_GRAPH_CLOCK) private readonly clock: GraphClock,
    @Optional() @Inject(INTELLIGENCE_EVENT_PUBLISHER) private readonly publisher?: EventPublisher,
    @Optional() @Inject(INTELLIGENCE_METRICS_SINK) private readonly metrics?: MetricsSink
  ) {}

  /**
   * Rebuilds graph knowledge for a scope.
   *
   * "Rebuild" is deliberately cheap: nodes are projections of live rows, so
   * there is nothing to recompute and store — what ages is the cache. The job
   * drops it, warms the scoped nodes, and announces the change. That is also
   * why re-running converges: the second run recomputes the same projection
   * from the same rows.
   */
  async rebuild(job: IntelligenceJob<"RebuildKnowledgeGraphJob">): Promise<GraphJobResult> {
    const replayed = this.replay(job.name, job.idempotencyKey);
    if (replayed) return replayed;

    const startedAt = Date.now();

    const entityIds =
      job.payload.scope === "full"
        ? await this.projection.businessGraphIds()
        : [...job.payload.entityIds];

    await this.cache.invalidate();

    // Warming is bounded: a full rebuild must not turn into a scan of the
    // marketplace on the request path that triggered it.
    for (const id of entityIds.slice(0, MAX_WARMED_ENTITIES)) {
      await this.entities.entity(id);
    }

    const events = entityIds.length > 0 ? [this.graphUpdatedEvent(job, entityIds)] : [];
    const published = await this.publishAll(events);

    this.record("execution_time", job.name, Date.now() - startedAt);

    return this.remember({
      jobId: job.jobId,
      name: job.name,
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      entityIds,
      edges: [],
      events,
      published,
      failure: null
    });
  }

  /**
   * Derives behavioural edges and tries to store them.
   *
   * Pure derivation, so re-running is free of side effects beyond the upsert
   * — which is itself keyed on `(kind, from, to)`. Until M1 applies the
   * `GraphRelationship` migration the store refuses the write; the job then
   * reports `tool_unavailable`, publishes nothing (nothing changed), and
   * still returns the edges it derived, so the derivation is observable and
   * testable before its storage exists.
   */
  async inferRelationships(job: IntelligenceJob<"InferRelationshipsJob">): Promise<GraphJobResult> {
    const replayed = this.replay(job.name, job.idempotencyKey);
    if (replayed) return replayed;

    const startedAt = Date.now();
    const businessIds = job.payload.entityIds
      .map((id) => parseGraphId(id))
      .filter((parsed): parsed is ParsedGraphId => parsed !== null && parsed.type === "business")
      .map((parsed) => parsed.sourceId);

    const edges = await this.deriveEdges(businessIds);
    const outcome = edges.length > 0 ? await this.store.persist(edges) : ({ persisted: true, written: 0 } as const);

    let events: AnyIntelligenceEvent[] = [];
    let published = false;
    let failure: IntelligenceFailure | null = null;

    if (outcome.persisted) {
      if (outcome.written > 0) {
        await this.cache.invalidate();
        events = [this.graphUpdatedEvent(job, touchedIds(edges))];
        published = await this.publishAll(events);
      }
    } else {
      failure = outcome.failure;
      this.record("failure", job.name, 0, failure);
      this.logger.warn(
        `InferRelationshipsJob derived ${edges.length} edge(s) with nowhere to store them ` +
          `(${failure.error.kind}) — projection-only mode, gated on M1`
      );
    }

    this.record("execution_time", job.name, Date.now() - startedAt);

    return this.remember({
      jobId: job.jobId,
      name: job.name,
      idempotencyKey: job.idempotencyKey,
      deduplicated: false,
      entityIds: touchedIds(edges),
      edges,
      events,
      published,
      failure
    });
  }

  /** The inference pipeline, from business scope to edges. */
  private async deriveEdges(businessIds: readonly string[]): Promise<readonly GraphRelationshipRecord[]> {
    if (businessIds.length === 0) return [];

    const identityKeys = await this.projection.identityKeysOfBusinesses(businessIds);
    const customers = await this.projection.customersByIdentity(identityKeys);
    const customerIds = customers.map((customer) => customer.id);

    const [visits, bookings] = await Promise.all([
      this.projection.visitsOfCustomers(customerIds),
      this.projection.bookingsOfCustomers(customerIds)
    ]);

    const packagesByBusiness = await this.projection.packagesByBusiness([
      ...new Set(bookings.map((booking) => booking.businessId))
    ]);

    const input: CoOccurrenceInput = {
      customers,
      visits,
      bookings,
      packagesByBusiness,
      scopeBusinessIds: new Set(businessIds)
    };

    return [...inferCoVisitEdges(input), ...inferCoBookingEdges(input)];
  }

  private graphUpdatedEvent(
    job: IntelligenceJob,
    entityIds: readonly EntityId[]
  ): IntelligenceEvent<"KnowledgeGraphUpdated"> {
    return {
      eventId: this.clock.newId(),
      eventType: "KnowledgeGraphUpdated",
      eventVersion: 1,
      timestamp: this.clock.now(),
      // One node touched ⇒ the event is about that node; more ⇒ about the
      // graph itself, which is what the platform aggregate id names.
      aggregateId: entityIds.length === 1 ? (entityIds[0] as EntityId) : KNOWLEDGE_GRAPH_AGGREGATE_ID,
      correlationId: job.correlationId,
      causationId: job.causationEventId,
      payload: { entityIds }
    };
  }

  private async publishAll(events: readonly AnyIntelligenceEvent[]): Promise<boolean> {
    if (events.length === 0) return false;

    if (!this.publisher) {
      // Epic 03.5 owns the bus. Saying so once per job beats silently
      // dropping the chain, and beats inventing a second bus here.
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

  private replay(name: string, idempotencyKey: string): GraphJobResult | null {
    const stored = this.ledger.get(`${name}|${idempotencyKey}`);
    return stored ? { ...stored, deduplicated: true } : null;
  }

  private remember(result: GraphJobResult): GraphJobResult {
    if (this.ledger.size >= MAX_LEDGER_ENTRIES) {
      const oldest = this.ledger.keys().next().value;
      if (oldest) this.ledger.delete(oldest);
    }

    this.ledger.set(`${result.name}|${result.idempotencyKey}`, result);
    return result;
  }
}

/** The distinct node ids an edge set touches, sorted for determinism. */
function touchedIds(edges: readonly GraphRelationshipRecord[]): readonly EntityId[] {
  return [...new Set(edges.flatMap((edge) => [edge.fromId, edge.toId]))].sort();
}
