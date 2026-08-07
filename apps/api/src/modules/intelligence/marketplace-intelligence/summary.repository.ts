/**
 * Layer 2 (Marketplace Intelligence) — the summary repository.
 *
 * The typed skin over `IntelligenceSummaryStore`. Four rules, mirroring the
 * four the memory repository keeps:
 *
 * 1. **Slot isolation** — every read and write is keyed `(kind, subjectId)`;
 *    no query here spans kinds.
 * 2. **Freshness on read** — a served summary always carries its age and
 *    whether it is due for a refresh. Unlike memory, nothing is deleted for
 *    being old: a six-day-old business profile is still the best knowledge the
 *    platform has, and replacing it with nothing would be a downgrade.
 * 3. **Change detection on write** — an identical payload refreshes
 *    `computedAt` (we did look) but reports `unchanged`, so no event is
 *    announced and no downstream cache is invalidated for knowledge that did
 *    not move.
 * 4. **Degrade, never throw** — a stored row that fails validation is dropped,
 *    not served and not raised.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  Confidence,
  EntityId,
  IntelligenceFailure,
  IsoDateTime,
  KnowledgeSource,
  TimeWindow
} from "../core";
import { INTELLIGENCE_SUMMARY_STORE } from "./marketplace-intelligence.tokens";
import {
  type IntelligenceSummaryStore,
  type StoredSummaryRecord
} from "./intelligence-summary.store";
import { isStale, staleBefore, summaryAgeSeconds } from "./marketplace-intelligence.freshness";
import {
  summaryId,
  type SummaryKind,
  type SummarySlot
} from "./marketplace-intelligence.slots";

/** A stored summary as served: the value plus everything that qualifies it. */
export interface StoredSummary<TValue> {
  readonly kind: SummaryKind;
  readonly subjectId: EntityId;
  readonly summaryId: EntityId;
  readonly value: TValue;
  readonly confidence: Confidence;
  readonly sampleSize: number;
  readonly window: TimeWindow | null;
  readonly source: KnowledgeSource;
  readonly computedAt: IsoDateTime;
  readonly ageSeconds: number;
  /** True when a refresh is due — served anyway, and labelled. */
  readonly stale: boolean;
}

/** What a caller hands the repository to store. */
export interface SummaryWrite<TValue> {
  readonly slot: SummarySlot;
  readonly value: TValue;
  readonly confidence: Confidence;
  readonly sampleSize: number;
  readonly window: TimeWindow | null;
  readonly source: KnowledgeSource;
  readonly computedAt: IsoDateTime;
}

/** How a write resolved. */
export interface SummaryWriteResult {
  readonly slot: SummarySlot;
  /**
   * `written` — the knowledge changed, announce it.
   * `unchanged` — same knowledge, freshness stamp moved, announce nothing.
   * `rejected` — the write failed validation or the store refused it.
   */
  readonly outcome: "written" | "unchanged" | "rejected";
  readonly summaryId: EntityId;
  readonly failure: IntelligenceFailure | null;
}

/** Ceiling on the refresh queue one sweep returns. */
export const MAX_STALE_SLOTS = 100;

@Injectable()
export class SummaryRepository {
  private readonly logger = new Logger(SummaryRepository.name);

  constructor(
    @Inject(INTELLIGENCE_SUMMARY_STORE) private readonly store: IntelligenceSummaryStore
  ) {}

  /** `memory` until M1 applies the migration, then `prisma`. */
  get backend(): "memory" | "prisma" {
    return this.store.backend;
  }

  /** False while summaries live in process only. */
  get durable(): boolean {
    return this.store.durable;
  }

  /** The summary in one slot, with its freshness, or null. */
  async read<TValue>(slot: SummarySlot, now: IsoDateTime): Promise<StoredSummary<TValue> | null> {
    const [first] = await this.readMany<TValue>([slot], now);
    return first ?? null;
  }

  /** The summaries in these slots, in one store read; missing slots absent. */
  async readMany<TValue>(
    slots: readonly SummarySlot[],
    now: IsoDateTime
  ): Promise<readonly StoredSummary<TValue>[]> {
    if (slots.length === 0) return [];

    const records = await this.store.read(slots);

    return records
      .filter((record) => this.screen(record))
      .map((record) => this.toSummary<TValue>(record, now));
  }

