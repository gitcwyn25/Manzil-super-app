/**
 * Layer 2 (Marketplace Intelligence) — the relational projection, as pure
 * functions and row shapes.
 *
 * Every mapping decision between a Postgres row and a Layer 2 fact lives here,
 * so `marketplace-projection.repository.ts` is queries and budgets and nothing
 * else, and so summarizer correctness is testable without a database.
 *
 * The row shapes are declared structurally rather than imported from
 * `@prisma/client`: the repository `select`s exactly these columns, the pure
 * functions accept exactly this much, and a test can hand them a literal. It
 * also keeps this file honest about what the schema actually carries — the
 * absences below (party size, capacity, capabilities, workspaces) are the
 * reason several models in this module refuse to answer.
 *
 * Imports `core` only.
 */
import type { EntityId, IsoDateTime, KnowledgeSource } from "../core";
import { MARKETPLACE_UTC_OFFSET_MINUTES, localParts, roundTo } from "./marketplace-intelligence.statistics";
import { neighborhoodId } from "./marketplace-intelligence.slots";

/** Prisma `Decimal`, as much of it as this module touches. */
export interface DecimalLike {
  toString(): string;
}

/** Booking lifecycle, mirroring the `BookingStatus` enum. */
export type BookingStatusName = "pending" | "confirmed" | "canceled" | "completed" | "no_show";

/** Review moderation, mirroring `ModerationStatus`. */
export type ModerationStatusName = "pending" | "approved" | "rejected";

