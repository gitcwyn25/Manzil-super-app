/**
 * Layer 4.5 (Hybrid Retrieval) — the configurable filter pipeline.
 *
 * The epic's requirement is "never hardcoded", and the reason is concrete:
 * "quiet restaurant near Yunusabad, family-friendly, open now, under 500k" is
 * five filters, and a retrieval layer that expressed them as `if` statements
 * inside its engines would need every engine edited to add a sixth. Here a
 * filter is a typed record in the query and a pure predicate in this file;
 * engines never see one.
 *
 * **The important decision is what happens when a filter cannot be
 * evaluated.** An item with no known distance has not failed a distance
 * filter — nobody measured it. Dropping it would be the platform inventing an
 * exclusion, which is the same class of lie as inventing a recommendation. So
 * evaluation is three-valued:
 *
 * ```text
 *   passed       → keep
 *   failed       → drop (hard) or penalize (soft)
 *   undecidable  → keep, flag the item, warn with the missing fact key
 * ```
 *
 * That is the retrieval-shaped version of Epic 06's evidence rule: refuse to
 * assert what you cannot observe, and say which observation was missing.
 *
 * One filter is internal-only. `premium_only` exposes commercial placement
 * data, so a customer-audience query carrying it is not answered with fewer
 * results — it is refused with `permission_denied` (ADR-001: least privilege
 * applies to the AI too).
 *
 * Imports `core` only.
 */
import type { EntityId, IntelligenceFailure, IsoDateTime, MoneyAmount } from "../core";
import {
  booleanFact,
  numericFact,
  RETRIEVAL_FACT_KEYS,
  stringFact,
  stringListFact
} from "./retrieval-item";
import { mergeReasonCodes, roundScore } from "./retrieval-scoring";
import type {
  RetrievalAudience,
  RetrievalFilter,
  RetrievalFilterKind,
  RetrievalItem,
  RetrievalWarning
} from "./hybrid-retrieval.types";

/** Three-valued filter result; see the file comment for why two is not enough. */
export type FilterVerdict = "passed" | "failed" | "undecidable";

/**
 * Filters only an internal principal may set.
 *
 * Data rather than a check inside the premium branch, so the set is reviewable
 * and so `internalFiltersFor` can report *all* violations at once instead of
 * the first.
 */
export const INTERNAL_ONLY_FILTERS = ["premium_only"] as const satisfies readonly RetrievalFilterKind[];

/**
 * What a soft filter costs an item that fails it.
 *
 * One number, applied multiplicatively per failed soft filter. Halving is
 * severe enough that a soft-failing item loses to any comparable item that
 * passes, and mild enough that a soft-failing item with strong evidence still
 * beats a passing item with none — which is the whole point of `soft`.
 */
export const SOFT_FILTER_PENALTY = 0.5;

/** The fact key each filter reads, for the warning when it is missing. */
export const FILTER_FACT_KEY = {
  distance: RETRIEVAL_FACT_KEYS.distanceKm,
  budget: RETRIEVAL_FACT_KEYS.priceMinorUnits,
  availability: RETRIEVAL_FACT_KEYS.availableInWindow,
  status: RETRIEVAL_FACT_KEYS.status,
  category: RETRIEVAL_FACT_KEYS.categoryIds,
  workspace: RETRIEVAL_FACT_KEYS.workspaceId,
  time: RETRIEVAL_FACT_KEYS.availabilityWindowStart,
  language: RETRIEVAL_FACT_KEYS.locales,
  accessibility: RETRIEVAL_FACT_KEYS.capabilityKeys,
  family_friendly: RETRIEVAL_FACT_KEYS.familyFriendly,
  pet_friendly: RETRIEVAL_FACT_KEYS.petFriendly,
  open_now: RETRIEVAL_FACT_KEYS.openWindows,
  verified_only: RETRIEVAL_FACT_KEYS.verified,
  premium_only: RETRIEVAL_FACT_KEYS.premium
} as const satisfies Readonly<Record<RetrievalFilterKind, string>>;

