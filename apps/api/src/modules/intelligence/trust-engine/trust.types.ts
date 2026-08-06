/**
 * Layer 2 (Marketplace Intelligence) — the Trust Engine contract.
 *
 * Doc 21 names trust a *dedicated service*: identity, verification, response
 * behavior, fulfillment, review quality → a Trust Score (e.g. 96/100) that
 * makes recommendations explainable. This module is the score's shape only —
 * no scoring math ships in Epic 03. The contract exists now so ranking
 * (Layer 5) can require a `TrustScore` input before any implementation
 * exists. Imports `core` only.
 */
import type { Confidence, EntityId, IsoDateTime } from "../core";

/**
 * The eight trust components the corpus mandates. A closed union: a new
 * component is a deliberate architecture change, not a data drift.
 */
export type TrustComponentKind =
  | "identity_verification"
  | "business_verification"
  | "response_quality"
  | "fulfillment"
  | "cancellation_behavior"
  | "review_trust"
  | "media_quality"
  | "consistency";

/** One component's contribution to the overall score, with its evidence base. */
export interface TrustComponentScore {
  readonly kind: TrustComponentKind;
  /** Component score in [0, 100]. */
  readonly score: number;
  /** How many observations back this component (bookings, reviews, responses). */
  readonly evidenceCount: number;
  readonly confidence: Confidence;
  readonly updatedAt: IsoDateTime;
}

/**
 * The Trust Score contract. `components` is keyed by kind and total — every
 * component is always present, so a consumer can never mistake "not
 * computed" for "perfect score"; components without evidence carry
 * `evidenceCount: 0` and low confidence instead of being absent.
 */
export interface TrustScore {
  readonly entityId: EntityId;
  /** Overall trust in [0, 100] — the "96/100" a user sees. */
  readonly overall: number;
  readonly components: Readonly<Record<TrustComponentKind, TrustComponentScore>>;
  readonly computedAt: IsoDateTime;
}

/**
 * Read-side contract. Scoring runs in a future dedicated service; this
 * interface is what ranking and explanation depend on today.
 */
export interface TrustScoreProvider {
  score(entityId: EntityId): Promise<TrustScore | null>;
  scores(entityIds: readonly EntityId[]): Promise<ReadonlyMap<EntityId, TrustScore>>;
}
