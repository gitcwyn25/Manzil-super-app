/**
 * Layer 3 (Knowledge Graph) — storage for the edges no projection can derive.
 *
 * Projections cover everything the relational schema already proves. Two
 * kinds of edge it cannot prove need a home:
 *
 * - **explicit** — a merchant or admin declares a relationship the schema has
 *   no column for ("this venue substitutes for that one").
 * - **inferred** — a derivation over behaviour ("these two providers share
 *   customers"), produced by `InferRelationshipsJob`.
 *
 * The `GraphRelationship` table that holds them is written but **not
 * applied**: the M1 platform-hygiene milestone must reconcile the existing
 * schema/migration drift first (five table families in `schema.prisma` exist
 * in no migration; production was `db push`-ed). Applying a new migration on
 * top of that history would deepen the very problem M1 exists to fix. The SQL
 * therefore sits in `packages/db/migrations-gated-m1/`, outside the directory
 * `prisma migrate deploy` reads.
 *
 * Until then this module runs in **projection-only mode**: reads return
 * nothing and writes are refused with a typed cause, so nothing silently
 * pretends to have been stored.
 */
import { Injectable, Logger, type Provider } from "@nestjs/common";
import type {
  Confidence,
  EntityId,
  IntelligenceFailure,
  IsoDateTime,
  KnowledgeSource
} from "../core";
import type { AnyRelationship, RelationshipKind } from "../relationship-engine";
import { PrismaService } from "../../prisma.service";
import { GRAPH_RELATIONSHIP_STORE } from "./knowledge-graph.tokens";
import {
  KNOWN_RELATIONSHIP_KINDS,
  relationship,
  type GraphEdgeOrigin
} from "./knowledge-graph.relationships";
import { screenRelationships } from "./knowledge-graph.validation";

/** An edge as stored: the contract edge plus its origin and lifecycle. */
export interface GraphRelationshipRecord {
  readonly kind: RelationshipKind;
  readonly fromId: EntityId;
  readonly toId: EntityId;
  readonly attributes: Record<string, unknown>;
  readonly origin: GraphEdgeOrigin;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
}

/** Outcome of a write: either a count, or a typed reason it did not happen. */
export type PersistOutcome =
  | { readonly persisted: true; readonly written: number }
  | { readonly persisted: false; readonly failure: IntelligenceFailure };

/**
 * Command + Query API of explicit/inferred edge storage.
 *
 * Injected by token so the pre-M1 refusal and the post-M1 Prisma
 * implementation are interchangeable without a single consumer change.
 */
export interface GraphRelationshipStore {
  /** True when the backing table exists and can be read and written. */
  readonly available: boolean;
  /** Stored edges incident to any of these node ids. */
  edgesOf(ids: readonly EntityId[]): Promise<readonly AnyRelationship[]>;
  /**
   * Writes edges, upserting on `(kind, fromId, toId)`.
   *
   * Idempotent by construction (doc 23 §4): the same edge written twice is
   * one row whose `updatedAt` moved, never two rows and never a different
   * graph.
   */
  persist(records: readonly GraphRelationshipRecord[]): Promise<PersistOutcome>;
}

/** The toolId reported when the store is not yet provisioned. */
export const GRAPH_RELATIONSHIP_STORE_TOOL_ID = "knowledge-graph.graph-relationship-store";

function unavailable(): IntelligenceFailure {
  return {
    error: { kind: "tool_unavailable", toolId: GRAPH_RELATIONSHIP_STORE_TOOL_ID },
    // Retrying cannot conjure a table. This is a deployment precondition
    // (M1), not a transient fault, and marking it retryable would have the
    // executor spin forever.
    retryable: false,
    occurredAt: new Date().toISOString()
  };
}

/**
 * The pre-M1 store: honest about having nowhere to put anything.
 *
 * Reads succeed and return nothing — the graph is fully usable in
 * projection-only mode. Writes fail with `tool_unavailable`, which is the
 * taxonomy's cause for "a required platform tool is unregistered".
 */
@Injectable()
export class PendingMigrationRelationshipStore implements GraphRelationshipStore {
  readonly available = false;

  async edgesOf(): Promise<readonly AnyRelationship[]> {
    return [];
  }

  async persist(): Promise<PersistOutcome> {
    return { persisted: false, failure: unavailable() };
  }
}

/** One stored row, as the gated migration defines it. */
interface GraphRelationshipRow {
  readonly kind: string;
  readonly fromId: string;
  readonly toId: string;
  readonly attributes: unknown;
  readonly origin: string;
  readonly source: string;
  readonly confidence: number;
  readonly updatedAt: Date;
}

/**
 * The Prisma delegate this store needs, described structurally.
 *
 * Structural rather than `PrismaClient["graphRelationship"]` because that
 * property does not exist until the M1 migration is applied and the client is
 * regenerated — a direct reference would stop the whole API compiling today.
 * Described this way, the same code compiles now, refuses to run now, and
 * starts working the moment the table and the generated client appear, with
 * no edit.
 */