/** Internal-only filters present in a set — empty when the set is public-safe. */
export function internalFiltersFor(
  filters: readonly RetrievalFilter[]
): readonly RetrievalFilterKind[] {
  const internal = new Set<string>(INTERNAL_ONLY_FILTERS);
  return filters.map((filter) => filter.kind).filter((kind) => internal.has(kind));
}

/** True when this audience may set every filter in the set. */
export function isFilterSetPermitted(
  filters: readonly RetrievalFilter[],
  audience: RetrievalAudience
): boolean {
  return audience === "internal" || internalFiltersFor(filters).length === 0;
}

/** One filter against one item. Pure; no engine and no clock. */
export function evaluateFilter(filter: RetrievalFilter, item: RetrievalItem): FilterVerdict {
  switch (filter.kind) {
    case "distance": {
      const distanceKm = numericFact(item, RETRIEVAL_FACT_KEYS.distanceKm);
      if (distanceKm === null) return "undecidable";
      return distanceKm <= filter.maxKm ? "passed" : "failed";
    }
    case "budget": {
      const amountMinor = numericFact(item, RETRIEVAL_FACT_KEYS.priceMinorUnits);
      const currency = stringFact(item, RETRIEVAL_FACT_KEYS.currency);
      if (amountMinor === null || currency === null) return "undecidable";
      return withinBudget({ amountMinor, currency }, filter.range) ? "passed" : "failed";
    }
    case "availability": {
      const available = booleanFact(item, RETRIEVAL_FACT_KEYS.availableInWindow);
      if (available === null) return "undecidable";
      return available ? "passed" : "failed";
    }
    case "status": {
      const status = stringFact(item, RETRIEVAL_FACT_KEYS.status);
      if (status === null) return "undecidable";
      return filter.allowed.includes(status) ? "passed" : "failed";
    }
    case "category": {
      const categoryIds = stringListFact(item, RETRIEVAL_FACT_KEYS.categoryIds);
      if (categoryIds.length === 0) return "undecidable";
      return categoryIds.some((id) => filter.categoryIds.includes(id)) ? "passed" : "failed";
    }
    case "workspace": {
      const workspaceId = stringFact(item, RETRIEVAL_FACT_KEYS.workspaceId);
      if (workspaceId === null) return "undecidable";
      return workspaceId === filter.workspaceId ? "passed" : "failed";
    }
    case "time": {
      const start = stringFact(item, RETRIEVAL_FACT_KEYS.availabilityWindowStart);
      const end = stringFact(item, RETRIEVAL_FACT_KEYS.availabilityWindowEnd);
      if (start === null || end === null) return "undecidable";
      return overlaps(start, end, filter.window.start, filter.window.end) ? "passed" : "failed";
    }
    case "language": {
      const locales = stringListFact(item, RETRIEVAL_FACT_KEYS.locales);
      if (locales.length === 0) return "undecidable";
      return locales.some((locale) => filter.locales.some((wanted) => wanted === locale))
        ? "passed"
        : "failed";
    }
    case "accessibility": {
      const keys = stringListFact(item, RETRIEVAL_FACT_KEYS.capabilityKeys);
      if (keys.length === 0) return "undecidable";
      return filter.capabilityKeys.every((key) => keys.includes(key)) ? "passed" : "failed";
    }
    case "family_friendly":
      return booleanVerdict(booleanFact(item, RETRIEVAL_FACT_KEYS.familyFriendly));
    case "pet_friendly":
      return booleanVerdict(booleanFact(item, RETRIEVAL_FACT_KEYS.petFriendly));
    case "open_now": {
      const windows = stringListFact(item, RETRIEVAL_FACT_KEYS.openWindows);
      if (windows.length === 0) return "undecidable";
      return isOpenAt(windows, filter.at) ? "passed" : "failed";
    }
    case "verified_only":
      return booleanVerdict(booleanFact(item, RETRIEVAL_FACT_KEYS.verified));
    case "premium_only":
      return booleanVerdict(booleanFact(item, RETRIEVAL_FACT_KEYS.premium));
  }
}

