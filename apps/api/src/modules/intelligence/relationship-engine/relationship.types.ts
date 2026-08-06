/**
 * Layer 3 (Knowledge Graph substrate) — the typed edge vocabulary.
 *
 * Exists because the graph's power is in its *edges*: "Haircut → provided by
 * 120 businesses" makes substitution trivial (doc 21), and relationship
 * inference (restaurant→cafe→hotel = business trips) is how the platform
 * understands people, not transactions. Nodes live in `knowledge-graph/`;
 * this module defines what can connect them, and imports only `core`.
 */
import type {
  Confidence,
  EntityId,
  IsoDateTime,
  KnowledgeSource
} from "../core";

/**
 * Registry of relationship kinds, keyed by kind name.
 *
 * An interface (not a closed union) so future verticals extend the vocabulary
 * via declaration merging — `declare module` adds a key — without editing this
 * file or widening to `string`. The value type documents what each kind's
 * edge `attributes` payload looks like.
 */
export interface RelationshipKindRegistry {
  /** Business → Service: the business offers this service. */
  readonly provides: { readonly priceTier: string | null };
  /** Business/Event → Location/Neighborhood: physical placement. */
  readonly located_in: { readonly address: string | null };
  /** Customer → Business/Event: a verified past visit. */
  readonly visited: { readonly visitCount: number; readonly lastVisitAt: IsoDateTime | null };
  /** Customer → Business/Service/Category: an inferred or stated taste. */
  readonly prefers: { readonly strength: Confidence };
  /** Business ↔ Business: frequently recommended in the same plan. */
  readonly recommended_with: { readonly coOccurrenceCount: number };
  /** Business → Business: can replace it under the same constraints (Marketplace Brain). */
  readonly substitutes_for: { readonly constraintOverlap: Confidence };
  /** Service ↔ Service: booked together in one experience (Marketplace Brain). */
  readonly booked_together: { readonly coBookingCount: number };
  /** Entity → Experience/Workspace: belongs to a larger composed whole. */
  readonly part_of: { readonly role: string | null };
  /** Business ↔ Business: complementary providers that should collaborate (Marketplace Brain). */
  readonly collaborates_with: { readonly sharedCustomerCount: number };
}

/** The open set of relationship kind names. */
export type RelationshipKind = keyof RelationshipKindRegistry;

/**
 * A directed, typed, confidence-scored edge between two graph entities.
 *
 * Every edge carries provenance and confidence because inferred relationships
 * ("beauty routine") and verified ones ("visited") must never be
 * indistinguishable — ranking and trust both read the difference.
 */
export interface Relationship<TKind extends RelationshipKind = RelationshipKind> {
  readonly kind: TKind;
  readonly fromId: EntityId;
  readonly toId: EntityId;
  /** Kind-specific payload, typed by the registry. */
  readonly attributes: RelationshipKindRegistry[TKind];
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly updatedAt: IsoDateTime;
}

/** Convenience alias: any edge regardless of kind. */
export type AnyRelationship = Relationship;
