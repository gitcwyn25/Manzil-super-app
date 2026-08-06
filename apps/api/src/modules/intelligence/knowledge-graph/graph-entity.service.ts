/**
 * Layer 3 (Knowledge Graph) — entity reads.
 *
 * Three responsibilities, in this order: cache, project, screen. Nothing
 * leaves this service that has not passed `sanitizeGraphEntity`, so a
 * consumer never has to ask whether a node it was handed is well-formed.
 */
import { Injectable, Logger } from "@nestjs/common";
import type { EntityId } from "../core";
import type { AnyGraphEntity } from "./knowledge-graph.entities";
import type { GraphEntityType } from "./knowledge-graph.entity";
import { GraphCacheService, GRAPH_CACHE_TTL } from "./graph-cache.service";
import { GraphProjectionRepository } from "./graph-projection.repository";
import { parseGraphId } from "./knowledge-graph.ids";
import { KNOWN_RELATIONSHIP_KINDS } from "./knowledge-graph.relationships";
import { sanitizeGraphEntity } from "./knowledge-graph.validation";

/**
 * Node kinds a model backs today. The other seven are contract-only: the
 * frozen entity contract names them, no table holds them, and Epic 04
 * invents neither table nor data for them (Story most explicitly — see
 * KNOWLEDGE-GRAPH.md).
 */
export const PROJECTED_ENTITY_TYPES: ReadonlySet<GraphEntityType> = new Set([
  "business",
  "category",
  "service",
  "customer",
  "review",
  "campaign",
  "booking",
  "neighborhood"
]);

@Injectable()
export class GraphEntityService {
  private readonly logger = new Logger(GraphEntityService.name);

  constructor(
    private readonly projection: GraphProjectionRepository,
    private readonly cache: GraphCacheService
  ) {}

  /** True when the id names a node kind something can actually resolve. */
  isProjected(id: EntityId): boolean {
    const parsed = parseGraphId(id);
    return parsed !== null && PROJECTED_ENTITY_TYPES.has(parsed.type);
  }

  async entity(id: EntityId): Promise<AnyGraphEntity | null> {
    if (!this.isProjected(id)) {
      // Not an error: asking the graph for an experience before experiences
      // exist is a legitimate question with the honest answer "nothing".
      return null;
    }

    return this.cache.read(`entity:${id}`, GRAPH_CACHE_TTL.entity, async () => {
      const projected = await this.projection.entity(id);
      if (!projected) return null;

      const sanitized = sanitizeGraphEntity(projected, { knownKinds: KNOWN_RELATIONSHIP_KINDS });

      if (sanitized.entity === null) {
        this.logger.warn(
          `graph entity ${id} withheld: ${sanitized.errors.map((error) => error.kind).join(",")}`
        );
        return null;
      }

      if (sanitized.droppedEdges > 0) {
        this.logger.warn(`graph entity ${id}: dropped ${sanitized.droppedEdges} invalid edge(s)`);
      }

      return sanitized.entity;
    });
  }

  /**
   * Batch read. Resolved per id rather than per table because each node kind
   * needs its own fan-in queries anyway, and the cache absorbs the repeats —
   * a warm graph answers a 50-id batch without touching Postgres at all.
   */
  async entities(ids: readonly EntityId[]): Promise<ReadonlyMap<EntityId, AnyGraphEntity>> {
    const resolved = await Promise.all(
      [...new Set(ids)].map(async (id) => [id, await this.entity(id)] as const)
    );

    const found = new Map<EntityId, AnyGraphEntity>();
    for (const [id, entity] of resolved) {
      if (entity) found.set(id, entity);
    }

    return found;
  }
}