/** Campaign delivery, mirroring `CampaignSendStatus`. */
export type CampaignSendStatusName =
  | "pending"
  | "sent"
  | "failed"
  | "blocked_no_consent"
  | "blocked_no_channel";

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export interface BusinessIntelligenceRow {
  readonly id: string;
  readonly categoryId: string;
  readonly categorySlug: string | null;
  readonly city: string;
  readonly district: string;
  readonly priceTier: string | null;
  readonly status: string;
  readonly verificationStatus: string;
  readonly avgRating: DecimalLike | null;
  readonly reviewCount: number;
  readonly lat: DecimalLike | null;
  readonly lng: DecimalLike | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ReviewIntelligenceRow {
  readonly id: string;
  readonly businessId: string;
  readonly userId: string;
  readonly rating: number;
  readonly text: string;
  readonly moderationStatus: string;
  readonly bookingId: string | null;
  readonly createdAt: Date;
  /** True when the owner replied — the only response signal the schema has. */
  readonly hasReply: boolean;
}

export interface BookingIntelligenceRow {
  readonly id: string;
  readonly businessId: string;
  readonly customerId: string | null;
  readonly serviceName: string;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly status: string;
  readonly createdAt: Date;
}

export interface VisitIntelligenceRow {
  readonly businessId: string;
  readonly customerId: string;
  readonly occurredAt: Date;
}

/** One analytics event — `BusinessEvent`: view, call, directions, message. */
export interface BusinessEventRow {
  readonly businessId: string;
  readonly type: string;
  readonly visitorKey: string | null;
  readonly createdAt: Date;
}

export interface PackageIntelligenceRow {
  readonly id: string;
  readonly businessId: string;
  readonly name: string;
  readonly price: DecimalLike;
  readonly currency: string;
  readonly isActive: boolean;
  readonly updatedAt: Date;
}

export interface CustomerIntelligenceRow {
  readonly id: string;
  readonly businessId: string;
  readonly userId: string | null;
  readonly tags: readonly string[];
  readonly visitCount: number;
  readonly totalSpend: DecimalLike;
  readonly lastVisitAt: Date | null;
  readonly firstSeenAt: Date;
  readonly birthday: Date | null;
  readonly updatedAt: Date;
}

/** One logged search — the platform's only first-party demand signal. */
export interface SearchLogRow {
  readonly query: string;
  readonly district: string | null;
  readonly categorySlug: string | null;
  readonly resultCount: number;
  readonly clickedBusinessId: string | null;
  readonly createdAt: Date;
}

export interface CampaignRow {
  readonly id: string;
  readonly businessId: string;
  readonly trigger: string;
  readonly channel: string;
  readonly isActive: boolean;
}

export interface CampaignSendRow {
  readonly campaignId: string;
  readonly customerId: string;
  readonly status: string;
  readonly channel: string;
  readonly consentAtSend: boolean;
  readonly createdAt: Date;
  readonly sentAt: Date | null;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** A `Date` as the ISO string every contract in this platform speaks. */
export function toIso(value: Date): IsoDateTime {
  return value.toISOString();
}

/** A Prisma decimal as a number; 0 when it cannot be read. */
export function decimalToNumber(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A decimal as a number, or null — for coordinates, where 0 is a real place. */
export function decimalOrNull(value: DecimalLike | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Cross-business identity of a service.
 *
 * `BusinessPackage` rows are per provider, so "Haircut at 120 businesses"
 * (doc 21) joins on the name. Lower-cased, inner whitespace collapsed — the
 * same normalization `knowledge-graph.projection` applies, so the graph and
 * this layer agree about what one service is.
 */
export function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Price tier as an ordinal level in [0, 1].
 *
 * `Business.priceTier` is merchant input and free text in the schema; the
 * three values the product uses are budget/mid/premium. An unrecognized value
 * maps to null rather than to the middle — guessing "mid" would silently
 * invent a price level for every mistyped row.
 */
export function priceTierLevel(priceTier: string | null | undefined): number | null {
  switch ((priceTier ?? "").trim().toLowerCase()) {
    case "budget":
    case "low":
    case "$":
      return 0;
    case "mid":
    case "medium":
    case "$$":
      return 0.5;
    case "premium":
    case "high":
    case "luxury":
    case "$$$":
      return 1;
    default:
      return null;
  }
}

/** True when a booking has reached a terminal state we can count outcomes on. */
export function isTerminalBooking(status: string): boolean {
  return status === "completed" || status === "canceled" || status === "no_show";
}

/** True when a booking represents a visit that actually happened. */
export function isCompletedBooking(status: string): boolean {
  return status === "completed";
}

/** True when a booking was called off — cancellations and no-shows both. */
export function isCanceledBooking(status: string): boolean {
  return status === "canceled" || status === "no_show";
}

/** True when a review is publicly visible and may inform a summary. */
export function isPublishedReview(moderationStatus: string): boolean {
  return moderationStatus === "approved";
}

/** The neighborhood a business sits in. */
export function neighborhoodOf(business: BusinessIntelligenceRow): EntityId {
  return neighborhoodId(business.city, business.district);
}

/** Minutes a booking occupied, or null when it has no end time. */
export function bookingMinutes(booking: BookingIntelligenceRow): number | null {
  if (!booking.endsAt) return null;

  const minutes = (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000;
  // Zero-length and negative rows are data defects, not fifteen-second visits.
  return minutes > 0 ? roundTo(minutes, 0) : null;
}

/** Hours between a booking being made and starting — the lead time. */
export function bookingLeadHours(booking: BookingIntelligenceRow): number | null {
  const hours = (booking.startsAt.getTime() - booking.createdAt.getTime()) / 3_600_000;
  return hours >= 0 ? roundTo(hours, 1) : null;
}

/**
 * The identity a customer row belongs to.
 *
 * `Customer` is business-scoped and unique on `(businessId, phone)`, so one
 * person known to three providers is three rows. The account id is the only
 * cross-business link the schema carries; without one the row is its own
 * identity. Epic 04 and Epic 05 both resolved this the same way, and this
 * layer must agree with them or the same person will be counted twice in one
 * summary and once in another.
 */
export function customerIdentity(customer: CustomerIntelligenceRow): string {
  return customer.userId ? `user:${customer.userId}` : `customer:${customer.id}`;
}

/** Spend per visit for one CRM row, or null when the row records no visits. */
export function spendPerVisit(customer: CustomerIntelligenceRow): number | null {
  if (customer.visitCount <= 0) return null;

  const total = decimalToNumber(customer.totalSpend);
  return total > 0 ? roundTo(total / customer.visitCount, 2) : null;
}

/** The local hour a row was observed at, for day-part and peak analysis. */
export function localHourOf(at: Date, offsetMinutes = MARKETPLACE_UTC_OFFSET_MINUTES): number {
  return localParts(at, offsetMinutes).hour;
}

/**
 * Provenance of a derived fact.
 *
 * The source names the *rows* a fact restates, not the act of deriving it —
 * `visit` for something counted off visit rows, `review` off reviews,
 * `merchant_input` off what an owner typed. `platform_inference` is reserved
 * for facts that are the platform's own reading rather than a restatement
 * (a rank against peers, a predicted demand, an aspect read out of prose).
 * Epic 05 drew the same line and it is what lets the trust layer distinguish
 * "you were booked 40 times" from "so you are popular".
 */
export const FACT_SOURCE = {
  booking: "booking",
  visit: "visit",
  review: "review",
  merchantInput: "merchant_input",
  campaign: "campaign",
  inference: "platform_inference"
} as const satisfies Readonly<Record<string, KnowledgeSource>>;
