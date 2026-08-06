/**
 * Layer 5 (Reasoning) — the explanation vocabulary.
 *
 * AI Bible: every recommendation answers "why was this suggested?" — and the
 * trust rules require sponsored placements to be labeled, always. This module
 * makes both *structural*: an `Explanation` cannot exist without at least one
 * factor (`NonEmptyArray`), and a recommendation type that embeds a required
 * `Explanation` therefore cannot represent an unexplained suggestion at all.
 *
 * Factors are structured codes plus typed evidence, never prose — Layer 6
 * renders them into language; Layer 5 only ever assembles codes.
 */
import type {
  Confidence,
  EntityId,
  MoneyAmount,
  NonEmptyArray
} from "../core";
import type { TrustComponentKind } from "../trust-engine";

/**
 * The closed set of reasons the platform may give. Closed on purpose: a new
 * way of justifying a recommendation is a product decision (it must be
 * renderable, localizable, and honest), not a string someone logs.
 */
export type ReasonCode =
  | "budget_match"
  | "open_at_requested_time"
  | "available_for_party_size"
  | "close_to_user"
  | "close_to_plan_location"
  | "capability_match"
  | "preference_match"
  | "dietary_match"
  | "highly_rated_for_segment"
  | "trusted_provider"
  | "past_positive_visit"
  | "companion_history"
  | "fits_workspace_plan"
  | "recommended_with_existing_choice"
  | "campaign_active"
  | "trending"
  | "replacement_preserves_constraints"
  | "replacement_adds_capability"
  | "sponsored_placement";

/**
 * Typed evidence behind a factor. A discriminated union so each reason code
 * family carries exactly the data a renderer needs — "close to you" without
 * a distance is not a valid explanation.
 */
export type ExplanationEvidence =
  | { readonly kind: "budget"; readonly estimated: MoneyAmount; readonly limit: MoneyAmount | null }
  | { readonly kind: "distance"; readonly distanceKm: number }
  | { readonly kind: "capability"; readonly capabilityKeys: NonEmptyArray<string> }
  | { readonly kind: "preference"; readonly dimension: string; readonly matchedValue: string }
  | { readonly kind: "rating"; readonly rating: number; readonly reviewCount: number; readonly segment: string | null }
  | { readonly kind: "trust"; readonly overall: number; readonly strongestComponent: TrustComponentKind }
  | { readonly kind: "history"; readonly visitCount: number; readonly lastExperienceId: EntityId | null }
  | { readonly kind: "plan_link"; readonly workspaceId: EntityId; readonly linkedEntityId: EntityId | null }
  | { readonly kind: "campaign"; readonly campaignId: EntityId }
  | { readonly kind: "trend"; readonly changeRate: number }
  | { readonly kind: "constraint_diff"; readonly preservedKeys: readonly string[]; readonly gainedKeys: readonly string[]; readonly lostKeys: readonly string[] }
  | { readonly kind: "disclosure"; readonly sponsorEntityId: EntityId };

/**
 * One human-explainable factor: a reason code, the evidence that makes it
 * true, and how much it mattered. Layer 6 turns this into a sentence; it may
 * not invent factors that are not in the list.
 */
export interface ExplanationFactor {
  readonly code: ReasonCode;
  readonly evidence: ExplanationEvidence;
  /** Contribution to the final decision, in [0, 1]. */
  readonly weight: Confidence;
}

/**
 * Why something was recommended. `factors` is non-empty by type — the
 * "unexplained recommendation" is unrepresentable, which is the whole point
 * of this module.
 */
export interface Explanation {
  readonly factors: NonEmptyArray<ExplanationFactor>;
  /** The single factor a compact UI should lead with. */
  readonly primary: ExplanationFactor;
  readonly confidence: Confidence;
}
