/**
 * Layer 2 (Marketplace Intelligence) — storage for stored summaries.
 *
 * Doc 22 is binding: summaries are **stored and refreshed by jobs, never
 * regenerated per query**. So this layer needs a store, and it gets the same
 * shape Epics 04 and 05 arrived at — one generic, kind-discriminated table
 * (`IntelligenceSummary`) keyed on `(kind, subjectId)`, because the kind
 * vocabulary is a TypeScript union and a table per summarizer would make
 * every new summarizer a migration.
 *
 * The migration is written but **not applied** — M1 must reconcile the
 * existing schema/migration drift first — so it sits in
 * `packages/db/migrations-gated-m1/`, outside the directory
 * `prisma migrate deploy` reads. Selection needs the same **two** signals as
 * the graph's edge store and memory's object store: the generated client must
 * have the delegate *and* the deployment must set
 * `MARKETPLACE_INTELLIGENCE_STORE=prisma`.
 *
 * **Why this store accepts pre-M1 writes.** It follows memory, not the graph.
 * The graph's edge store refuses, because an inferred edge that silently
 * vanished would make a marketplace-wide answer wrong while looking right. A
 * summary is different: it is a *derivation of live rows*, so losing it costs
 * a recompute, not correctness, and the read path already reports its absence
 * honestly (`knowledge_missing`). And a summarizer that cannot store anything
 * cannot be exercised or trusted before M1. What this design refuses is
 * accepting writes while claiming durability — `durable` is false, `backend`
 * is `memory`, and both are surfaced on the provider.
 */
import { Injectable, Logger, type Provider } from "@nestjs/common";
import type {
  Confidence,
  EntityId,
  IntelligenceFailure,
  IsoDateTime,
  KnowledgeSource,
  TimeWindow
} from "../core";
import { PrismaService } from "../../prisma.service";
import { INTELLIGENCE_SUMMARY_STORE } from "./marketplace-intelligence.tokens";
import {
  isSummaryKind,
  summarySlotKey,
  type SummaryKind,
  type SummarySlot
} from "./marketplace-intelligence.slots";

/**
 * One stored summary: the slot, the provenance quartet the amendment
 * mandates (value · confidence · computedAt · source), the evidence it stands
 * on, and the payload.
 */
export interface StoredSummaryRecord {
  readonly kind: SummaryKind;
  readonly subjectId: EntityId;
  /** Derived from the slot; stable across recomputes (doc 23 §9). */
  readonly summaryId: EntityId;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  /** Observations behind the payload — a summary of 3 rows is not one of 300. */
  readonly sampleSize: number;
  /** The observation window, where the summary has one. */
  readonly window: TimeWindow | null;
  readonly payload: Record<string, unknown>;
  readonly computedAt: IsoDateTime;
}

/** Outcome of a write: a count, or a typed reason it did not happen. */
export type SummaryPersistOutcome =
  | { readonly persisted: true; readonly written: number }
  | { readonly persisted: false; readonly failure: IntelligenceFailure };

/**
 * Command + Query API of summary storage.
 *
 * Injected by token so the pre-M1 in-process store and the post-M1 Prisma
 * store are interchangeable without a single consumer change.
 */
export interface IntelligenceSummaryStore {
  readonly available: boolean;
  /** True only when writes survive a process restart. Pre-M1 this is false. */
  readonly durable: boolean;
  readonly backend: "memory" | "prisma";
  /** The summaries occupying these slots; missing slots are simply absent. */
  read(slots: readonly SummarySlot[]): Promise<readonly StoredSummaryRecord[]>;
  /**
   * Writes summaries, upserting on `(kind, subjectId)`.
   *
   * Idempotent by construction (doc 23 §4): the same summary written twice is
   * one row, never two.
   */
  write(records: readonly StoredSummaryRecord[]): Promise<SummaryPersistOutcome>;
  /** Removes these slots; returns how many existed. */
  forget(slots: readonly SummarySlot[]): Promise<number>;
  /** Slots of one kind computed before `before` — the refresh queue. */
  staleSlots(kind: SummaryKind, before: IsoDateTime, limit: number): Promise<readonly SummarySlot[]>;
}

/** The toolId reported when the store cannot serve. */
export const SUMMARY_STORE_TOOL_ID = "marketplace-intelligence.summary-store";

/** Ceiling on summaries held in process, so a long-lived API cannot leak. */
export const MAX_IN_PROCESS_SUMMARIES = 2000;

/** Ceiling on rows one read returns. */
export const MAX_SUMMARIES_PER_READ = 200;

