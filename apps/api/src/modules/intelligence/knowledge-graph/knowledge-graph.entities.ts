/**
 * Layer 3 (Knowledge Graph) — the fifteen node kinds and their metadata.
 *
 * Metadata payloads encode "facts, not filters" (doc 21): structured
 * capabilities Gurman can reason over ("capacity ≥ 80, private room,
 * parking"), never review prose. Each entity is `GraphEntity<type, metadata>`
 * so every node still exposes exactly the six uniform fields.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  GeoPoint,
  IsoDate,
  IsoDateTime,
  KnowledgeFact,
  TimeWindow,
  WeeklyWindow
} from "../core";
import type { GraphEntity } from "./knowledge-graph.entity";

/**
 * A single structured capability of a provider (doc 16: businesses are
 * Experience Providers exposing capabilities, not listings). `value` is a
 * typed fact — boolean for "has parking", number for "capacity", string for
 * "noise level" — and always carries provenance so verified capabilities
 * outrank scraped ones.
 */
export interface CapabilityFact {
  /** Stable capability key, e.g. `capacity`, `parking`, `private_rooms`, `halal`. */
  readonly key: string;
  readonly fact: KnowledgeFact<boolean | number | string>;
}

/** Price tiers as used across the marketplace (`$` … `$$$$`). */
export type PriceTier = "$" | "$$" | "$$$" | "$$$$";

/** A provider of experiences: the central supply-side node. */
export interface BusinessMetadata {
  readonly name: string;
  readonly slug: string;
  readonly categoryId: EntityId | null;
  readonly neighborhoodId: EntityId | null;
  readonly priceTier: PriceTier | null;
  /** The capability graph of this provider (doc 16). */
  readonly capabilities: readonly CapabilityFact[];
  readonly openingHours: readonly WeeklyWindow[];
  readonly verified: boolean;
}

export type BusinessEntity = GraphEntity<"business", BusinessMetadata>;

/**
 * A first-class service object ("Haircut"), deliberately independent of any
 * one business — doc 21: services as first-class objects make substitution
 * trivial ("Haircut → provided by 120 businesses").
 */
export interface ServiceMetadata {
  readonly name: string;
  readonly categoryId: EntityId | null;
  readonly typicalDurationMinutes: number | null;
  readonly typicalPrice: BudgetRange | null;
}

export type ServiceEntity = GraphEntity<"service", ServiceMetadata>;

/** A taxonomy node; navigational, never the unit of reasoning (AI Bible v1.1: intent over category). */
export interface CategoryMetadata {
  readonly name: string;
  readonly slug: string;
  readonly parentCategoryId: EntityId | null;
}

export type CategoryEntity = GraphEntity<"category", CategoryMetadata>;

/**
 * The center of the database (doc 21): not Business → bookings → reviews but
 * Experience → businesses, people, timeline, AI, tasks, payments, memories.
 * The rich composition shape lives in `experience-graph/`; this node carries
 * the graph-resident identity facts.
 */
export interface ExperienceMetadata {
  readonly experienceType: ExperienceType;
  readonly title: string;
  readonly workspaceId: EntityId | null;
  readonly scheduledFor: IsoDate | null;
  readonly guestCount: number | null;
  readonly budget: BudgetRange | null;
  readonly status: "planning" | "confirmed" | "completed" | "archived";
}

export type ExperienceEntity = GraphEntity<"experience", ExperienceMetadata>;

/** The Smart Plan Workspace: a domain model, not a UI feature (governance v1.1). */
export interface WorkspaceMetadata {
  readonly title: string;
  readonly ownerCustomerId: EntityId;
  readonly experienceIds: readonly EntityId[];
  readonly archived: boolean;
}

export type WorkspaceEntity = GraphEntity<"workspace", WorkspaceMetadata>;

/** The demand-side node. Preference knowledge lives in Layer 4 memory, not here. */
export interface CustomerMetadata {
  readonly displayName: string;
  readonly locale: "uz" | "ru" | "en";
  readonly homeNeighborhoodId: EntityId | null;
  readonly memberSince: IsoDate;
}

