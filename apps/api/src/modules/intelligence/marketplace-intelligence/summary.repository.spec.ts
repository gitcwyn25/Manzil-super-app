import {
  SummaryRepository,
  fromListPayload,
  stableStringify,
  toPayload
} from "./summary.repository";
import {
  InProcessSummaryStore,
  MAX_IN_PROCESS_SUMMARIES,
  selectSummaryStore,
  SUMMARY_STORE_ENV,
  type IntelligenceSummaryStore,
  type StoredSummaryRecord
} from "./intelligence-summary.store";
import { SUMMARY_TTL_SECONDS, isStale, staleBefore } from "./marketplace-intelligence.freshness";
import { summaryId, summarySlotKey } from "./marketplace-intelligence.slots";
import type { PrismaService } from "../../prisma.service";

const NOW = "2026-08-07T09:00:00.000Z";
const LATER = "2026-08-09T09:00:00.000Z";

const window = { start: "2026-05-09T09:00:00.000Z", end: NOW };

function makeRepository(store: IntelligenceSummaryStore = new InProcessSummaryStore()) {
  return { repository: new SummaryRepository(store), store };
}

const profile = { businessId: "biz_1", health: null, gaps: [] };

function write(over: Record<string, unknown> = {}) {
  return {
    slot: { kind: "business" as const, subjectId: "biz_1" },
    value: profile,
    confidence: 0.6,
    sampleSize: 12,
    window,
    source: "platform_inference" as const,
    computedAt: NOW,
    ...over
  };
}

describe("writing", () => {
  it("stores a summary and reports that the knowledge moved", async () => {
    const { repository } = makeRepository();

    const result = await repository.write(write());

    expect(result.outcome).toBe("written");
    expect(result.summaryId).toBe("summary:business:biz_1");
    expect(result.failure).toBeNull();
  });

  it("is idempotent: the same summary written twice is one slot", async () => {
    const { repository, store } = makeRepository();

    await repository.write(write());
    await repository.write(write());

    expect((store as InProcessSummaryStore).size).toBe(1);
  });

  it("reports an identical payload as unchanged, so nothing is announced", async () => {
    const { repository } = makeRepository();

    await repository.write(write());
    const second = await repository.write(write({ computedAt: LATER }));

    expect(second.outcome).toBe("unchanged");
  });

  it("still moves the freshness stamp on an unchanged write — we did look", async () => {
    const { repository } = makeRepository();

    await repository.write(write());
    await repository.write(write({ computedAt: LATER }));

    const stored = await repository.read<typeof profile>(
      { kind: "business", subjectId: "biz_1" },
      LATER
    );

    expect(stored?.computedAt).toBe(LATER);
    expect(stored?.ageSeconds).toBe(0);
  });

  it("reports a changed payload as written", async () => {
    const { repository } = makeRepository();

    await repository.write(write());
    const second = await repository.write(
      write({ value: { ...profile, gaps: [{ model: "business_health" }] }, computedAt: LATER })
    );

    expect(second.outcome).toBe("written");
  });

  it("treats a changed sample size as a change even when the payload matches", async () => {
    const { repository } = makeRepository();

    await repository.write(write());
    const second = await repository.write(write({ sampleSize: 40, computedAt: LATER }));

    expect(second.outcome).toBe("written");
  });

  it("rejects an impossible confidence rather than storing it", async () => {
    const { repository, store } = makeRepository();

    const result = await repository.write(write({ confidence: 1.4 }));

    expect(result.outcome).toBe("rejected");
    expect(result.failure?.error).toEqual({
      kind: "knowledge_missing",
      entityId: "biz_1",
      missingKey: "business.confidence"
    });
    expect((store as InProcessSummaryStore).size).toBe(0);
  });

  it("rejects a negative sample size and an unreadable timestamp", async () => {
    const { repository } = makeRepository();

    expect((await repository.write(write({ sampleSize: -1 }))).outcome).toBe("rejected");
    expect((await repository.write(write({ computedAt: "yesterday" }))).outcome).toBe("rejected");
  });
});

describe("reading", () => {
  it("returns null for an empty slot", async () => {
    const { repository } = makeRepository();

    expect(await repository.read({ kind: "business", subjectId: "nobody" }, NOW)).toBeNull();
  });

  it("serves a stale summary, labelled, rather than deleting it", async () => {
    const { repository } = makeRepository();
    await repository.write(write());

    const stored = await repository.read<typeof profile>(
      { kind: "business", subjectId: "biz_1" },
      LATER
    );

    expect(stored).not.toBeNull();
    expect(stored?.stale).toBe(true);
    expect(stored?.ageSeconds).toBe(2 * 86_400);
    // Replacing real knowledge with none would be a downgrade, not honesty.
    expect(stored?.value.businessId).toBe("biz_1");
  });

  it("reads several slots at once and skips the absent ones", async () => {
    const { repository } = makeRepository();
    await repository.write(write());

    const found = await repository.readMany<typeof profile>(
      [
        { kind: "business", subjectId: "biz_1" },
        { kind: "business", subjectId: "biz_2" }
      ],
      NOW
    );

    expect(found).toHaveLength(1);
    expect(found[0]?.subjectId).toBe("biz_1");
  });

  it("drops a stored row whose envelope is impossible rather than serving it", async () => {
    const store = new InProcessSummaryStore();
    const corrupt: StoredSummaryRecord = {
      kind: "business",
      subjectId: "biz_1",
      summaryId: "summary:business:biz_1",
      source: "platform_inference",
      confidence: 7,
      sampleSize: 1,
      window: null,
      payload: {},
      computedAt: NOW
    };

    await store.write([corrupt]);
    const { repository } = makeRepository(store);

    expect(await repository.read({ kind: "business", subjectId: "biz_1" }, NOW)).toBeNull();
  });
});

