/**
 * Layer 4 (Memory Engine) — storage for memory objects.
 *
 * One generic, tier-discriminated table (`MemoryObject`), keyed on
 * `(tier, subjectId)`, exactly as Epic 04 stores every edge kind in one
 * `GraphRelationship` table: the tier vocabulary is a TypeScript union and a
 * table per tier would make every new tier a migration.
 *
 * The migration is written but **not applied** — the M1 platform-hygiene
 * milestone must reconcile the existing schema/migration drift first — so it
 * sits in `packages/db/migrations-gated-m1/`, outside the directory
 * `prisma migrate deploy` reads. Selection needs the same **two** signals as
 * the graph's edge store: the generated client must have the delegate *and*
 * the deployment must set `MEMORY_ENGINE_STORE=prisma`.
 *
 * **Where this deliberately differs from Epic 04.** The graph's pre-M1 store
 * *refuses* writes, because an inferred edge that silently vanished would make
 * the marketplace-wide answer wrong while looking right. Memory is different:
 * losing it degrades to "we have not met before", which is a state the
 * retrieval path already handles honestly, and a memory engine that cannot
 * remember anything cannot be tested, exercised, or trusted before M1. So the
 * pre-M1 store *accepts* writes and keeps them in process, and says so:
 * `durable` is false, `backend` is `memory`, and the engine surfaces both. The
 * dishonest option would have been to accept writes while claiming durability
 * — that is the thing this design refuses, not in-memory storage itself.
 */
import { Injectable, Logger, type Provider } from "@nestjs/common";
import type {
  Confidence,
  EntityId,
  IntelligenceFailure,
  IsoDateTime,
  KnowledgeSource,
  MemoryTier
} from "../core";
import { PrismaService } from "../../prisma.service";
import { memoryScopeKey, type MemoryScope } from "./memory.scope";
import { MEMORY_OBJECT_STORE } from "./memory-engine.tokens";

/** One memory as stored: the envelope, flattened, plus its subject. */
export interface StoredMemoryRecord {
  readonly tier: MemoryTier;
  readonly subjectId: EntityId;
  readonly memoryId: EntityId;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly knowledge: Record<string, unknown>;
  readonly created: IsoDateTime;
  readonly updated: IsoDateTime;
  readonly expires: IsoDateTime | null;
  readonly retrievalPriority: number;
}

/** Outcome of a write: a count, or a typed reason it did not happen. */
export type MemoryPersistOutcome =
  | { readonly persisted: true; readonly written: number }
  | { readonly persisted: false; readonly failure: IntelligenceFailure };

/**
 * Command + Query API of memory storage.
 *
 * Injected by token so the pre-M1 in-process store and the post-M1 Prisma
 * store are interchangeable without a single consumer change.
 */
export interface MemoryObjectStore {
  /** True when the store can be read and written at all. */
  readonly available: boolean;
  /** True only when writes survive a process restart. Pre-M1 this is false. */
  readonly durable: boolean;
  readonly backend: "memory" | "prisma";
  /** The memories occupying these scopes; missing scopes are simply absent. */
  read(scopes: readonly MemoryScope[]): Promise<readonly StoredMemoryRecord[]>;
  /**
   * Writes memories, upserting on `(tier, subjectId)`.
   *
   * Idempotent by construction (doc 23 §4): the same memory written twice is
   * one row, never two, and never a different memory.
   */
  write(records: readonly StoredMemoryRecord[]): Promise<MemoryPersistOutcome>;
  /** Removes these scopes; returns how many existed. */
  forget(scopes: readonly MemoryScope[]): Promise<number>;
  /**
   * Removes everything expired at `now`, optionally for one subject only;
   * returns the scopes it removed.
   *
   * The subject filter is a real filter, not a filtered report: a job asked to
   * expire one customer's memory must not quietly delete another's, because
   * the deletion it did not announce is the one nobody can invalidate a cache
   * for.
   */
  sweepExpired(now: IsoDateTime, subjectId?: EntityId | null): Promise<readonly MemoryScope[]>;
}

/** The toolId reported when the store cannot serve. */
export const MEMORY_OBJECT_STORE_TOOL_ID = "memory-engine.memory-object-store";

/** Ceiling on memories held in process, so a long-lived API cannot leak. */
export const MAX_IN_PROCESS_MEMORIES = 2000;

/** Ceiling on rows one read returns. */
export const MAX_STORED_MEMORIES_PER_READ = 200;

function expiredAt(record: StoredMemoryRecord, now: number): boolean {
  if (record.expires === null) return false;
  const expires = Date.parse(record.expires);
  return Number.isNaN(expires) ? true : now >= expires;
}