/**
 * The pre-M1 store: real storage, honest scope.
 *
 * A bounded, FIFO-evicted map. Everything the module does — freshness,
 * idempotent rewrites, the refresh queue — is exercised against it exactly as
 * it will be against Postgres, because the contract above is the whole surface
 * either one presents.
 */
@Injectable()
export class InProcessSummaryStore implements IntelligenceSummaryStore {
  readonly available = true;

  /** False, and reported everywhere a consumer could be misled by it. */
  readonly durable = false;

  readonly backend = "memory" as const;

  private readonly records = new Map<string, StoredSummaryRecord>();

  async read(slots: readonly SummarySlot[]): Promise<readonly StoredSummaryRecord[]> {
    const found: StoredSummaryRecord[] = [];

    for (const slot of slots.slice(0, MAX_SUMMARIES_PER_READ)) {
      const record = this.records.get(summarySlotKey(slot));
      if (record) found.push(record);
    }

    return found;
  }

  async write(records: readonly StoredSummaryRecord[]): Promise<SummaryPersistOutcome> {
    for (const record of records) {
      const key = summarySlotKey(record);

      // Evict only when adding a *new* key: refreshing a summary must never
      // cost another summary its slot.
      if (!this.records.has(key) && this.records.size >= MAX_IN_PROCESS_SUMMARIES) {
        const oldest = this.records.keys().next().value;
        if (oldest) this.records.delete(oldest);
      }

      this.records.set(key, record);
    }

    return { persisted: true, written: records.length };
  }

  async forget(slots: readonly SummarySlot[]): Promise<number> {
    let removed = 0;

    for (const slot of slots) {
      if (this.records.delete(summarySlotKey(slot))) removed += 1;
    }

    return removed;
  }

  async staleSlots(
    kind: SummaryKind,
    before: IsoDateTime,
    limit: number
  ): Promise<readonly SummarySlot[]> {
    const cutoff = Date.parse(before);

    return [...this.records.values()]
      .filter((record) => record.kind === kind && Date.parse(record.computedAt) < cutoff)
      .sort((a, b) => Date.parse(a.computedAt) - Date.parse(b.computedAt))
      .slice(0, limit)
      .map((record) => ({ kind: record.kind, subjectId: record.subjectId }));
  }

  /** Test/diagnostic surface: how many summaries are held right now. */
  get size(): number {
    return this.records.size;
  }
}

/** One stored row, as the gated migration defines it. */
interface SummaryRow {
  readonly kind: string;
  readonly subjectId: string;
  readonly summaryId: string;
  readonly source: string;
  readonly confidence: number;
  readonly sampleSize: number;
  readonly windowStart: Date | null;
  readonly windowEnd: Date | null;
  readonly payload: unknown;
  readonly computedAt: Date;
}

/**
 * The Prisma delegate this store needs, described structurally.
 *
 * Structural rather than `PrismaClient["intelligenceSummary"]` because that
 * property does not exist until the M1 migration is applied and the client
 * regenerated — a direct reference would stop the whole API compiling today.
 * Described this way the same code compiles now, refuses to activate now, and
 * starts working the moment the table and the generated client appear, with no
 * edit.
 */
