/**
 * Layer 3 (Knowledge Graph) — the edge kinds Epic 04 adds to the registry.
 *
 * `RelationshipKindRegistry` (relationship-engine) is deliberately an
 * interface, not a closed union, "so future verticals extend the vocabulary
 * via declaration merging — `declare module` adds a key — without editing
 * this file or widening to `string`". Epic 04 is the first such extension:
 * the nine kinds the knowledge graph projects or reserves are declared here,
 * next to the projection that produces them, and the frozen Epic 03 file is
 * never touched.
 *
 * Importing anything from this module loads the augmentation, which is why
 * every producer of edges imports `relationship()` from here rather than
 * hand-building object literals.
 */
import type { Confidence, EntityId, IsoDateTime, KnowledgeSource } from "../core";
import type { Relationship, RelationshipKind, RelationshipKindRegistry } from "../relationship-engine";

declare module "../relationship-engine/relationship.types" {
  interface RelationshipKindRegistry {
    /** Business → Category: the taxonomy node this provider sits under. */
    readonly belongs_to: { readonly primary: boolean };
    /** Customer → Service: the service was booked, with recency and volume. */
    readonly booked: { readonly bookingCount: number; readonly lastBookedAt: IsoDateTime | null };
    /** Review → Business: the review is *about* this provider. */
    readonly describes: { readonly rating: number; readonly verifiedVisit: boolean };
    /** Campaign → Business: the campaign markets this provider. */
    readonly promotes: { readonly channel: string; readonly active: boolean };
    /** Workspace → Experience: the plan workspace holds this experience. */
    readonly contains: { readonly position: number | null };
    /** Business → Experience: the provider is part of a composed experience. */
    readonly participates_in: { readonly bookingCount: number };
    /** Service → Experience type: the service is a building block of it. */
    readonly supports: { readonly experienceType: string };
    /** Story → Business: the story mentions this provider. */
    readonly references: { readonly mentionCount: number };
  }
}

/**
 * Where an edge came from, at storage granularity.
 *
 * The orchestrator's word for projected edges is "relational"; the frozen
 * `KnowledgeSource` union (core/core.primitives) has no such member and is a
 * closed type alias, so it cannot be augmented the way the kind registry can.
 * Rather than widen a frozen contract, provenance is carried twice, each in
 * its natural place: `KnowledgeSource` on the edge itself (per-kind, and
 * strictly more precise than "relational" — a visit edge says `visit`, a
 * review edge says `review`), and this origin discriminator on the stored
 * row, which is what tells an explicit merchant-declared edge apart from a
 * projected one when both carry `merchant_input`.
 */
export type GraphEdgeOrigin = "relational" | "explicit" | "inferred";

/** The kinds Epic 04 projects out of existing relational data. */
export type ProjectedRelationshipKind =
  | "belongs_to"
  | "located_in"
  | "provides"
  | "visited"
  | "booked"
  | "describes"
  | "promotes";

/**
 * The `KnowledgeSource` each projected kind carries.
 *
 * Read this as the answer to "why does the platform believe this edge?" — a
 * `visited` edge is believed because a visit was recorded, a `describes` edge
 * because a review was written. `merchant_input` covers the edges that are
 * facts of the merchant's own record (its category, its address, its menu of
 * packages).
 */
export const RELATIONAL_EDGE_SOURCE = {
  belongs_to: "merchant_input",
  located_in: "merchant_input",
  provides: "merchant_input",
  visited: "visit",
  booked: "booking",
  describes: "review",
  promotes: "campaign"
} as const satisfies Readonly<Record<ProjectedRelationshipKind, KnowledgeSource>>;

/**
 * Confidence of a relational projection.
 *
 * 1.0 without qualification: a projected edge is a lossless restatement of a
 * row that already exists — the platform is exactly as sure of it as it is of
 * its own database. Anything less than certainty belongs to inference.
 */
export const PROJECTION_CONFIDENCE: Confidence = 1;

/** Provenance of every edge produced by relationship inference. */
export const INFERENCE_SOURCE: KnowledgeSource = "platform_inference";

/**
 * The edge kinds this build understands: the nine frozen in Epic 03 plus the
 * eight added above.
 *
 * The registry is an open interface, so this list is knowingly partial — it
 * is not "every kind that can exist", it is "every kind this deployment can
 * traverse". Stored rows are screened against it so an edge written by a
 * future vertical cannot arrive as an untraversable kind and be served as if
 * it meant something here.
 */
export const KNOWN_RELATIONSHIP_KINDS: ReadonlySet<string> = new Set(
  [
    "provides",
    "located_in",
    "visited",
    "prefers",
    "recommended_with",
    "substitutes_for",
    "booked_together",
    "part_of",
    "collaborates_with",
    "belongs_to",
    "booked",
    "describes",
    "promotes",
    "contains",
    "participates_in",
    "supports",
    "references"
  ] as const satisfies readonly RelationshipKind[]
);

/**
 * Builds one typed edge.
 *
 * A factory rather than object literals at each call site because `kind` and
 * `attributes` must agree — the generic ties them to the registry, so an edge
 * whose payload does not match its kind fails to compile.
 */
export function relationship<TKind extends RelationshipKind>(input: {
  readonly kind: TKind;
  readonly fromId: EntityId;
  readonly toId: EntityId;
  readonly attributes: RelationshipKindRegistry[TKind];
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly updatedAt: IsoDateTime;
}): Relationship<TKind> {
  return {
    kind: input.kind,
    fromId: input.fromId,
    toId: input.toId,
    attributes: input.attributes,
    source: input.source,
    confidence: input.confidence,
    updatedAt: input.updatedAt
  };
}

/**
 * Stable identity of an edge: two edges with the same key are the same
 * statement about the world and must never both survive a merge. Also the
 * uniqueness key of the gated `GraphRelationship` table, so deduplication in
 * memory and in Postgres agree by construction.
 */
export function relationshipKey(edge: {
  readonly kind: string;
  readonly fromId: EntityId;
  readonly toId: EntityId;
}): string {
  return `${edge.kind}|${edge.fromId}|${edge.toId}`;
}