/**
 * The pre-M1 store: real storage, honest scope.
 *
 * A bounded, FIFO-evicted map. Everything the engine does — conflict
 * resolution, expiry, tier isolation, idempotent rewrites — is exercised
 * against it exactly as it will be against Postgres, because the contract
 * above is the whole surface either one presents.
 */
@Injectable()
export class InProcessMemoryObjectStore implements MemoryObjectStore {
  readonly available = true;

  /**
   * False, and reported everywhere. `MemoryEngineService.persistence` exposes
   * it so a health check answers "memory survives a deploy?" with the truth.
   */
  readonly durable = false;

  readonly backend = "memory" as const;

  private readonly records = new Map<string, StoredMemoryRecord>();

  async read(scopes: readonly MemoryScope[]): Promise<readonly StoredMemoryRecord[]> {
    const found: StoredMemoryRecord[] = [];

    for (const scope of scopes.slice(0, MAX_STORED_MEMORIES_PER_READ)) {
      const record = this.records.get(memoryScopeKey(scope));
      if (record) found.push(record);
    }

    return found;
  }

  async write(records: readonly StoredMemoryRecord[]): Promise<MemoryPersistOutcome> {
    for (const record of records) {
      const key = memoryScopeKey(record);

      // Evict only when adding a *new* key: rewriting an existing memory must
      // never cost another memory its slot.
      if (!this.records.has(key) && this.records.size >= MAX_IN_PROCESS_MEMORIES) {
        const oldest = this.records.keys().next().value;
        if (oldest) this.records.delete(oldest);
      }

      this.records.set(key, record);
    }

    return { persisted: true, written: records.length };
  }

  async forget(scopes: readonly MemoryScope[]): Promise<number> {
    let removed = 0;

    for (const scope of scopes) {
      if (this.records.delete(memoryScopeKey(scope))) removed += 1;
    }

    return removed;
  }

  async sweepExpired(now: IsoDateTime, subjectId?: EntityId | null): Promise<readonly MemoryScope[]> {
    const at = Date.parse(now);
    const swept: MemoryScope[] = [];

    for (const [key, record] of this.records.entries()) {
      if (subjectId && record.subjectId !== subjectId) continue;
      if (!expiredAt(record, at)) continue;

      this.records.delete(key);
      swept.push({ tier: record.tier, subjectId: record.subjectId });
    }

    return swept;
  }

  /** Test/diagnostic surface: how many memories are held right now. */
  get size(): number {
    return this.records.size;
  }
}

/** One stored row, as the gated migration defines it. */
interface MemoryObjectRow {
  readonly tier: string;
  readonly subjectId: string;
  readonly memoryId: string;
  readonly source: string;
  readonly confidence: number;
  readonly knowledge: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date | null;
  readonly retrievalPriority: number;
}

/**
 * The Prisma delegate this store needs, described structurally.
 *
 * Structural rather than `PrismaClient["memoryObject"]` because that property
 * does not exist until the M1 migration is applied and the client regenerated
 * — a direct reference would stop the whole API compiling today. Described
 * this way the same code compiles now, refuses to activate now, and starts
 * working the moment the table and the generated client appear, with no edit.
 */