interface GraphRelationshipDelegate {
  findMany(args: {
    where: { OR: { fromId?: { in: string[] }; toId?: { in: string[] } }[] };
    take: number;
  }): Promise<GraphRelationshipRow[]>;
  upsert(args: {
    where: { kind_fromId_toId: { kind: string; fromId: string; toId: string } };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<unknown>;
}

/** Ceiling on stored edges returned for one read. */
export const MAX_STORED_EDGES = 500;

function isDelegate(candidate: unknown): candidate is GraphRelationshipDelegate {
  if (typeof candidate !== "object" || candidate === null) return false;
  const record = candidate as Record<string, unknown>;
  return typeof record.findMany === "function" && typeof record.upsert === "function";
}

/** Resolves the delegate, or null while the migration is still gated. */
export function resolveGraphRelationshipDelegate(
  prisma: PrismaService
): GraphRelationshipDelegate | null {
  const candidate = (prisma as unknown as Record<string, unknown>).graphRelationship;
  return isDelegate(candidate) ? candidate : null;
}

@Injectable()
export class PrismaGraphRelationshipStore implements GraphRelationshipStore {
  readonly available = true;

  private readonly logger = new Logger(PrismaGraphRelationshipStore.name);

  constructor(private readonly delegate: GraphRelationshipDelegate) {}

  async edgesOf(ids: readonly EntityId[]): Promise<readonly AnyRelationship[]> {
    if (ids.length === 0) return [];

    const rows = await this.delegate.findMany({
      where: { OR: [{ fromId: { in: [...ids] } }, { toId: { in: [...ids] } }] },
      take: MAX_STORED_EDGES
    });

    // A stored edge can outlive the row it pointed at, and its kind can come
    // from a vocabulary this build no longer knows; screening here means a
    // stale row degrades one edge instead of an entire answer.
    return screenRelationships(rows.map((row) => toRelationship(row)), {
      knownKinds: KNOWN_RELATIONSHIP_KINDS
    }).accepted;
  }

  async persist(records: readonly GraphRelationshipRecord[]): Promise<PersistOutcome> {
    let written = 0;

    for (const record of records) {
      const now = new Date();
      await this.delegate.upsert({
        where: {
          kind_fromId_toId: { kind: record.kind, fromId: record.fromId, toId: record.toId }
        },
        create: {
          kind: record.kind,
          fromId: record.fromId,
          toId: record.toId,
          attributes: record.attributes,
          origin: record.origin,
          source: record.source,
          confidence: record.confidence,
          createdAt: now,
          updatedAt: now
        },
        update: {
          attributes: record.attributes,
          origin: record.origin,
          source: record.source,
          confidence: record.confidence,
          updatedAt: now
        }
      });
      written += 1;
    }

    this.logger.debug(`persisted ${written} graph relationship(s)`);
    return { persisted: true, written };
  }
}

function toRelationship(row: GraphRelationshipRow): AnyRelationship {
  return relationship({
    // The row's kind is validated by `screenRelationships`, which drops
    // anything the registry does not know — so the cast never widens what a
    // consumer actually receives.
    kind: row.kind as RelationshipKind,
    fromId: row.fromId,
    toId: row.toId,
    attributes: (row.attributes ?? {}) as never,
    source: row.source as KnowledgeSource,
    confidence: row.confidence,
    updatedAt: row.updatedAt.toISOString() as IsoDateTime
  });
}

/** Env var that opts a deployment into the stored-edge path after M1. */
export const GRAPH_EDGE_STORE_ENV = "KNOWLEDGE_GRAPH_EDGE_STORE";

/**
 * Chooses the store, requiring **two** independent signals.
 *
 * The generated client is not evidence that the table exists: `prisma
 * generate` runs on every image build and would mint a `graphRelationship`
 * delegate the moment the model appears in `schema.prisma` — while the
 * migration is still gated and the table still absent. Selecting on the
 * delegate alone would therefore switch the store on at build time and fail
 * at query time.
 *
 * So the delegate must exist *and* the deployment must say
 * `KNOWLEDGE_GRAPH_EDGE_STORE=prisma`. That makes enabling stored edges an
 * explicit act by whoever applied the migration, which is the whole point of
 * gating it on M1.
 */
export function selectGraphRelationshipStore(
  prisma: PrismaService,
  env: NodeJS.ProcessEnv = process.env
): GraphRelationshipStore {
  if (env[GRAPH_EDGE_STORE_ENV] !== "prisma") {
    return new PendingMigrationRelationshipStore();
  }

  const delegate = resolveGraphRelationshipDelegate(prisma);
  return delegate ? new PrismaGraphRelationshipStore(delegate) : new PendingMigrationRelationshipStore();
}

/**
 * Token/implementation pair, following `MEDIA_STORAGE_PROVIDER`: consumers
 * inject `GraphRelationshipStore` and never learn which one they got.
 */
export const GRAPH_RELATIONSHIP_STORE_PROVIDER: Provider = {
  provide: GRAPH_RELATIONSHIP_STORE,
  useFactory: (prisma: PrismaService): GraphRelationshipStore => selectGraphRelationshipStore(prisma),
  inject: [PrismaService]
};