/** A tri-state boolean fact as a verdict: absent means unmeasured, not false. */
function booleanVerdict(value: boolean | null): FilterVerdict {
  if (value === null) return "undecidable";
  return value ? "passed" : "failed";
}

/** Whether an amount sits inside a budget band; open bounds always admit. */
export function withinBudget(
  amount: MoneyAmount,
  range: { readonly min: MoneyAmount | null; readonly max: MoneyAmount | null }
): boolean {
  if (range.min && range.min.currency === amount.currency && amount.amountMinor < range.min.amountMinor) {
    return false;
  }
  if (range.max && range.max.currency === amount.currency && amount.amountMinor > range.max.amountMinor) {
    return false;
  }
  // A band in another currency cannot be compared without a rate this module
  // does not have, so it does not constrain — and the caller sees the item.
  return true;
}

/** Half-open interval overlap over ISO timestamps. */
export function overlaps(
  leftStart: IsoDateTime,
  leftEnd: IsoDateTime,
  rightStart: IsoDateTime,
  rightEnd: IsoDateTime
): boolean {
  const ls = Date.parse(leftStart);
  const le = Date.parse(leftEnd);
  const rs = Date.parse(rightStart);
  const re = Date.parse(rightEnd);
  if ([ls, le, rs, re].some((value) => Number.isNaN(value))) return false;

  return ls < re && rs < le;
}

/** Weekday names in the order `Date.getUTCDay()` returns them. */
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

/**
 * Whether declared weekly windows contain an instant.
 *
 * A window is encoded `day|HH:mm|HH:mm` — the string form of the platform's
 * `WeeklyWindow`, because a `RetrievalFact` value is a scalar and a weekly
 * window is three of them. Windows that cross midnight are expressed as two
 * entries by the producing engine; this function does not guess.
 *
 * The comparison happens in whatever clock the caller passes, and the caller
 * must pass the venue's local wall clock — `WeeklyWindow` is defined in local
 * time precisely because "Fridays 18:00" is meaningful there and nowhere else.
 */
export function isOpenAt(windows: readonly string[], at: IsoDateTime): boolean {
  const instant = new Date(at);
  if (Number.isNaN(instant.getTime())) return false;

  const day = DAY_NAMES[instant.getUTCDay()];
  const minutes = instant.getUTCHours() * 60 + instant.getUTCMinutes();

  return windows.some((window) => {
    const [windowDay, start, end] = window.split("|");
    if (windowDay !== day || !start || !end) return false;

    const from = toMinutes(start);
    const to = toMinutes(end);
    if (from === null || to === null) return false;

    return minutes >= from && minutes < to;
  });
}

function toMinutes(hhmm: string): number | null {
  const [hours, mins] = hhmm.split(":");
  const h = Number(hours);
  const m = Number(mins);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
}

/** How one item fared against the whole filter set. */
export interface ItemFilterResult {
  readonly item: RetrievalItem;
  readonly kept: boolean;
  readonly failedHard: readonly RetrievalFilterKind[];
  readonly failedSoft: readonly RetrievalFilterKind[];
  readonly undecidable: readonly RetrievalFilterKind[];
}

/** The whole application: what survived, what it cost, and what nobody knew. */
export interface FilterApplication {
  readonly items: readonly RetrievalItem[];
  readonly warnings: readonly RetrievalWarning[];
  readonly dropped: number;
  readonly penalized: number;
  readonly undecidable: number;
}

/** One item against the whole filter set. */
export function evaluateItem(
  item: RetrievalItem,
  filters: readonly RetrievalFilter[]
): ItemFilterResult {
  const failedHard: RetrievalFilterKind[] = [];
  const failedSoft: RetrievalFilterKind[] = [];
  const undecidable: RetrievalFilterKind[] = [];

  for (const filter of filters) {
    const verdict = evaluateFilter(filter, item);
    if (verdict === "passed") continue;

    if (verdict === "undecidable") {
      undecidable.push(filter.kind);
      continue;
    }

    if (filter.mode === "hard") failedHard.push(filter.kind);
    else failedSoft.push(filter.kind);
  }

  return { item, kept: failedHard.length === 0, failedHard, failedSoft, undecidable };
}

