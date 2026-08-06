import {
  GRAPH_EDGE_STORE_ENV,
  MAX_STORED_EDGES,
  PendingMigrationRelationshipStore,
  PrismaGraphRelationshipStore,
  selectGraphRelationshipStore,
  type GraphRelationshipRecord
} from "./graph-relationship.store";

const record: GraphRelationshipRecord = {
  kind: "recommended_with",
  fromId: "business:b1",
  toId: "business:b2",
  attributes: { coOccurrenceCount: 3 },
  origin: "inferred",
  source: "platform_inference",
  confidence: 0.3
};

function makeDelegate(rows: unknown[] = []) {
  return {
    findMany: jest.fn().mockResolvedValue(rows),
    upsert: jest.fn().mockResolvedValue(undefined)
  };
}

describe("projection-only mode (pre-M1)", () => {
  it("reads as an empty graph so the projection still answers", async () => {
    expect(await new PendingMigrationRelationshipStore().edgesOf()).toEqual([]);
  });

  it("refuses writes with a typed, non-retryable cause", async () => {
    const outcome = await new PendingMigrationRelationshipStore().persist();

    expect(outcome).toEqual({
      persisted: false,
      failure: expect.objectContaining({
        error: { kind: "tool_unavailable", toolId: "knowledge-graph.graph-relationship-store" },
        // Retrying cannot conjure a table: this is a deployment precondition.
        retryable: false
      })
    });
  });
});

describe("selectGraphRelationshipStore — the M1 gate", () => {
  const prisma = { graphRelationship: makeDelegate() } as never;

  it("stays projection-only when the deployment has not opted in", () => {
    // `prisma generate` mints the delegate as soon as the model is in
    // schema.prisma — long before the table exists. The delegate alone must
    // never be enough.
    expect(selectGraphRelationshipStore(prisma, {})).toBeInstanceOf(PendingMigrationRelationshipStore);
  });

  it("stays projection-only when opted in but the client has no delegate", () => {
    expect(
      selectGraphRelationshipStore({} as never, { [GRAPH_EDGE_STORE_ENV]: "prisma" })
    ).toBeInstanceOf(PendingMigrationRelationshipStore);
  });

  it("uses Postgres only when both signals agree", () => {
    expect(selectGraphRelationshipStore(prisma, { [GRAPH_EDGE_STORE_ENV]: "prisma" })).toBeInstanceOf(
      PrismaGraphRelationshipStore
    );
  });
});

describe("PrismaGraphRelationshipStore", () => {
  it("upserts on (kind, from, to), so writing the same edge twice is one row", async () => {
    const delegate = makeDelegate();
    const store = new PrismaGraphRelationshipStore(delegate);

    await store.persist([record]);
    await store.persist([record]);

    expect(delegate.upsert).toHaveBeenCalledTimes(2);
    expect(delegate.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          kind_fromId_toId: {
            kind: "recommended_with",
            fromId: "business:b1",
            toId: "business:b2"
          }
        }
      })
    );
  });

  it("reads edges incident to either end, under a budget", async () => {
    const delegate = makeDelegate([
      {
        kind: "recommended_with",
        fromId: "business:b1",
        toId: "business:b2",
        attributes: { coOccurrenceCount: 3 },
        origin: "inferred",
        source: "platform_inference",
        confidence: 0.3,
        updatedAt: new Date("2026-08-01T10:00:00.000Z")
      }
    ]);

    const edges = await new PrismaGraphRelationshipStore(delegate).edgesOf(["business:b1"]);

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { OR: [{ fromId: { in: ["business:b1"] } }, { toId: { in: ["business:b1"] } }] },
      take: MAX_STORED_EDGES
    });
    expect(edges).toEqual([
      expect.objectContaining({ kind: "recommended_with", confidence: 0.3, source: "platform_inference" })
    ]);
  });

  it("drops a stored row that no longer describes a graph the build understands", async () => {
    const delegate = makeDelegate([
      // Dangling id shape, unknown kind, impossible confidence: three ways a
      // stored row can rot, none of which may reach a consumer.
      {
        kind: "teleports_to",
        fromId: "business:b1",
        toId: "not-a-graph-id",
        attributes: {},
        origin: "explicit",
        source: "merchant_input",
        confidence: 4,
        updatedAt: new Date("2026-08-01T10:00:00.000Z")
      }
    ]);

    expect(await new PrismaGraphRelationshipStore(delegate).edgesOf(["business:b1"])).toEqual([]);
  });
});
