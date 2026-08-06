/**
 * Layer 3 (Knowledge Graph) — DI wiring, as a provider array.
 *
 * A `Provider[]` rather than a Nest module, following `MEDIA_STORAGE_PROVIDER`
 * (the repo's established pattern for a token/implementation pair), for one
 * structural reason: this layer needs `PrismaService`, which AppModule
 * provides directly and no module exports. A `KnowledgeGraphModule` would
 * have to provide its own `PrismaService` — a second Prisma client and a
 * second connection pool — or import a `PrismaModule` that does not exist.
 * Spreading an array into AppModule's provider list resolves both
 * dependencies from the injector that already owns them.
 *
 * `IntelligenceModule` stays provider-empty and safe to import, exactly as
 * `ARCHITECTURE.md` promises; nothing here is wired until a consumer needs
 * the graph (Epic 08 reasoning is the first), at which point it is one line:
 *
 * ```ts
 * providers: [ …, ...KNOWLEDGE_GRAPH_PROVIDERS ]
 * ```
 */
import type { Provider } from "@nestjs/common";
import { INTELLIGENCE_KNOWLEDGE_GRAPH } from "../orchestrator-contracts/orchestrator.tokens";
import { GraphCacheService } from "./graph-cache.service";
import { GraphEntityService } from "./graph-entity.service";
import { GraphProjectionRepository } from "./graph-projection.repository";
import { GRAPH_RELATIONSHIP_STORE_PROVIDER } from "./graph-relationship.store";
import { GraphRelationshipService } from "./graph-relationship.service";
import { GraphTraversalService } from "./graph-traversal.service";
import { KnowledgeGraphJobs, SystemGraphClock } from "./knowledge-graph.jobs";
import { KnowledgeGraphService } from "./knowledge-graph.service";
import { KNOWLEDGE_GRAPH_CLOCK, KNOWLEDGE_GRAPH_TRAVERSAL } from "./knowledge-graph.tokens";

export const KNOWLEDGE_GRAPH_PROVIDERS: readonly Provider[] = [
  GraphProjectionRepository,
  GraphCacheService,
  GraphEntityService,
  GraphRelationshipService,
  GraphTraversalService,
  KnowledgeGraphService,
  KnowledgeGraphJobs,
  { provide: KNOWLEDGE_GRAPH_CLOCK, useClass: SystemGraphClock },
  // Projection-only until M1 applies the GraphRelationship migration; the
  // factory picks the Prisma-backed store the moment the delegate exists.
  GRAPH_RELATIONSHIP_STORE_PROVIDER,
  // Contract tokens: consumers inject the interface, never the class.
  { provide: INTELLIGENCE_KNOWLEDGE_GRAPH, useExisting: KnowledgeGraphService },
  { provide: KNOWLEDGE_GRAPH_TRAVERSAL, useExisting: GraphTraversalService }
];