describe("the refresh queue", () => {
  it("returns only what has aged past its own kind's TTL, oldest first", async () => {
    const { repository } = makeRepository();

    await repository.write(write({ slot: { kind: "business", subjectId: "biz_1" } }));
    await repository.write(
      write({ slot: { kind: "business", subjectId: "biz_2" }, computedAt: "2026-08-05T09:00:00.000Z" })
    );
    await repository.write(write({ slot: { kind: "trend", subjectId: "bookings@biz_1" } }));

    const businesses = await repository.staleSlots("business", "2026-08-08T10:00:00.000Z");

    // biz_2 was computed first, so it is the one most overdue.
    expect(businesses.map((slot) => slot.subjectId)).toEqual(["biz_2", "biz_1"]);
  });

  it("does not return summaries that are still fresh", async () => {
    const { repository } = makeRepository();
    await repository.write(write());

    expect(await repository.staleSlots("business", NOW)).toEqual([]);
  });

  it("cannot return subjects that were never summarized — discovery is elsewhere", async () => {
    const { repository } = makeRepository();

    expect(await repository.staleSlots("business", LATER)).toEqual([]);
  });
});

describe("forgetting", () => {
  it("destroys a slot and reports whether anything was there", async () => {
    const { repository } = makeRepository();
    await repository.write(write());

    expect(await repository.forget({ kind: "business", subjectId: "biz_1" })).toBe(true);
    expect(await repository.forget({ kind: "business", subjectId: "biz_1" })).toBe(false);
  });
});

describe("the store", () => {
  it("is in-process and says so, until M1", () => {
    const { repository, store } = makeRepository();

    expect(repository.backend).toBe("memory");
    expect(repository.durable).toBe(false);
    expect(store.available).toBe(true);
  });

  it("evicts only when adding a new slot, never when refreshing one", async () => {
    const store = new InProcessSummaryStore();
    const { repository } = makeRepository(store);

    for (let index = 0; index < MAX_IN_PROCESS_SUMMARIES + 10; index += 1) {
      await repository.write(write({ slot: { kind: "business", subjectId: `biz_${index}` } }));
    }

    expect(store.size).toBe(MAX_IN_PROCESS_SUMMARIES);
  });

  it("needs BOTH signals before it will use Postgres", () => {
    const withDelegate = {
      intelligenceSummary: { findMany: () => {}, upsert: () => {}, deleteMany: () => {} }
    } as unknown as PrismaService;

    // The delegate appears at every image build once the model is in
    // schema.prisma — long before the table exists. So it is never enough.
    expect(selectSummaryStore(withDelegate, {}).backend).toBe("memory");
    expect(selectSummaryStore({} as PrismaService, { [SUMMARY_STORE_ENV]: "prisma" }).backend).toBe(
      "memory"
    );
    expect(
      selectSummaryStore(withDelegate, { [SUMMARY_STORE_ENV]: "prisma" }).backend
    ).toBe("prisma");
  });
});

describe("slots and freshness", () => {
  it("derives a stable id from the slot, so a trace still resolves tomorrow", () => {
    expect(summaryId({ kind: "business", subjectId: "biz_1" })).toBe("summary:business:biz_1");
    expect(summarySlotKey({ kind: "trend", subjectId: "views@biz_1" })).toBe("trend:views@biz_1");
  });

  it("gives a trend the shortest life, because a stale trend is misleading", () => {
    expect(SUMMARY_TTL_SECONDS.trend).toBeLessThan(SUMMARY_TTL_SECONDS.business);
    expect(SUMMARY_TTL_SECONDS.neighborhood).toBeGreaterThan(SUMMARY_TTL_SECONDS.business);
  });

  it("treats an unreadable timestamp as stale", () => {
    expect(isStale("business", "not-a-date", NOW)).toBe(true);
  });

  it("computes the cutoff a refresh queue filters on", () => {
    expect(staleBefore("business", NOW)).toBe("2026-08-06T09:00:00.000Z");
  });
});

describe("payload encoding", () => {
  it("wraps a list so every payload is an object", () => {
    expect(toPayload([1, 2])).toEqual({ items: [1, 2] });
    expect(fromListPayload<number>(toPayload([1, 2]))).toEqual([1, 2]);
    expect(fromListPayload<number>({})).toEqual([]);
  });

  it("sorts keys at every depth, so a rebuild is not mistaken for a change", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 })
    );
  });

  it("preserves array order, which is meaning rather than layout", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });
});
