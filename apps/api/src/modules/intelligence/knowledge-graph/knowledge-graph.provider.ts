/**
 * Layer 3 (Knowledge Graph) — the read-side contract.
 *
 * Doc 16's architectural rule: "the AI never manually filters businesses; it
 * asks specialized services." This interface is what gets asked. Storage
 * (Prisma today, a graph store later) is an implementation detail behind it.
 */
import type { EntityId } from "../core";
import type { AnyRelationship, RelationshipKind } from "../relationship-engine";
import type { AnyGraphEntity } from "./knowledge-graph.entities";

export interface KnowledgeGraphProvider {
  entity(id: EntityId): Promise<AnyGraphEntity | null>;
  entities(ids: readonly EntityId[]): Promise<ReadonlyMap<EntityId, AnyGraphEntity>>;
  /** Edges from an entity, optionally filtered by kind. */
  related(id: EntityId, kinds?: readonly RelationshipKind[]): Promise<readonly AnyRelationship[]>;
  /** All providers of one service — "Haircut → provided by 120 businesses" (doc 21). */
  providersOfService(serviceId: EntityId): Promise<readonly EntityId[]>;
}
