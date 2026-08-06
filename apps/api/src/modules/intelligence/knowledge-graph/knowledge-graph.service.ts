/**
 * Layer 3 (Knowledge Graph) — the provider.
 *
 * Implements the frozen `KnowledgeGraphProvider` (Epic 03) and nothing else
 * of consequence: entity, entities, related, providersOfService, plus the
 * traversal contract Epic 04 adds. Every method delegates — this class exists
 * so consumers inject *one* token (`INTELLIGENCE_KNOWLEDGE_GRAPH`) and never
 * learn that a projection repository, an edge store, a cache and a traversal
 * walk sit behind it.
 *
 * Doc 16's rule, restated: "the AI never manually filters businesses; it asks
 * specialized services." This is the service it asks.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type { AnyRelationship, RelationshipKind } from "../relationship-engine";
import { GraphEntityService } from "./graph-entity.service";
import { GraphRelationshipService } from "./graph-relationship.service";
import { GraphTraversalService } from "./graph-traversal.service";
import type { AnyGraphEntity } from "./knowledge-graph.entities";
import type { KnowledgeGraphProvider } from "./knowledge-graph.provider";
import type {
  GraphTraversalContract,
  TraversalRequest,
  TraversalResult,
  TraversalStep
} from "./knowledge-graph.traversal";

@Injectable()
export class KnowledgeGraphService implements KnowledgeGraphProvider, GraphTraversalContract {
  constructor(
    private readonly entities_: GraphEntityService,
    private readonly relationships: GraphRelationshipService,
    private readonly traversal: GraphTraversalService
  ) {}

  entity(id: EntityId): Promise<AnyGraphEntity | null> {
    return this.entities_.entity(id);
  }

  entities(ids: readonly EntityId[]): Promise<ReadonlyMap<EntityId, AnyGraphEntity>> {
    return this.entities_.entities(ids);
  }

  related(id: EntityId, kinds?: readonly RelationshipKind[]): Promise<readonly AnyRelationship[]> {
    return this.relationships.related(id, kinds);
  }

  providersOfService(serviceId: EntityId): Promise<readonly EntityId[]> {
    return this.relationships.providersOfService(serviceId);
  }

  traverse(request: TraversalRequest): Promise<TraversalResult> {
    return this.traversal.traverse(request);
  }

  path(
    fromId: EntityId,
    toId: EntityId,
    options?: { readonly maxDepth?: number; readonly maxNodes?: number }
  ): Promise<readonly TraversalStep[] | null> {
    return this.traversal.path(fromId, toId, options);
  }

  /**
   * Whether explicit/inferred edges have storage yet.
   *
   * Exposed because it changes what an answer means: in projection-only mode
   * the absence of a `substitutes_for` edge means "nobody has computed one",
   * not "these providers do not substitute".
   */
  get projectionOnly(): boolean {
    return this.relationships.projectionOnly;
  }
}
