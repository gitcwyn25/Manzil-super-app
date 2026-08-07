/**
 * Layer 2 (Marketplace Intelligence) — identity of a stored summary.
 *
 * Doc 22 is emphatic: summaries are **stored and refreshed by jobs, never
 * regenerated per query**. That makes a summary a *slot*, exactly as a memory
 * object is:
 *
 * ```text
 * (kind, subjectId) → one stored summary
 * ```
 *
 * Which produces the same three properties Epic 05 got from the same choice:
 * writes are idempotent (one row, in Postgres and in memory alike), rewrites
 * cannot accumulate, and the derived `summaryId` stays stable across
 * recomputes so a recommendation trace that names the summary it consulted
 * still resolves tomorrow.
 *
 * **Neighborhood and service ids.** Layer 2 may not import Layer 3, so this
 * file re-declares the id convention the knowledge graph uses rather than
 * importing `neighborhoodGraphId`. The duplication is deliberate and one line
 * long; the alternative is an upward import that breaks the isolation
 * invariant `ARCHITECTURE.md` is built on. `marketplace-intelligence.spec.ts`
 * pins the format so the two cannot drift apart silently.
 *
 * Imports `core` only.
 */
import type { EntityId } from "../core";

/**
 * What a stored summary is about.
 *
 * The seven summarizers the epic names, plus the three feature vectors —
 * because a feature vector *is* a summary of a different kind: same
 * `(kind, subject)` slot, same provenance quartet, same freshness policy, same
 * job-only write path. A second table would duplicate a lifecycle without
 * adding a distinction any code makes.
 */
export type SummaryKind =
  | "business"
  | "customer"
  | "neighborhood"
  | "service"
  | "trend"
  | "campaign"
  | "workspace"
  | "demand"
  | "demand_prediction"
  | "business_features"
  | "customer_features"
  | "neighborhood_features";

/** The kinds, as runtime data; exhaustive by construction. */
const SUMMARY_KIND_KEYS = {
  business: true,
  customer: true,
  neighborhood: true,
  service: true,
  trend: true,
  campaign: true,
  workspace: true,
  demand: true,
  demand_prediction: true,
  business_features: true,
  customer_features: true,
  neighborhood_features: true
} as const satisfies Readonly<Record<SummaryKind, true>>;

/** Every summary kind, in declaration order. */
export const SUMMARY_KINDS = Object.keys(SUMMARY_KIND_KEYS) as readonly SummaryKind[];

/** True when `value` names a summary kind this build understands. */
export function isSummaryKind(value: string): value is SummaryKind {
  return Object.prototype.hasOwnProperty.call(SUMMARY_KIND_KEYS, value);
}

/** One stored summary's address. */
export interface SummarySlot {
  readonly kind: SummaryKind;
  readonly subjectId: EntityId;
}

/** Storage key of a slot — the unique index, spelled out. */
export function summarySlotKey(slot: SummarySlot): string {
  return `${slot.kind}:${slot.subjectId}`;
}

/**
 * Stable identity of the knowledge in a slot.
 *
 * Derived, never random, for the reason doc 23 §9 exists: a recommendation
 * records the knowledge it consulted, and a fresh uuid per recompute would
 * make yesterday's trace point at nothing the moment the nightly job ran.
 */
export function summaryId(slot: SummarySlot): EntityId {
  return `summary:${summarySlotKey(slot)}`;
}

/** Separator of the composite ids this layer mints. */
export const MARKETPLACE_ID_SEPARATOR = ":";

/**
 * Id of a neighborhood — the `(city, district)` pair carried by business rows.
 *
 * No Neighborhood table exists, so the id *is* the key, reversibly encoded.
 * Byte-identical to `knowledge-graph`'s `neighborhoodGraphId`, deliberately.
 */
export function neighborhoodId(city: string, district: string): EntityId {
  return ["neighborhood", encodeURIComponent(city), encodeURIComponent(district)].join(
    MARKETPLACE_ID_SEPARATOR
  );
}

export interface NeighborhoodKey {
  readonly city: string;
  readonly district: string;
}

/** Recovers `{ city, district }`, or null when the id is not one. */
export function parseNeighborhoodId(id: EntityId): NeighborhoodKey | null {
  const parts = id.split(MARKETPLACE_ID_SEPARATOR);
  if (parts.length !== 3 || parts[0] !== "neighborhood") return null;

  try {
    const city = decodeURIComponent(parts[1] as string);
    const district = decodeURIComponent(parts[2] as string);
    return city && district ? { city, district } : null;
  } catch {
    return null;
  }
}

/**
 * Id of a *service* as the marketplace sees it.
 *
 * A `BusinessPackage` row is one provider's offering; the marketplace-level
 * service ("Haircut, across every provider") is the normalized name, which is
 * the only cross-business identity the schema carries. Epic 04 reached the
 * same conclusion from the graph side and matches on the same normalization.
 */
export function serviceKeyId(normalizedName: string): EntityId {
  return ["service-market", encodeURIComponent(normalizedName)].join(MARKETPLACE_ID_SEPARATOR);
}

/** Recovers the normalized service name, or null. */
export function parseServiceKeyId(id: EntityId): string | null {
  const parts = id.split(MARKETPLACE_ID_SEPARATOR);
  if (parts.length !== 2 || parts[0] !== "service-market") return null;

  try {
    const name = decodeURIComponent(parts[1] as string);
    return name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

/**
 * The subject of marketplace-wide knowledge.
 *
 * Manzil is one city, so the market has one subject — the same decision the
 * memory engine made for `marketplace_context`. When the platform becomes
 * multi-city this constant becomes a city id and nothing else changes.
 */
export const MARKETPLACE_SUBJECT_ID = "marketplace";

/**
 * Slot subject of a demand question, which is always a *pair*: what is wanted,
 * and where. `null` area means city-wide.
 */
export function demandSubjectId(
  serviceOrCategoryId: EntityId,
  areaId: EntityId | null
): EntityId {
  return areaId === null ? serviceOrCategoryId : `${serviceOrCategoryId}@${areaId}`;
}

/** Recovers `{ serviceOrCategoryId, areaId }` from a demand subject. */
export function parseDemandSubjectId(subjectId: EntityId): {
  readonly serviceOrCategoryId: EntityId;
  readonly areaId: EntityId | null;
} {
  const at = subjectId.indexOf("@");

  return at <= 0
    ? { serviceOrCategoryId: subjectId, areaId: null }
    : { serviceOrCategoryId: subjectId.slice(0, at), areaId: subjectId.slice(at + 1) };
}
