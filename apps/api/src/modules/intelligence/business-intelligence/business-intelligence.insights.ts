/**
 * Layer 2 (Marketplace Intelligence) — owner-facing insights.
 *
 * PRINCIPLE (doc 23 v1.1 §13): ONE intelligence, TWO voices. Business
 * analytics consumes the SAME intelligence surface as consumer
 * recommendations — the same feature store, demand summaries, and reasoning
 * traces — expressed for the owner instead of the customer. There is no
 * separate analytics AI, and there must never be one: if the consumer side
 * learns something ("18% of users searched quiet workspaces near you"), the
 * owner side reads the same fact and adds the actionable gap ("you ranked
 * low because Wi-Fi info is missing").
 *
 * Structurally that means: everything here is a re-projection of types the
 * consumer path already uses (demand facts, capability keys, trust and
 * ranking gaps) — this file adds *shapes for the second voice*, never a
 * second source of truth. Imports `core` only.
 */
import type { Confidence, EntityId, IsoDateTime, TimeWindow } from "../core";

/**
 * Why a business under-performs for a demand it could serve. Mirrors the
 * consumer side exactly: each gap kind corresponds to a signal the ranking
 * contract already weighs — the owner hears the same reasons, inverted.
 */
export type DemandGapKind =
  | "capability_missing"
  | "capability_unverified"
  | "availability_gap"
  | "trust_gap"
  | "price_mismatch";

/**
 * One demand insight for an owner: local demand the business could capture,
 * and the specific gap costing it rank. Derived from the same
 * `DemandSummary` facts and ranking signals that consumer recommendations
 * consume — never computed by a separate pipeline.
 */
export interface DemandInsight {
  readonly businessId: EntityId;
  readonly neighborhoodId: EntityId | null;
  /** The demanded thing, as a capability/service key (`quiet_workspace`, `wifi`). */
  readonly demandedCapabilityKey: string;
  /** Share of local demand expressing this need, in [0, 1] ("18% of users"). */
  readonly demandShare: Confidence;
  readonly gap: DemandGapKind;
  /** The capability keys that would close the gap, when the gap is capability-shaped. */
  readonly closingCapabilityKeys: readonly string[];
  readonly window: TimeWindow;
  readonly computedAt: IsoDateTime;
}

/**
 * Query API of the owner voice. Implementations must be projections over the
 * consumer intelligence surface (feature store, marketplace facts,
 * recommendation traces) — an implementation with its own analytics model
 * violates the one-intelligence principle by construction.
 */
export interface OwnerInsightsProvider {
  demandInsights(businessId: EntityId): Promise<readonly DemandInsight[]>;
}
