import {
  inferCoBookingEdges,
  inferCoVisitEdges,
  inferenceConfidence,
  KNOWLEDGE_GRAPH_AGGREGATE_ID,
  KnowledgeGraphJobs,
  type GraphClock
} from "./knowledge-graph.jobs";
import { PendingMigrationRelationshipStore } from "./graph-relationship.store";
import type { GraphRelationshipRecord, GraphRelationshipStore, PersistOutcome } from "./graph-relationship.store";
import type { IntelligenceJob } from "../core";
import type { BusinessPackageRow, CustomerProjectionRow } from "./knowledge-graph.projection";

const AT = "2026-08-01T10:00:00.000Z";
const DAY = new Date("2026-07-01T00:00:00.000Z");

/** Deterministic time and ids: idempotency is only assertable without globals. */
function makeClock(): GraphClock {
  let sequence = 0;
  return {
    now: () => AT,
    newId: () => `evt_${(sequence += 1)}`
  };
}

const customers: CustomerProjectionRow[] = [
  // The same person (account u1) known to two businesses as two CRM rows —
  // exactly the shape `Customer` is unique on.
  { id: "cus_1", businessId: "biz_1", name: "Aziz", phone: "+998901", userId: "u1", firstSeenAt: DAY, updatedAt: DAY },
  { id: "cus_2", businessId: "biz_2", name: "Aziz", phone: "+998902", userId: "u1", firstSeenAt: DAY, updatedAt: DAY }
];

const visits = [
  { customerId: "cus_1", businessId: "biz_1", occurredAt: DAY },
  { customerId: "cus_2", businessId: "biz_2", occurredAt: DAY }
];

const bookings = [
  {
    id: "bk_1",
    businessId: "biz_1",
    customerId: "cus_1",
    serviceName: "Haircut",
    startsAt: DAY,
    endsAt: null,
    status: "completed",
    updatedAt: DAY
  },
  {
    id: "bk_2",
    businessId: "biz_2",
    customerId: "cus_2",
    serviceName: "Massage",
    startsAt: DAY,
    endsAt: null,
    status: "completed",
    updatedAt: DAY
  }
];

const packagesByBusiness = new Map<string, readonly BusinessPackageRow[]>([
  [
    "biz_1",
    [
      {
        id: "pkg_1",
        businessId: "biz_1",
        name: "Haircut",
        description: null,
        price: { toString: () => "100000" },
        currency: "UZS",
        isActive: true,
        updatedAt: DAY
      }
    ]
  ],
  [
    "biz_2",
    [
      {
        id: "pkg_2",
        businessId: "biz_2",
        name: "Massage",
        description: null,
        price: { toString: () => "200000" },
        currency: "UZS",
        isActive: true,
        updatedAt: DAY
      }
    ]
  ]
]);

function makeProjection() {
  return {
    businessGraphIds: jest.fn().mockResolvedValue(["business:biz_1", "business:biz_2"]),
    identityKeysOfBusinesses: jest.fn().mockResolvedValue(["user:u1"]),
    customersByIdentity: jest.fn().mockResolvedValue(customers),
    visitsOfCustomers: jest.fn().mockResolvedValue(visits),
    bookingsOfCustomers: jest.fn().mockResolvedValue(bookings),
    packagesByBusiness: jest.fn().mockResolvedValue(packagesByBusiness)
  };
}

class RecordingStore implements GraphRelationshipStore {
  readonly available = true;
  readonly persisted: GraphRelationshipRecord[] = [];
  readonly calls: number[] = [];

  async edgesOf() {
    return [];
  }

  async persist(records: readonly GraphRelationshipRecord[]): Promise<PersistOutcome> {
    this.calls.push(records.length);
    this.persisted.push(...records);
    return { persisted: true, written: records.length };
  }
}

function makeJobs(store: GraphRelationshipStore, options: { publisher?: boolean; metrics?: boolean } = {}) {
  const projection = makeProjection();
  const entities = { entity: jest.fn().mockResolvedValue(null) };
  const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
  const metrics = { record: jest.fn() };

  const jobs = new KnowledgeGraphJobs(
    projection as never,
    entities as never,
    cache as never,
    store,
    makeClock(),
    options.publisher === false ? undefined : publisher,
    options.metrics === false ? undefined : metrics
  );

  return { jobs, projection, entities, cache, publisher, metrics };
}

const rebuildJob: IntelligenceJob<"RebuildKnowledgeGraphJob"> = {
  jobId: "job_1",
  name: "RebuildKnowledgeGraphJob",
  payload: { scope: "entities", entityIds: ["business:biz_1"] },
  idempotencyKey: "rebuild:biz_1",
  correlationId: "corr_1",
  causationEventId: "evt_root",
  requestedAt: AT
};

const inferJob: IntelligenceJob<"InferRelationshipsJob"> = {
  jobId: "job_2",
  name: "InferRelationshipsJob",
  payload: { entityIds: ["business:biz_1"] },
  idempotencyKey: "infer:biz_1",
  correlationId: "corr_2",
  causationEventId: null,
  requestedAt: AT
};

