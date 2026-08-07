/**
 * Store-level tests.
 *
 * The Prisma half is exercised against a fake delegate that reproduces the one
 * behaviour the design depends on — a unique index rejecting the second insert
 * — because that is the behaviour, not the ORM, that makes the race safe.
 */
import {
  InProcessIdempotencyStore,
  MAX_IN_PROCESS_RECORDS,
  PRISMA_UNIQUE_VIOLATION,
  PrismaIdempotencyStore,
  classifyExisting,
  resolveIdempotencyDelegate,
  type IdempotencyDelegate
} from "./idempotency.store";
import type { PrismaService } from "../prisma.service";
import type { IdempotencyClaimRequest, IdempotencyRecord } from "./idempotency.types";

const NOW = 1_700_000_000_000;
const TTL = 24 * 60 * 60 * 1000;

function claimRequest(overrides: Partial<IdempotencyClaimRequest> = {}): IdempotencyClaimRequest {
  return {
    scope: "user:a",
    key: "key-00000001",
    route: "POST /v1/crm/register",
    fingerprint: "fp-original",
    now: NOW,
    ttlMs: TTL,
    ...overrides
  };
}

describe("classifyExisting", () => {
  const base: IdempotencyRecord = {
    scope: "user:a",
    key: "k",
    route: "POST /v1/x",
    fingerprint: "fp",
    state: "completed",
    response: { status: 201, body: { ok: true } },
    createdAt: NOW,
    expiresAt: NOW + TTL
  };

  it("reports a mismatch before anything else, completed or not", () => {
    // Order matters: telling a client with a changed payload "still in
    // progress" would send it back to retry the same wrong request.
    expect(classifyExisting({ ...base, state: "in_flight", response: null }, "other").outcome).toBe(
      "fingerprint_mismatch"
    );
    expect(classifyExisting(base, "other").outcome).toBe("fingerprint_mismatch");
  });

  it("replays a completed record with a matching fingerprint", () => {
    expect(classifyExisting(base, "fp").outcome).toBe("replay");
  });

  it("reports in-flight for a claim with no response yet", () => {
    expect(classifyExisting({ ...base, state: "in_flight", response: null }, "fp").outcome).toBe(
      "in_flight"
    );
  });

  it("does not replay a 'completed' record with no response body recorded", () => {
    expect(classifyExisting({ ...base, response: null }, "fp").outcome).toBe("in_flight");
  });
});

