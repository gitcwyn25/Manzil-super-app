/**
 * Layer 2 (Marketplace Intelligence) — how old a summary may get.
 *
 * A stored summary is a promise that the platform recently looked. Freshness
 * is therefore part of the contract, not an implementation detail: doc 23 §8
 * names summary freshness as a metric, and a summary with no expiry policy is
 * a claim that ages into a lie.
 *
 * Volatility is policy, so it is DATA (`SUMMARY_TTL_SECONDS`) rather than an
 * `if` in whichever service happened to need it first — the same call Epic 05
 * made for memory tiers, for the same reason.
 *
 * Note that staleness here is **not** expiry. An expired memory is destroyed;
 * a stale summary is still the best knowledge the platform has and is served
 * with its age attached, while a job is due to refresh it. Deleting a
 * six-day-old business profile would replace real knowledge with none.
 *
 * Imports `core` only.
 */
import type { IsoDateTime } from "../core";
import type { SummaryKind } from "./marketplace-intelligence.slots";

/**
 * Seconds before a stored summary is due for a refresh.
 *
 * Chosen by how fast the underlying evidence moves, not by convenience:
 *
 * - **business / business_features** (24h) — reviews and bookings arrive
 *   continuously; doc 22's pipeline is nightly and this matches it.
 * - **customer / customer_features** (24h) — a customer summary is rebuilt on
 *   each completed experience by event, so the timer is only the backstop for
 *   someone whose activity happened elsewhere.
 * - **neighborhood / neighborhood_features** (7d) — a district's character is
 *   the slowest-moving thing this module tracks; refreshing it hourly would
 *   burn the marketplace's whole read budget to observe nothing.
 * - **service** (7d) — median price and lead time move with the catalog, not
 *   with traffic.
 * - **trend** (6h) — a trend is *about* change, so a stale trend is the one
 *   summary that is actively misleading rather than merely old.
 * - **campaign** (12h) — sends are batched; twice a day is ahead of the data.
 * - **workspace** (24h) — nominal: no workspace model exists yet, so this
 *   summarizer refuses rather than computes (see MARKETPLACE-INTELLIGENCE.md).
 * - **demand** (6h) and **demand_prediction** (24h) — intent is the fastest
 *   thing the platform observes, so pressure follows the trend TTL. The
 *   forecast is deliberately slower: a prediction that changed every six hours
 *   would be describing noise, and a merchant reading it twice in a day and
 *   seeing two different futures would be right to stop reading it.
 */
export const SUMMARY_TTL_SECONDS = {
  business: 86_400,
  customer: 86_400,
  neighborhood: 604_800,
  service: 604_800,
  trend: 21_600,
  campaign: 43_200,
  workspace: 86_400,
  demand: 21_600,
  demand_prediction: 86_400,
  business_features: 86_400,
  customer_features: 86_400,
  neighborhood_features: 604_800
} as const satisfies Readonly<Record<SummaryKind, number>>;

/** Anything at least this old is reported as stale regardless of kind. */
export function staleAfterSeconds(kind: SummaryKind): number {
  return SUMMARY_TTL_SECONDS[kind];
}

/** Age of a computed fact in seconds; 0 when the timestamp is unreadable. */
export function summaryAgeSeconds(computedAt: IsoDateTime, now: IsoDateTime): number {
  const computed = Date.parse(computedAt);
  const at = Date.parse(now);

  if (Number.isNaN(computed) || Number.isNaN(at)) return 0;
  return Math.max(0, Math.floor((at - computed) / 1000));
}

/** True when a summary of this kind, computed then, is due for a refresh. */
export function isStale(kind: SummaryKind, computedAt: IsoDateTime, now: IsoDateTime): boolean {
  // An unreadable timestamp is stale by definition: knowledge that cannot say
  // when it was learned cannot claim to be current.
  if (Number.isNaN(Date.parse(computedAt))) return true;
  return summaryAgeSeconds(computedAt, now) >= staleAfterSeconds(kind);
}

/** The instant before which a summary of this kind is stale. */
export function staleBefore(kind: SummaryKind, now: IsoDateTime): IsoDateTime {
  return new Date(Date.parse(now) - staleAfterSeconds(kind) * 1000).toISOString();
}

/**
 * Observation windows, in days.
 *
 * One vocabulary for "recently", so two models that both say recent mean the
 * same thing and their numbers can be compared.
 */
export const OBSERVATION_WINDOW_DAYS = {
  /** Behavioural facts: visit length, spend, repeat share, peak hours. */
  behaviour: 90,
  /** One half of a trend comparison; a trend spans two of these. */
  trendHalf: 30,
  /** Demand and search pressure — intent goes stale faster than habit. */
  demand: 30,
  /** Campaign sends. */
  campaign: 90
} as const;

/**
 * Days of listing silence after which a listing is called stale.
 *
 * The Marketplace Brain question is "which listings are stale" (doc 21).
 * Ninety days without the owner touching anything — hours, packages, photos,
 * description — is the point where a customer arriving from the listing is
 * likely to find something different.
 */
export const LISTING_STALE_DAYS = 90;