describe("RebuildKnowledgeGraphJob", () => {
  it("invalidates the cache, warms the scope, and announces the change", async () => {
    const { jobs, cache, entities, publisher } = makeJobs(new PendingMigrationRelationshipStore());

    const result = await jobs.rebuild(rebuildJob);

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(entities.entity).toHaveBeenCalledWith("business:biz_1");
    expect(result.entityIds).toEqual(["business:biz_1"]);
    expect(result.published).toBe(true);
    expect(publisher.publish).toHaveBeenCalledTimes(1);

    // The doc 23 §3 envelope, field for field.
    expect(result.events[0]).toEqual({
      eventId: "evt_1",
      eventType: "KnowledgeGraphUpdated",
      eventVersion: 1,
      timestamp: AT,
      aggregateId: "business:biz_1",
      correlationId: "corr_1",
      causationId: "evt_root",
      payload: { entityIds: ["business:biz_1"] }
    });
  });

  it("is idempotent: the same job twice yields the identical result and one set of effects", async () => {
    const { jobs, cache, publisher } = makeJobs(new PendingMigrationRelationshipStore());

    const first = await jobs.rebuild(rebuildJob);
    const second = await jobs.rebuild(rebuildJob);

    expect(second.deduplicated).toBe(true);
    // Identical down to the event id — a replay, not a re-run.
    expect(second.events).toEqual(first.events);
    expect(second.entityIds).toEqual(first.entityIds);
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it("a full rebuild announces the marketplace, not a single node", async () => {
    const { jobs, projection } = makeJobs(new PendingMigrationRelationshipStore());

    const result = await jobs.rebuild({
      ...rebuildJob,
      idempotencyKey: "rebuild:full",
      payload: { scope: "full", entityIds: [] }
    });

    expect(projection.businessGraphIds).toHaveBeenCalledTimes(1);
    expect(result.entityIds).toEqual(["business:biz_1", "business:biz_2"]);
    expect(result.events[0]?.aggregateId).toBe(KNOWLEDGE_GRAPH_AGGREGATE_ID);
  });

  it("still builds the event chain when no publisher is bound (Epic 03.5 pending)", async () => {
    const { jobs } = makeJobs(new PendingMigrationRelationshipStore(), { publisher: false });

    const result = await jobs.rebuild(rebuildJob);

    expect(result.events).toHaveLength(1);
    expect(result.published).toBe(false);
  });
});

describe("InferRelationshipsJob", () => {
  it("derives co-visit and co-booking edges from behaviour", async () => {
    const store = new RecordingStore();
    const { jobs, cache } = makeJobs(store);

    const result = await jobs.inferRelationships(inferJob);

    expect(result.edges).toEqual([
      {
        kind: "recommended_with",
        fromId: "business:biz_1",
        toId: "business:biz_2",
        attributes: { coOccurrenceCount: 1 },
        origin: "inferred",
        source: "platform_inference",
        confidence: 0.1
      },
      {
        kind: "booked_together",
        fromId: "service:pkg_1",
        toId: "service:pkg_2",
        attributes: { coBookingCount: 1 },
        origin: "inferred",
        source: "platform_inference",
        confidence: 0.1
      }
    ]);

    expect(store.persisted).toHaveLength(2);
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(result.entityIds).toEqual([
      "business:biz_1",
      "business:biz_2",
      "service:pkg_1",
      "service:pkg_2"
    ]);
    expect(result.published).toBe(true);
  });

  it("reports tool_unavailable and changes nothing while the store is gated on M1", async () => {
    const { jobs, cache, publisher } = makeJobs(new PendingMigrationRelationshipStore());

    const result = await jobs.inferRelationships(inferJob);

    expect(result.failure?.error).toEqual({
      kind: "tool_unavailable",
      toolId: "knowledge-graph.graph-relationship-store"
    });
    expect(result.failure?.retryable).toBe(false);
    // Nothing changed, so nothing is announced and nothing is invalidated.
    expect(result.events).toEqual([]);
    expect(result.published).toBe(false);
    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
    // The derivation still happened and is observable.
    expect(result.edges).toHaveLength(2);
  });

  it("records the typed failure cause on the metrics sink", async () => {
    const { jobs, metrics } = makeJobs(new PendingMigrationRelationshipStore());

    await jobs.inferRelationships(inferJob);

    expect(metrics.record).toHaveBeenCalledWith({
      kind: "failure",
      operation: "InferRelationshipsJob",
      errorKind: "tool_unavailable",
      at: AT
    });
    expect(metrics.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "execution_time", operation: "InferRelationshipsJob" })
    );
  });

  it("is idempotent: a resubmission replays without writing again", async () => {
    const store = new RecordingStore();
    const { jobs } = makeJobs(store);

    const first = await jobs.inferRelationships(inferJob);
    const second = await jobs.inferRelationships(inferJob);

    expect(second.deduplicated).toBe(true);
    expect(second.edges).toEqual(first.edges);
    expect(second.events).toEqual(first.events);
    expect(store.calls).toEqual([2]);
  });
});

describe("inference rules", () => {
  const input = {
    customers,
    visits,
    bookings,
    packagesByBusiness,
    scopeBusinessIds: new Set(["biz_1"])
  };

  it("emits one edge per unordered pair, from the smaller id", () => {
    const edges = inferCoVisitEdges(input);

    expect(edges).toHaveLength(1);
    expect(edges[0]?.fromId).toBe("business:biz_1");
    expect(edges[0]?.toId).toBe("business:biz_2");
  });

  it("emits nothing for a scope no shared customer touches", () => {
    expect(inferCoVisitEdges({ ...input, scopeBusinessIds: new Set(["biz_9"]) })).toEqual([]);
    expect(inferCoBookingEdges({ ...input, scopeBusinessIds: new Set(["biz_9"]) })).toEqual([]);
  });

  it("ignores a booking whose service name matches no package", () => {
    const edges = inferCoBookingEdges({
      ...input,
      bookings: [{ ...bookings[0]!, serviceName: "Something Unlisted" }, bookings[1]!]
    });

    expect(edges).toEqual([]);
  });

  it("ramps confidence linearly and never reaches the certainty of a projection", () => {
    expect(inferenceConfidence(1)).toBe(0.1);
    expect(inferenceConfidence(5)).toBe(0.5);
    expect(inferenceConfidence(10)).toBe(0.9);
    expect(inferenceConfidence(100)).toBe(0.9);
  });
});