export type CustomerEntity = GraphEntity<"customer", CustomerMetadata>;

/** A merchant campaign; connected to experiences it should surface in. */
export interface CampaignMetadata {
  readonly title: string;
  readonly businessId: EntityId;
  readonly window: TimeWindow;
  readonly discountPercent: number | null;
}

export type CampaignEntity = GraphEntity<"campaign", CampaignMetadata>;

/** A story post; graph-visible because stories feed capability signals. */
export interface StoryMetadata {
  readonly authorEntityId: EntityId;
  readonly businessId: EntityId | null;
  readonly publishedAt: IsoDateTime;
  readonly expiresAt: IsoDateTime | null;
}

export type StoryEntity = GraphEntity<"story", StoryMetadata>;

/**
 * A review as a graph node: the platform reasons over its *extracted
 * signals* ("parking was terrible" → `parking_score -1`, doc 16), never over
 * raw prose in this layer.
 */
export interface ReviewMetadata {
  readonly businessId: EntityId;
  readonly customerId: EntityId | null;
  readonly rating: number;
  readonly verifiedVisit: boolean;
  /** Structured signals extracted from the review text (doc 16). */
  readonly extractedSignals: readonly CapabilityFact[];
}

export type ReviewEntity = GraphEntity<"review", ReviewMetadata>;

/** A booking: the transactional edge between customer, service, and time. */
export interface BookingMetadata {
  readonly customerId: EntityId;
  readonly businessId: EntityId;
  readonly serviceId: EntityId | null;
  readonly experienceId: EntityId | null;
  readonly window: TimeWindow;
  readonly status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  readonly partySize: number | null;
}

export type BookingEntity = GraphEntity<"booking", BookingMetadata>;

/** A concrete point/place (address-level), distinct from the area it sits in. */
export interface LocationMetadata {
  readonly address: string;
  readonly point: GeoPoint;
  readonly neighborhoodId: EntityId | null;
}

export type LocationEntity = GraphEntity<"location", LocationMetadata>;

/** An area with marketplace character ("which neighborhoods are underserved" — Marketplace Brain). */
export interface NeighborhoodMetadata {
  readonly name: string;
  readonly city: string;
  readonly centroid: GeoPoint | null;
}

export type NeighborhoodEntity = GraphEntity<"neighborhood", NeighborhoodMetadata>;

/** A dated public happening (concert, holiday market) that shifts demand. */
export interface EventMetadata {
  readonly title: string;
  readonly window: TimeWindow;
  readonly locationId: EntityId | null;
  readonly expectedAttendance: number | null;
}

export type EventEntity = GraphEntity<"event", EventMetadata>;

/** A legal/operational umbrella owning one or more businesses. */
export interface OrganizationMetadata {
  readonly name: string;
  readonly businessIds: readonly EntityId[];
  readonly verified: boolean;
}

export type OrganizationEntity = GraphEntity<"organization", OrganizationMetadata>;

/**
 * A reified edge: a relationship promoted to a node so the graph can attach
 * knowledge *about the connection itself* (e.g. evidence for "substitutes_for",
 * or the inferred "beauty routine" chain from doc 22).
 */
export interface RelationshipEntityMetadata {
  readonly kind: string;
  readonly fromId: EntityId;
  readonly toId: EntityId;
  readonly evidenceCount: number;
  readonly inferenceConfidence: Confidence;
}

export type RelationshipEntity = GraphEntity<"relationship", RelationshipEntityMetadata>;

/** Any node in the knowledge graph. */
export type AnyGraphEntity =
  | BusinessEntity
  | ServiceEntity
  | CategoryEntity
  | ExperienceEntity
  | WorkspaceEntity
  | CustomerEntity
  | CampaignEntity
  | StoryEntity
  | ReviewEntity
  | BookingEntity
  | LocationEntity
  | NeighborhoodEntity
  | EventEntity
  | OrganizationEntity
  | RelationshipEntity;