describe("InProcessIdempotencyStore", () => {
  it("is honest about what it is", () => {
    const store = new InProcessIdempotencyStore();

    expect(store.backend).toBe("memory");
    expect(store.durable).toBe(false);
    expect(store.shared).toBe(false);
  });

  it("lets exactly one of two concurrent claims win", async () => {
    const store = new InProcessIdempotencyStore();

    const outcomes = await Promise.all([
      store.claim(claimRequest()),
      store.claim(claimRequest()),
      store.claim(claimRequest())
    ]);

    expect(outcomes.filter((outcome) => outcome.outcome === "claimed")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.outcome === "in_flight")).toHaveLength(2);
  });

  it("replays after completion", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: { id: 1 } }, NOW);

    const outcome = await store.claim(claimRequest());

    expect(outcome).toMatchObject({
      outcome: "replay",
      record: { response: { status: 201, body: { id: 1 } } }
    });
  });

  it("detects a different body under the same key", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest());

    expect((await store.claim(claimRequest({ fingerprint: "fp-changed" }))).outcome).toBe(
      "fingerprint_mismatch"
    );
  });

  it("frees the key once the window passes", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, NOW);

    expect((await store.claim(claimRequest({ now: NOW + TTL - 1 }))).outcome).toBe("replay");
    expect((await store.claim(claimRequest({ now: NOW + TTL + 1 }))).outcome).toBe("claimed");
  });

  it("refuses to record an outcome against an expired claim", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest());

    // Writing it now would silently extend the 24h window the contract
    // promises, so the outcome is dropped instead.
    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, NOW + TTL + 1);

    expect((await store.claim(claimRequest({ now: NOW + TTL + 2 }))).outcome).toBe("claimed");
  });

  it("releases a claim so the key can be retried", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest());
    await store.release("user:a", "key-00000001");

    expect((await store.claim(claimRequest())).outcome).toBe("claimed");
  });

  it("keeps scopes apart", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest({ scope: "user:a" }));

    expect((await store.claim(claimRequest({ scope: "user:b" }))).outcome).toBe("claimed");
  });

  describe("awaitSettled", () => {
    it("resolves as soon as the original completes", async () => {
      const store = new InProcessIdempotencyStore();
      await store.claim(claimRequest());

      const waiting = store.awaitSettled("user:a", "key-00000001", 1000);
      await store.complete("user:a", "key-00000001", { status: 201, body: { id: 9 } }, NOW);

      await expect(waiting).resolves.toMatchObject({
        state: "completed",
        response: { status: 201, body: { id: 9 } }
      });
    });

    it("resolves null when the original is released", async () => {
      const store = new InProcessIdempotencyStore();
      await store.claim(claimRequest());

      const waiting = store.awaitSettled("user:a", "key-00000001", 1000);
      await store.release("user:a", "key-00000001");

      await expect(waiting).resolves.toBeNull();
    });

    it("gives up rather than waiting forever", async () => {
      const store = new InProcessIdempotencyStore();
      await store.claim(claimRequest());

      await expect(store.awaitSettled("user:a", "key-00000001", 10)).resolves.toBeNull();
    });

    it("returns null for a key nobody holds", async () => {
      const store = new InProcessIdempotencyStore();

      await expect(store.awaitSettled("user:a", "nothing-here", 10)).resolves.toBeNull();
    });

    it("wakes every waiter, not just the first", async () => {
      const store = new InProcessIdempotencyStore();
      await store.claim(claimRequest());

      const waiters = [
        store.awaitSettled("user:a", "key-00000001", 1000),
        store.awaitSettled("user:a", "key-00000001", 1000),
        store.awaitSettled("user:a", "key-00000001", 1000)
      ];
      await store.complete("user:a", "key-00000001", { status: 201, body: {} }, NOW);

      for (const settled of await Promise.all(waiters)) {
        expect(settled?.state).toBe("completed");
      }
    });
  });

  it("prunes expired records", async () => {
    const store = new InProcessIdempotencyStore();
    await store.claim(claimRequest({ key: "key-00000001" }));
    await store.claim(claimRequest({ key: "key-00000002" }));

    expect(await store.prune(NOW + TTL + 1)).toBe(2);
    expect(store.size).toBe(0);
  });

  it("stays bounded, and never evicts an in-flight claim", async () => {
    const store = new InProcessIdempotencyStore();

    // One in-flight claim, then fill the store past its ceiling with completed
    // ones. Evicting the in-flight record would let the duplicate already
    // waiting on it proceed and create a second resource.
    await store.claim(claimRequest({ key: "in-flight-key" }));

    for (let index = 0; index < MAX_IN_PROCESS_RECORDS + 20; index += 1) {
      const key = `key-${index.toString().padStart(8, "0")}`;
      await store.claim(claimRequest({ key }));
      await store.complete("user:a", key, { status: 201, body: {} }, NOW);
    }

    expect(store.size).toBeLessThanOrEqual(MAX_IN_PROCESS_RECORDS);
    expect((await store.claim(claimRequest({ key: "in-flight-key" }))).outcome).toBe("in_flight");
  });
});

/** A delegate that behaves like a table with a unique index on (scope, key). */
function fakeDelegate() {
  const rows = new Map<string, Record<string, unknown>>();
  const id = (scope: string, key: string) => `${scope}|${key}`;

  const delegate: IdempotencyDelegate = {
    async create({ data }) {
      const rowId = id(data.scope as string, data.key as string);

      if (rows.has(rowId)) {
        // Exactly what Prisma throws when the unique index rejects the insert.
        throw Object.assign(new Error("Unique constraint failed"), {
          code: PRISMA_UNIQUE_VIOLATION
        });
      }

      rows.set(rowId, { ...data, responseStatus: null, responseBody: null });
      return data;
    },
    async findUnique({ where }) {
      const row = rows.get(id(where.scope_key.scope, where.scope_key.key));
      return (row as never) ?? null;
    },
    async update({ where, data }) {
      const rowId = id(where.scope_key.scope, where.scope_key.key);
      const row = rows.get(rowId);
      if (row) rows.set(rowId, { ...row, ...data });
      return data;
    },
    async deleteMany({ where }) {
      let count = 0;

      for (const [rowId, row] of [...rows]) {
        // Every clause is optional: `prune` deletes by expiry alone, across
        // every scope, and `release` deletes one in-flight row.
        if (where.scope !== undefined && row.scope !== where.scope) continue;
        if (where.key !== undefined && row.key !== where.key) continue;
        if (where.state !== undefined && row.state !== where.state) continue;

        const expiry = where.expiresAt as { lte?: Date } | undefined;
        if (expiry?.lte && (row.expiresAt as Date) > expiry.lte) continue;

        rows.delete(rowId);
        count += 1;
      }

      return { count };
    }
  };

  return { delegate, rows };
}

