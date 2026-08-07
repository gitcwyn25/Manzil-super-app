/**
 * Layer 2 (Marketplace Intelligence) — the arithmetic, isolated and pure.
 *
 * Every number this module publishes is produced here, by a function with no
 * clock, no database and no Nest decorator. That is what makes the honesty
 * rule testable: "the platform said bookings are declining" reduces to a
 * table of two counts and one comparison, which a reviewer can check.
 *
 * Nothing here is statistics in the inferential sense — no distributions, no
 * significance tests, no fitted models. Counts, medians, shares and a
 * two-window comparison, because those are the claims the data supports.
 *
 * Imports `core` only.
 */
import type { DayOfWeek, IsoDateTime, MoneyAmount, TimeWindow, WeeklyWindow } from "../core";
import type { TrendDirection } from "./marketplace-intelligence.types";

/**
 * Local wall-clock offset of the marketplace, in minutes.
 *
 * Manzil is a single-city platform (Tashkent, UTC+5) and peak hours are
 * meaningful in the venue's own time, never UTC — "Friday 18:00" is a fact
 * about dinner, and the same instant is "Friday 13:00" in the database. When
 * the platform becomes multi-city this becomes a per-business timezone and
 * every caller of `localParts` already passes an offset.
 */
export const MARKETPLACE_UTC_OFFSET_MINUTES = 300;

/** ISO day order, index 0 = Monday, matching `DayOfWeek`. */
export const ISO_DAYS: readonly DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

/** Local day-of-week and hour of an instant. */
export interface LocalParts {
  readonly day: DayOfWeek;
  /** 0–23, local wall clock. */
  readonly hour: number;
}

/** Shifts an instant into marketplace-local wall time and splits it. */
export function localParts(
  at: Date,
  offsetMinutes: number = MARKETPLACE_UTC_OFFSET_MINUTES
): LocalParts {
  const shifted = new Date(at.getTime() + offsetMinutes * 60_000);
  // getUTCDay: 0 = Sunday. ISO order puts Monday first.
  const index = (shifted.getUTCDay() + 6) % 7;

  return { day: ISO_DAYS[index] as DayOfWeek, hour: shifted.getUTCHours() };
}

/** True when the local day falls on a weekend. */
export function isWeekend(day: DayOfWeek): boolean {
  return day === "saturday" || day === "sunday";
}

/** `HH:00` for an hour of the day. */
export function hourLabel(hour: number): string {
  return `${String(Math.max(0, Math.min(23, hour))).padStart(2, "0")}:00`;
}

/** Arithmetic mean, or null for an empty set — never 0, which is a claim. */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Median, or null for an empty set.
 *
 * Preferred over the mean for prices and lead times: one 12-million-so'm
 * wedding package must not become "the market rate for a haircut".
 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

/** Share of a whole, clamped to [0, 1]; null when there is no whole. */
export function share(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return clamp01(part / whole);
}

/** Clamps to [0, 1] — the range every Confidence-typed field promises. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/** Rounds to `digits` decimals; keeps stored facts stable across recomputes. */
export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Rank of a value within its peers, in [0, 1].
 *
 * The share of peers this value is at least as large as — a percentile, which
 * is what a "popularity" feature means and why it needs peers to exist.
 */
export function percentileRank(value: number, peers: readonly number[]): number | null {
  if (peers.length === 0) return null;

  const atOrBelow = peers.filter((peer) => peer <= value).length;
  return clamp01(atOrBelow / peers.length);
}