/**
 * Applies a filter set to a result list.
 *
 * Hard failures drop. Soft failures are charged `SOFT_FILTER_PENALTY` each.
 * Undecidables are kept, marked with the `filter_undecidable` reason code so
 * the item itself says why it might not belong, and reported once per filter
 * kind in `warnings` — once, not once per item, because a hundred identical
 * warnings is noise and the count is already in `undecidable`.
 */
export function applyFilters(
  items: readonly RetrievalItem[],
  filters: readonly RetrievalFilter[],
  at: IsoDateTime
): FilterApplication {
  if (filters.length === 0) {
    return { items, warnings: [], dropped: 0, penalized: 0, undecidable: 0 };
  }

  const kept: RetrievalItem[] = [];
  const undecidableKinds = new Set<RetrievalFilterKind>();
  let dropped = 0;
  let penalized = 0;
  let undecidable = 0;

  for (const item of items) {
    const result = evaluateItem(item, filters);

    if (!result.kept) {
      dropped += 1;
      continue;
    }

    for (const kind of result.undecidable) undecidableKinds.add(kind);
    if (result.undecidable.length > 0) undecidable += 1;
    if (result.failedSoft.length > 0) penalized += 1;

    kept.push(applyVerdictToItem(item, result));
  }

  return {
    items: kept,
    warnings: [...undecidableKinds]
      .sort()
      .map((kind) => undecidableWarning(kind, at)),
    dropped,
    penalized,
    undecidable
  };
}

/** The item as the verdict leaves it: penalized score, honest reason codes. */
function applyVerdictToItem(item: RetrievalItem, result: ItemFilterResult): RetrievalItem {
  if (result.failedSoft.length === 0 && result.undecidable.length === 0) return item;

  const penalty = SOFT_FILTER_PENALTY ** result.failedSoft.length;
  const reasonCodes =
    result.undecidable.length > 0
      ? mergeReasonCodes(item.score.reasonCodes, ["filter_undecidable"])
      : item.score.reasonCodes;

  return {
    ...item,
    score: {
      ...item.score,
      overallScore: roundScore(item.score.overallScore * penalty),
      reasonCodes
    }
  };
}

/** The warning one undecidable filter kind produces. */
export function undecidableWarning(kind: RetrievalFilterKind, at: IsoDateTime): RetrievalWarning {
  return {
    engineId: null,
    scopeKey: `filter:${kind}`,
    failure: {
      error: {
        kind: "knowledge_missing",
        entityId: null,
        missingKey: FILTER_FACT_KEY[kind]
      },
      // Not retryable *for this query*: the fact is missing from the knowledge
      // we have, and asking again changes nothing until the pipeline computes
      // it. Distinct from `marketplace_sparse`, which growth does fix.
      retryable: false,
      occurredAt: at
    }
  };
}

/** The failure a forbidden filter set produces (ADR-001 audit shape). */
export function forbiddenFilterFailure(
  kinds: readonly RetrievalFilterKind[],
  audience: RetrievalAudience,
  at: IsoDateTime
): IntelligenceFailure {
  return {
    error: {
      kind: "permission_denied",
      principal: audience,
      action: `retrieval.filter:${[...kinds].sort().join(",")}`
    },
    retryable: false,
    occurredAt: at
  };
}

/** Ids of the items a filter set removed — for diagnostics and tests. */
export function droppedIds(
  items: readonly RetrievalItem[],
  filters: readonly RetrievalFilter[]
): readonly EntityId[] {
  return items
    .filter((item) => !evaluateItem(item, filters).kept)
    .map((item) => item.entityId);
}