interface SummaryDelegate {
  findMany(args: {
    where: Record<string, unknown>;
    take: number;
    orderBy?: Record<string, unknown>;
  }): Promise<SummaryRow[]>;
  upsert(args: {
    where: { kind_subjectId: { kind: string; subjectId: string } };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<unknown>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>;
}

function isDelegate(candidate: unknown): candidate is SummaryDelegate {
  if (typeof candidate !== "object" || candidate === null) return false;
  const record = candidate as Record<string, unknown>;

  return (
    typeof record.findMany === "function" &&
    typeof record.upsert === "function" &&
    typeof record.deleteMany === "function"
  );
}

/** Resolves the delegate, or null while the migration is still gated. */
export function resolveSummaryDelegate(prisma: PrismaService): SummaryDelegate | null {
  const candidate = (prisma as unknown as Record<string, unknown>).intelligenceSummary;
  return isDelegate(candidate) ? candidate : null;
}

@Injectable()
export class PrismaSummaryStore implements IntelligenceSummaryStore {
  readonly available = true;
  readonly durable = true;
  readonly backend = "prisma" as const;

  private readonly logger = new Logger(PrismaSummaryStore.name);

  constructor(private readonly delegate: SummaryDelegate) {}

  async read(slots: readonly SummarySlot[]): Promise<readonly StoredSummaryRecord[]> {
    if (slots.length === 0) return [];

    const rows = await this.delegate.findMany({
      where: {
        OR: slots
          .slice(0, MAX_SUMMARIES_PER_READ)
          .map((slot) => ({ kind: slot.kind, subjectId: slot.subjectId }))
      },
      take: MAX_SUMMARIES_PER_READ
    });

    return rows.map((row) => toRecord(row)).filter((record): record is StoredSummaryRecord => record !== null);
  }

  async write(records: readonly StoredSummaryRecord[]): Promise<SummaryPersistOutcome> {
    for (const record of records) {
      await this.delegate.upsert({
        where: { kind_subjectId: { kind: record.kind, subjectId: record.subjectId } },
        create: {
          kind: record.kind,
          subjectId: record.subjectId,
          summaryId: record.summaryId,
          source: record.source,
          confidence: record.confidence,
          sampleSize: record.sampleSize,
          windowStart: record.window ? new Date(record.window.start) : null,
          windowEnd: record.window ? new Date(record.window.end) : null,
          payload: record.payload,
          computedAt: new Date(record.computedAt)
        },
        update: {
          source: record.source,
          confidence: record.confidence,
          sampleSize: record.sampleSize,
          windowStart: record.window ? new Date(record.window.start) : null,
          windowEnd: record.window ? new Date(record.window.end) : null,
          payload: record.payload,
          computedAt: new Date(record.computedAt)
        }
      });
    }

    this.logger.debug(`persisted ${records.length} intelligence summary/ies`);
    return { persisted: true, written: records.length };
  }

  async forget(slots: readonly SummarySlot[]): Promise<number> {
    if (slots.length === 0) return 0;

    const { count } = await this.delegate.deleteMany({
      where: { OR: slots.map((slot) => ({ kind: slot.kind, subjectId: slot.subjectId })) }
    });

    return count;
  }

  async staleSlots(
    kind: SummaryKind,
    before: IsoDateTime,
    limit: number
  ): Promise<readonly SummarySlot[]> {
    const rows = await this.delegate.findMany({
      where: { kind, computedAt: { lt: new Date(before) } },
      orderBy: { computedAt: "asc" },
      take: Math.min(limit, MAX_SUMMARIES_PER_READ)
    });

    return rows
      .filter((row) => isSummaryKind(row.kind))
      .map((row) => ({ kind: row.kind as SummaryKind, subjectId: row.subjectId }));
  }
}

/**
 * A row as a record, or null when this build does not know the kind.
 *
 * Dropping rather than casting: a row written by a newer build carries a kind
 * whose payload shape this process cannot read, and serving it as though it
 * could is how a rolling deploy starts answering questions wrongly.
 */
function toRecord(row: SummaryRow): StoredSummaryRecord | null {
  if (!isSummaryKind(row.kind)) return null;

  return {
    kind: row.kind,
    subjectId: row.subjectId,
    summaryId: row.summaryId,
    source: row.source as KnowledgeSource,
    confidence: row.confidence,
    sampleSize: row.sampleSize,
    window:
      row.windowStart && row.windowEnd
        ? { start: row.windowStart.toISOString(), end: row.windowEnd.toISOString() }
        : null,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    computedAt: row.computedAt.toISOString()
  };
}

/** Env var that opts a deployment into the durable store after M1. */
export const SUMMARY_STORE_ENV = "MARKETPLACE_INTELLIGENCE_STORE";

/**
 * Chooses the store, requiring **two** independent signals.
 *
 * The generated client is not evidence that the table exists: `prisma
 * generate` runs on every image build and would mint an `intelligenceSummary`
 * delegate the moment the model appears in `schema.prisma` — while the
 * migration is still gated and the table still absent. Selecting on the
 * delegate alone would therefore switch the store on at build time and fail at
 * query time. So the delegate must exist *and* the deployment must say
 * `MARKETPLACE_INTELLIGENCE_STORE=prisma`.
 */
export function selectSummaryStore(
  prisma: PrismaService,
  env: NodeJS.ProcessEnv = process.env
): IntelligenceSummaryStore {
  if (env[SUMMARY_STORE_ENV] !== "prisma") {
    return new InProcessSummaryStore();
  }

  const delegate = resolveSummaryDelegate(prisma);
  return delegate ? new PrismaSummaryStore(delegate) : new InProcessSummaryStore();
}

/**
 * Token/implementation pair, following `MEMORY_OBJECT_STORE_PROVIDER`:
 * consumers inject `IntelligenceSummaryStore` and never learn which one they
 * got.
 */
export const INTELLIGENCE_SUMMARY_STORE_PROVIDER: Provider = {
  provide: INTELLIGENCE_SUMMARY_STORE,
  useFactory: (prisma: PrismaService): IntelligenceSummaryStore => selectSummaryStore(prisma),
  inject: [PrismaService]
};