describe("PrismaIdempotencyStore", () => {
  it("claims by inserting, and lets the unique index arbitrate the loser", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    expect((await store.claim(claimRequest())).outcome).toBe("claimed");
    // No read-then-write anywhere: the second attempt is an insert that the
    // index rejects, which is why two concurrent ones cannot both proceed.
    expect((await store.claim(claimRequest())).outcome).toBe("in_flight");
  });

  it("replays a completed row", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: { id: 3 } }, NOW);

    expect(await store.claim(claimRequest())).toMatchObject({
      outcome: "replay",
      record: { response: { status: 201, body: { id: 3 } } }
    });
  });

  it("reports a fingerprint mismatch from the stored row", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    await store.claim(claimRequest());

    expect((await store.claim(claimRequest({ fingerprint: "fp-other" }))).outcome).toBe(
      "fingerprint_mismatch"
    );
  });

  it("takes over a row whose window has closed", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, NOW);

    expect((await store.claim(claimRequest({ now: NOW + TTL + 1 }))).outcome).toBe("claimed");
  });

  it("releases only its own in-flight row", async () => {
    const { delegate, rows } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    await store.claim(claimRequest());
    await store.complete("user:a", "key-00000001", { status: 201, body: {} }, NOW);
    await store.release("user:a", "key-00000001");

    // A completed record survives a stray release — otherwise a late failure
    // path could erase an outcome a client is still retrying against.
    expect(rows.size).toBe(1);
  });

  it("prunes by expiry", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    await store.claim(claimRequest());

    expect(await store.prune(NOW - 1)).toBe(0);
    expect(await store.prune(NOW + TTL + 1)).toBe(1);
  });

  it("waits for another replica's in-flight row to settle", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);
    await store.claim(claimRequest());

    const waiting = store.awaitSettled("user:a", "key-00000001", 1000);
    setTimeout(
      () => void store.complete("user:a", "key-00000001", { status: 201, body: { id: 5 } }, NOW),
      5
    );

    await expect(waiting).resolves.toMatchObject({
      state: "completed",
      response: { status: 201, body: { id: 5 } }
    });
  });

  it("does not swallow errors that are not unique-constraint violations", async () => {
    const { delegate } = fakeDelegate();
    const store = new PrismaIdempotencyStore(delegate, 1);

    jest.spyOn(delegate, "create").mockRejectedValueOnce(new Error("connection refused"));

    await expect(store.claim(claimRequest())).rejects.toThrow("connection refused");
  });
});

describe("resolveIdempotencyDelegate", () => {
  it("returns null while the migration is still gated", () => {
    // Today's generated client has no `idempotencyRecord` — which is exactly
    // why the store selects on two signals and not on this one alone.
    expect(resolveIdempotencyDelegate({} as PrismaService)).toBeNull();
  });

  it("returns null for a partial delegate rather than half-working", () => {
    const partial = { idempotencyRecord: { create: () => undefined } } as unknown as PrismaService;

    expect(resolveIdempotencyDelegate(partial)).toBeNull();
  });

  it("recognises the delegate once every verb is present", () => {
    const ready = {
      idempotencyRecord: {
        create: () => undefined,
        findUnique: () => undefined,
        update: () => undefined,
        deleteMany: () => undefined
      }
    } as unknown as PrismaService;

    expect(resolveIdempotencyDelegate(ready)).not.toBeNull();
  });
});