  /**
   * Stores a summary, reporting whether the knowledge actually moved.
   *
   * The payload comparison is what makes a nightly re-run quiet: the same rows
   * derive the same summary, so the second run stamps freshness and announces
   * nothing. An announcement is a claim that the world changed.
   */
  async write<TValue>(write: SummaryWrite<TValue>): Promise<SummaryWriteResult> {
    const id = summaryId(write.slot);
    const invalid = this.validate(write);

    if (invalid) {
      this.logger.warn(
        `rejected ${write.slot.kind} summary for ${write.slot.subjectId}: ${invalid.error.kind}`
      );
      return { slot: write.slot, outcome: "rejected", summaryId: id, failure: invalid };
    }

    const payload = toPayload(write.value);
    const [existing] = await this.store.read([write.slot]);
    const changed =
      !existing ||
      existing.confidence !== write.confidence ||
      existing.sampleSize !== write.sampleSize ||
      stableStringify(existing.payload) !== stableStringify(payload);

    const record: StoredSummaryRecord = {
      kind: write.slot.kind,
      subjectId: write.slot.subjectId,
      summaryId: id,
      source: write.source,
      confidence: write.confidence,
      sampleSize: write.sampleSize,
      window: write.window,
      payload,
      computedAt: write.computedAt
    };

    const outcome = await this.store.write([record]);

    if (!outcome.persisted) {
      return { slot: write.slot, outcome: "rejected", summaryId: id, failure: outcome.failure };
    }

    return {
      slot: write.slot,
      outcome: changed ? "written" : "unchanged",
      summaryId: id,
      failure: null
    };
  }

  /** Destroys a slot; true when something was there. */
  async forget(slot: SummarySlot): Promise<boolean> {
    return (await this.store.forget([slot])) > 0;
  }

  /**
   * Slots of one kind that are due for a refresh, oldest first.
   *
   * The nightly scheduler's input. Note what it cannot return: subjects that
   * have **never** been summarized, because a store keyed by slot has no row
   * for them. Discovering new subjects is the projection repository's job, and
   * keeping the two apart is what stops the refresh queue from silently
   * becoming a full table scan of the marketplace.
   */
  async staleSlots(
    kind: SummaryKind,
    now: IsoDateTime,
    limit = MAX_STALE_SLOTS
  ): Promise<readonly SummarySlot[]> {
    return this.store.staleSlots(kind, staleBefore(kind, now), Math.min(limit, MAX_STALE_SLOTS));
  }

  private toSummary<TValue>(record: StoredSummaryRecord, now: IsoDateTime): StoredSummary<TValue> {
    return {
      kind: record.kind,
      subjectId: record.subjectId,
      summaryId: record.summaryId,
      value: record.payload as TValue,
      confidence: record.confidence,
      sampleSize: record.sampleSize,
      window: record.window,
      source: record.source,
      computedAt: record.computedAt,
      ageSeconds: summaryAgeSeconds(record.computedAt, now),
      stale: isStale(record.kind, record.computedAt, now)
    };
  }

  /** Drops rows whose envelope is impossible rather than serving them. */
  private screen(record: StoredSummaryRecord): boolean {
    const sane =
      Number.isFinite(record.confidence) &&
      record.confidence >= 0 &&
      record.confidence <= 1 &&
      Number.isInteger(record.sampleSize) &&
      record.sampleSize >= 0 &&
      !Number.isNaN(Date.parse(record.computedAt));

    if (!sane) {
      this.logger.warn(
        `dropped ${record.kind} summary for ${record.subjectId}: unreadable envelope`
      );
    }

    return sane;
  }

  /** The same checks, on the way in, as a typed failure. */
  private validate<TValue>(write: SummaryWrite<TValue>): IntelligenceFailure | null {
    const problem =
      !Number.isFinite(write.confidence) || write.confidence < 0 || write.confidence > 1
        ? "confidence"
        : !Number.isInteger(write.sampleSize) || write.sampleSize < 0
          ? "sampleSize"
          : Number.isNaN(Date.parse(write.computedAt))
            ? "computedAt"
            : write.value === null || write.value === undefined
              ? "value"
              : null;

    if (!problem) return null;

    return {
      error: {
        kind: "knowledge_missing",
        entityId: write.slot.subjectId,
        missingKey: `${write.slot.kind}.${problem}`
      },
      retryable: false,
      occurredAt: write.computedAt
    };
  }
}

/** A typed summary as the JSON the store holds. */
export function toPayload(value: unknown): Record<string, unknown> {
  // Arrays and scalars are wrapped, so every payload is an object and the
  // column type never has to change to accommodate a summarizer that returns
  // a list.
  if (Array.isArray(value)) return { items: value };
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  return { value };
}

/** Recovers a list payload written through `toPayload`. */
export function fromListPayload<TItem>(payload: Record<string, unknown>): readonly TItem[] {
  const items = payload.items;
  return Array.isArray(items) ? (items as TItem[]) : [];
}

/**
 * Deterministic JSON, keys sorted at every depth.
 *
 * Change detection compares payloads, and `JSON.stringify` preserves insertion
 * order — so two structurally identical summaries built by different code
 * paths would compare unequal and announce a change that did not happen.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

  return `{${entries.join(",")}}`;
}
