/**
 * Layer 3 (Knowledge Graph) — the node contract.
 *
 * The knowledge graph is the moat (doc 22): businesses, services, and
 * experiences as *connected structured facts*, not rows behind a search box.
 * Every node exposes exactly six fields — `id`, `type`, `relationships`,
 * `metadata`, `confidence`, `updatedAt` — so graph traversal code can treat
 * all entities uniformly while `type` discriminates the `metadata` payload.
 *
 * Imports only `core` and the edge vocabulary (`relationship-engine`); never
 * memory (Layer 4) or reasoning (Layer 5).
 */
import type { Confidence, EntityId, IsoDateTime } from "../core";
import type { AnyRelationship } from "../relationship-engine";

/** The closed set of node kinds the graph understands today. */
export type GraphEntityType =
  | "business"
  | "service"
  | "category"
  | "experience"
  | "workspace"
  | "customer"
  | "campaign"
  | "story"
  | "review"
  | "booking"
  | "location"
  | "neighborhood"
  | "event"
  | "organization"
  | "relationship";

/**
 * The uniform node shape. Exactly these six fields — no entity adds a
 * seventh, so traversal, caching, and serialization code never needs
 * per-entity special cases. Entity-specific knowledge lives in `metadata`,
 * discriminated by `type`.
 *
 * `confidence` is node-level: how sure the platform is that this entity's
 * metadata reflects reality (a freshly scraped listing scores lower than a
 * verified, owner-managed profile).
 */
export interface GraphEntity<
  TType extends GraphEntityType,
  TMetadata extends object
> {
  readonly id: EntityId;
  readonly type: TType;
  readonly relationships: readonly AnyRelationship[];
  readonly metadata: TMetadata;
  readonly confidence: Confidence;
  readonly updatedAt: IsoDateTime;
}