/** How much of two sets is shared, in [0, 1]. Empty ∩ empty = 0, not 1. */
export function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 && right.size === 0) return 0;

  let shared = 0;
  for (const value of left) {
    if (right.has(value)) shared += 1;
  }

  return clamp01(shared / (left.size + right.size - shared));
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  from: { readonly lat: number; readonly lng: number },
  to: { readonly lat: number; readonly lng: number }
): number {
  const earthRadiusKm = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Relative change between two equal windows, e.g. 0.35 = +35%.
 *
 * Null when the earlier window is empty. Going from 0 to 4 bookings is not a
 * 400% rise and it is not an infinite one — it is a first month, and the only
 * honest thing to report is that there is nothing to compare against.
 */
export function changeRate(previous: number, current: number): number | null {
  if (previous <= 0) return null;
  return roundTo((current - previous) / previous, 4);
}

/**
 * Minimum relative change before a trend is called rising or declining.
 *
 * Ten percent. Below it, two windows of a small marketplace differ because
 * of the weather, and "declining" is a word owners act on.
 */
export const TREND_SIGNIFICANCE = 0.1;

/** Direction of a change rate, with the dead band applied. */
export function trendDirection(rate: number | null): TrendDirection {
  if (rate === null || Math.abs(rate) < TREND_SIGNIFICANCE) return "stable";
  return rate > 0 ? "rising" : "declining";
}

/** A `[start, end)` window ending at `end` and spanning `days`. */
export function windowEndingAt(end: IsoDateTime, days: number): TimeWindow {
  const endMs = Date.parse(end);
  const startMs = endMs - days * 86_400_000;

  return { start: new Date(startMs).toISOString(), end };
}

/** The window immediately preceding `window`, of the same length. */
export function precedingWindow(window: TimeWindow): TimeWindow {
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  const length = end - start;

  return { start: new Date(start - length).toISOString(), end: window.start };
}

/** True when an instant falls in `[window.start, window.end)`. */
export function within(window: TimeWindow, at: Date): boolean {
  const time = at.getTime();
  return time >= Date.parse(window.start) && time < Date.parse(window.end);
}

/** One occupied weekly bucket and how often it was observed. */
export interface WeeklyBucket {
  readonly day: DayOfWeek;
  readonly hour: number;
  readonly count: number;
}

/** Counts instants into `(local day, local hour)` buckets, busiest first. */
export function weeklyHistogram(
  instants: readonly Date[],
  offsetMinutes: number = MARKETPLACE_UTC_OFFSET_MINUTES
): readonly WeeklyBucket[] {
  const counts = new Map<string, WeeklyBucket>();

  for (const instant of instants) {
    const { day, hour } = localParts(instant, offsetMinutes);
    const key = `${day}|${hour}`;
    const existing = counts.get(key);

    counts.set(key, { day, hour, count: (existing?.count ?? 0) + 1 });
  }

  return [...counts.values()].sort(
    (a, b) =>
      b.count - a.count ||
      ISO_DAYS.indexOf(a.day) - ISO_DAYS.indexOf(b.day) ||
      a.hour - b.hour
  );
}

/**
 * Share of observations a bucket must carry to be called a peak.
 *
 * A uniform week puts 1/168 of activity in each hour bucket. Five percent is
 * roughly eight times uniform — a bucket that genuinely stands out, rather
 * than the top of a flat list.
 */
export const PEAK_BUCKET_SHARE = 0.05;

/** Most peaks reported, so a peak list stays a summary. */
export const MAX_PEAK_WINDOWS = 6;

/**
 * The peak windows of a histogram: buckets carrying at least
 * `PEAK_BUCKET_SHARE` of all observations, merged where they are adjacent
 * hours of the same day so "18:00, 19:00, 20:00" reads as one evening.
 */
export function peakWindows(
  buckets: readonly WeeklyBucket[],
  total: number
): readonly WeeklyWindow[] {
  if (total <= 0) return [];

  const peaks = buckets.filter((bucket) => bucket.count / total >= PEAK_BUCKET_SHARE);
  if (peaks.length === 0) return [];

  const byDay = new Map<DayOfWeek, number[]>();
  for (const peak of peaks) {
    const hours = byDay.get(peak.day);
    if (hours) hours.push(peak.hour);
    else byDay.set(peak.day, [peak.hour]);
  }

  const windows: WeeklyWindow[] = [];

  for (const day of ISO_DAYS) {
    const hours = byDay.get(day);
    if (!hours) continue;

    const sorted = [...new Set(hours)].sort((a, b) => a - b);
    let runStart = sorted[0] as number;
    let previous = runStart;

    for (const hour of sorted.slice(1)) {
      if (hour === previous + 1) {
        previous = hour;
        continue;
      }

      windows.push(weeklyWindow(day, runStart, previous));
      runStart = hour;
      previous = hour;
    }

    windows.push(weeklyWindow(day, runStart, previous));
  }

  return windows.slice(0, MAX_PEAK_WINDOWS);
}

function weeklyWindow(day: DayOfWeek, firstHour: number, lastHour: number): WeeklyWindow {
  return {
    day,
    startLocalTime: hourLabel(firstHour),
    // Half-open, like every other window in this platform: a peak occupying
    // the 19:00 bucket runs to 20:00, and one occupying 23:00 runs to 00:00.
    endLocalTime: hourLabel((lastHour + 1) % 24)
  };
}

/** Day-part shares of a set of instants, as the feature store's shape. */
export interface DayPartShares {
  readonly morningShare: number;
  readonly daytimeShare: number;
  readonly eveningShare: number;
  readonly nightShare: number;
}

/**
 * Day-part boundaries, local hours, as data.
 *
 * Chosen for Tashkent habits rather than a textbook: mornings start early,
 * dinner runs late, and "night" is after most venues close.
 */
export const DAY_PARTS = {
  morning: { from: 5, to: 11 },
  daytime: { from: 11, to: 17 },
  evening: { from: 17, to: 23 },
  night: { from: 23, to: 5 }
} as const;

/** Splits instants across the four day-parts; null when there are none. */
export function dayPartShares(
  instants: readonly Date[],
  offsetMinutes: number = MARKETPLACE_UTC_OFFSET_MINUTES
): DayPartShares | null {
  if (instants.length === 0) return null;

  let morning = 0;
  let daytime = 0;
  let evening = 0;
  let night = 0;

  for (const instant of instants) {
    const { hour } = localParts(instant, offsetMinutes);

    if (hour >= DAY_PARTS.morning.from && hour < DAY_PARTS.morning.to) morning += 1;
    else if (hour >= DAY_PARTS.daytime.from && hour < DAY_PARTS.daytime.to) daytime += 1;
    else if (hour >= DAY_PARTS.evening.from && hour < DAY_PARTS.evening.to) evening += 1;
    else night += 1;
  }

  const total = instants.length;

  return {
    morningShare: roundTo(morning / total),
    daytimeShare: roundTo(daytime / total),
    eveningShare: roundTo(evening / total),
    nightShare: roundTo(night / total)
  };
}

/** Money in minor units from a major-unit amount, rounded to the nearest unit. */
export function toMoney(majorAmount: number, currency: string): MoneyAmount {
  return { amountMinor: Math.round(majorAmount * 100), currency };
}

/** Counts occurrences of each key, most frequent first, ties broken by key. */
export function rankByFrequency(keys: readonly string[]): readonly (readonly [string, number])[] {
  const counts = new Map<string, number>();

  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Distinct values, order preserved. */
export function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/** Whole days between two instants, never negative. */
export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}