interface MemoryObjectDelegate {
  /** `where` is left open: reads are by scope, sweeps are by expiry. */
  findMany(args: {
    where: Record<string, unknown>;
    take: number;
  }): Promise<MemoryObjectRow[]>;
  upsert(args: {
    where: { tier_subjectId: { tier: string; subjectId: string } };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<unknown>;
  deleteMany(args: {
    where: Record<string, unknown>;
  }): Promise<{ count: number }>;
}

function isDelegate(candidate: unknown): candidate is MemoryObjectDelegate {
  if (typeof candidate !== "object" || candidate === null) return false;
  const record = candidate as Record<string, unknown>;
  return (
    typeof record.findMany === "function" &&
    typeof record.upsert === "function" &&
    typeof record.deleteMany === "function"
  );
}

/** Resolves the delegate, or null while the migration is still gated. */
export function resolveMemoryObjectDelegate(prisma: PrismaService): MemoryObjectDelegate | null {
  const candidate = (prisma as unknown as Record<string, unknown>).memoryObject;
  return isDelegate(candidate) ? candidate : null;
}

@Injectable()
export class PrismaMemoryObjectStore implements MemoryObjectStore {
  readonly available = true;
  readonly durable = true;
  readonly backend = "prisma" as const;

  private readonly logger = new Logger(PrismaMemoryObjectStore.name);

  constructor(private readonly delegate: MemoryObjectDelegate) {}

  async read(scopes: readonly MemoryScope[]): Promise<readonly StoredMemoryRecord[]> {
    if (scopes.length === 0) return [];

    const rows = await this.delegate.findMany({
      where: {
        OR: scopes
          .slice(0, MAX_STORED_MEMORIES_PER_READ)
          .map((scope) => ({ tier: scope.tier, subjectId: scope.subjectId }))
      },
      take: MAX_STORED_MEMORIES_PER_READ
    });

    return rows.map((row) => toRecord(row));
  }

  async write(records: readonly StoredMemoryRecord[]): Promise<MemoryPersistOutcome> {
    for (const record of records) {
      await this.delegate.upsert({
        where: { tier_subjectId: { tier: record.tier, subjectId: record.subjectId } },
        create: {
          tier: record.tier,
          subjectId: record.subjectId,
          memoryId: record.memoryId,
          source: record.source,
          confidence: record.confidence,
          knowledge: record.knowledge,
          createdAt: new Date(record.created),
          updatedAt: new Date(record.updated),
          expiresAt: record.expires === null ? null : new Date(record.expires),
          retrievalPriority: record.retrievalPriority
        },
        update: {
          source: record.source,
          confidence: record.confidence,
          knowledge: record.knowledge,
          updatedAt: new Date(record.updated),
          expiresAt: record.expires === null ? null : new Date(record.expires),
          retrievalPriority: record.retrievalPriority
        }
      });
    }

    this.logger.debug(`persisted ${records.length} memory object(s)`);
    return { persisted: true, written: records.length };
  }

  async forget(scopes: readonly MemoryScope[]): Promise<number> {
    if (scopes.length === 0) return 0;

    const { count } = await this.delegate.deleteMany({
      where: { OR: scopes.map((scope) => ({ tier: scope.tier, subjectId: scope.subjectId })) }
    });

    return count;
  }

  /**
   * Deletes what has aged out.
   *
   * The rows are read before they are deleted so the sweep can report which
   * scopes it removed — `ExpireMemoryJob` announces the tiers that changed,
   * and "some rows, somewhere" is not an announcement anybody can act on.
   */
  async sweepExpired(now: IsoDateTime, subjectId?: EntityId | null): Promise<readonly MemoryScope[]> {
    const where = subjectId
      ? { expiresAt: { lt: new Date(now) }, subjectId }
      : { expiresAt: { lt: new Date(now) } };

    const rows = await this.delegate.findMany({ where, take: MAX_STORED_MEMORIES_PER_READ });
    if (rows.length === 0) return [];

    const scopes = rows.map((row) => ({ tier: row.tier as MemoryTier, subjectId: row.subjectId }));
    await this.delegate.deleteMany({ where });

    return scopes;
  }
}

function toRecord(row: MemoryObjectRow): StoredMemoryRecord {
  return {
    // The tier is screened by `screenMemories` on the way out of the
    // repository, which drops anything this build does not know — so the cast
    // never widens what a consumer actually receives.
    tier: row.tier as MemoryTier,
    subjectId: row.subjectId,
    memoryId: row.memoryId,
    source: row.source as KnowledgeSource,
    confidence: row.confidence,
    knowledge: (row.knowledge ?? {}) as Record<string, unknown>,
    created: row.createdAt.toISOString(),
    updated: row.updatedAt.toISOString(),
    expires: row.expiresAt === null ? null : row.expiresAt.toISOString(),
    retrievalPriority: row.retrievalPriority
  };
}

/** Env var that opts a deployment into the durable store after M1. */
export const MEMORY_STORE_ENV = "MEMORY_ENGINE_STORE";

/**
 * Chooses the store, requiring **two** independent signals.
 *
 * The generated client is not evidence that the table exists: `prisma
 * generate` runs on every image build and would mint a `memoryObject` delegate
 * the moment the model appears in `schema.prisma` — while the migration is
 * still gated and the table still absent. Selecting on the delegate alone
 * would therefore switch the store on at build time and fail at query time.
 *
 * So the delegate must exist *and* the deployment must say
 * `MEMORY_ENGINE_STORE=prisma`. That makes durable memory an explicit act by
 * whoever applied the migration, which is the whole point of gating it on M1.
 */
export function selectMemoryObjectStore(
  prisma: PrismaService,
  env: NodeJS.ProcessEnv = process.env
): MemoryObjectStore {
  if (env[MEMORY_STORE_ENV] !== "prisma") {
    return new InProcessMemoryObjectStore();
  }

  const delegate = resolveMemoryObjectDelegate(prisma);
  return delegate ? new PrismaMemoryObjectStore(delegate) : new InProcessMemoryObjectStore();
}

/**
 * Token/implementation pair, following `MEDIA_STORAGE_PROVIDER`: consumers
 * inject `MemoryObjectStore` and never learn which one they got.
 */
export const MEMORY_OBJECT_STORE_PROVIDER: Provider = {
  provide: MEMORY_OBJECT_STORE,
  useFactory: (prisma: PrismaService): MemoryObjectStore => selectMemoryObjectStore(prisma),
  inject: [PrismaService]
};
