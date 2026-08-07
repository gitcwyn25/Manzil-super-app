/**
 * Epic 18 — where a key's outcome is recorded, and who arbitrates a race.
 *
 * ## The rule this file exists to keep
 *
 * **Never read-then-write.** The obvious implementation — "look the key up; if
 * it is absent, create the resource" — is wrong under exactly the conditions
 * idempotency exists for. Two requests from one double-click arrive
 * milliseconds apart, both look, both find nothing, and both create. That is
 * how the catalogue got the same business twice, and
 * `CrmRepository.registerBusiness` still carries a `findFirst`-then-`create`
 * guard with the same hole in it (see IDEMPOTENCY.md § "The audit").
 *
 * So the primitive here is `claim()`: an **insert-if-absent** whose loser is
 * decided by something that can arbitrate — a unique index in Postgres, a
 * `SET NX` in Redis, or, in process, a `Map` read and write with no `await`
 * between them (Node's event loop cannot interleave a synchronous pair, and
 * that is the whole reason it is written as one).
 *
 * ## Three backends, one contract
 *
 * - `InProcessIdempotencyStore` — always available, no dependencies. Protects
 *   within one API process. `durable: false`, and it says so.
 * - `RedisIdempotencyStore` (see `idempotency.redis.store.ts`) — shares the
 *   CacheService connection; arbitrates across replicas today.
 * - `PrismaIdempotencyStore` — the durable one, gated on M1 like every other
 *   new table in this codebase, activated only by two independent signals.
 */
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { scopedKey } from "./idempotency.fingerprint";
import type {
  IdempotencyClaimOutcome,
  IdempotencyClaimRequest,
  IdempotencyRecord,
  StoredResponse
} from "./idempotency.types";

/**
 * Storage for idempotency records.
 *
 * Deliberately narrow: four verbs and a prune. Anything richer would tempt a
 * caller into the read-then-write shape this module exists to forbid.
 */
export interface IdempotencyStore {
  readonly backend: "memory" | "redis" | "prisma";
  /** True only when a record survives a process restart. */
  readonly durable: boolean;
  /** True only when the record is visible to every replica. */
  readonly shared: boolean;

  /**
   * Insert-if-absent. The storage engine decides the winner; the loser is told
   * what already exists so it can replay, wait, or reject.
   */
  claim(request: IdempotencyClaimRequest): Promise<IdempotencyClaimOutcome>;

  /** Records the terminal response against a claim this caller owns. */
  complete(scope: string, key: string, response: StoredResponse, now: number): Promise<void>;

  /**
   * Drops a claim whose request did not succeed, so the same key may be tried
   * again. A failure is not an outcome worth replaying.
   */
  release(scope: string, key: string): Promise<void>;

  /**
   * Waits for an in-flight claim to settle, up to `timeoutMs`.
   *
   * Returns the completed record, or null if it was released or the wait ran
   * out. This is what turns two racing duplicates into two identical
   * responses instead of one success and one 409.
   */
  awaitSettled(scope: string, key: string, timeoutMs: number): Promise<IdempotencyRecord | null>;

  /** Drops expired records; returns how many. */
  prune(now: number): Promise<number>;
}

/** Ceiling on records held in process, so a long-lived API cannot leak. */
export const MAX_IN_PROCESS_RECORDS = 5000;

/**
 * Classifies an existing record against the request presenting the same key.
 *
 * Fingerprint first, unconditionally. A key reused for a different request is
 * a client bug whether the original finished or not, and answering "still in
 * progress" to it would send the client back to retry the same wrong thing.
 */
export function classifyExisting(
  record: IdempotencyRecord,
  fingerprint: string
): IdempotencyClaimOutcome {
  if (record.fingerprint !== fingerprint) {
    return { outcome: "fingerprint_mismatch", record };
  }

  if (record.state === "completed" && record.response) {
    return { outcome: "replay", record };
  }

  return { outcome: "in_flight", record };
}

/**
 * The always-available store: real storage, honest scope.
 *
 * Follows the pattern Epics 04–06 arrived at — a bounded in-process map behind
 * the same contract the durable store implements, so every behaviour
 * (fingerprint mismatch, replay, TTL expiry, the race) is exercised against it
 * exactly as it will be against Postgres.
 *
 * Its limit is stated rather than hidden: `durable` and `shared` are both
 * false, so two API replicas each protect their own traffic and a restart
 * forgets the window. That is strictly better than no protection, and the
 * Redis store above it closes the replica gap today.
 */
@Injectable()
export class InProcessIdempotencyStore implements IdempotencyStore {
  readonly backend = "memory" as const;
  readonly durable = false;
  readonly shared = false;

  private readonly records = new Map<string, IdempotencyRecord>();
  private readonly waiters = new Map<string, Set<(record: IdempotencyRecord | null) => void>>();

  async claim(request: IdempotencyClaimRequest): Promise<IdempotencyClaimOutcome> {
    const id = scopedKey(request.scope, request.key);

    // ⚠️ No `await` between the read and the write. Node runs this pair to
    // completion before any other request resumes, which is what makes the
    // claim atomic. Introducing an await here — even a trivial one — reopens
    // the double-create race this class exists to close.
    const existing = this.records.get(id);

    if (existing && existing.expiresAt > request.now) {
      return classifyExisting(existing, request.fingerprint);
    }

    this.evictIfFull(request.now);

    this.records.set(id, {
      scope: request.scope,
      key: request.key,
      route: request.route,
      fingerprint: request.fingerprint,
      state: "in_flight",
      response: null,
      createdAt: request.now,
      expiresAt: request.now + request.ttlMs
    });

    return { outcome: "claimed" };
  }

  async complete(scope: string, key: string, response: StoredResponse, now: number): Promise<void> {
    const id = scopedKey(scope, key);
    const existing = this.records.get(id);

    // A claim that has already been evicted or expired is not resurrected: the
    // window it belonged to is over, and a record with a fresh expiry would
    // silently extend it.
    if (!existing || existing.expiresAt <= now) {
      this.notify(id, null);
      return;
    }

    const settled: IdempotencyRecord = { ...existing, state: "completed", response };
    this.records.set(id, settled);
    this.notify(id, settled);
  }

  async release(scope: string, key: string): Promise<void> {
    const id = scopedKey(scope, key);
    this.records.delete(id);
    this.notify(id, null);
  }

  async awaitSettled(
    scope: string,
    key: string,
    timeoutMs: number
  ): Promise<IdempotencyRecord | null> {
    const id = scopedKey(scope, key);
    const existing = this.records.get(id);

    if (!existing) return null;
    if (existing.state === "completed") return existing;
    if (timeoutMs <= 0) return null;

    return new Promise<IdempotencyRecord | null>((resolve) => {
      const waiters = this.waiters.get(id) ?? new Set();

      const settle = (record: IdempotencyRecord | null) => {
        clearTimeout(timer);
        waiters.delete(settle);
        if (waiters.size === 0) this.waiters.delete(id);
        resolve(record);
      };

      const timer = setTimeout(() => settle(null), timeoutMs);
      // Never hold the process open for a waiter; a pending replay is not a
      // reason for the API to refuse to shut down.
      timer.unref?.();

      waiters.add(settle);
      this.waiters.set(id, waiters);
    });
  }

  async prune(now: number): Promise<number> {
    let removed = 0;

    for (const [id, record] of this.records) {
      if (record.expiresAt <= now) {
        this.records.delete(id);
        removed += 1;
      }
    }

    return removed;
  }

  /** Test/diagnostic surface: how many records are held right now. */
  get size(): number {
    return this.records.size;
  }

  private notify(id: string, record: IdempotencyRecord | null): void {
    const waiters = this.waiters.get(id);
    if (!waiters) return;

    // Copy first: each callback removes itself from the live set.
    for (const waiter of [...waiters]) waiter(record);
  }

  private evictIfFull(now: number): void {
    if (this.records.size < MAX_IN_PROCESS_RECORDS) return;

    for (const [id, record] of this.records) {
      if (record.expiresAt <= now) {
        this.records.delete(id);
      }
    }

    if (this.records.size < MAX_IN_PROCESS_RECORDS) return;

    // Still full: drop the oldest *completed* record. An in-flight one is
    // never evicted — losing it mid-request would let the duplicate that is
    // already waiting on it proceed and create a second resource.
    for (const [id, record] of this.records) {
      if (record.state === "completed") {
        this.records.delete(id);
        return;
      }
    }
  }
}

/** One stored row, as the gated migration defines it. */
interface IdempotencyRow {
  readonly scope: string;
  readonly key: string;
  readonly route: string;
  readonly fingerprint: string;
  readonly state: string;
  readonly responseStatus: number | null;
  readonly responseBody: unknown;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

/**
 * The Prisma delegate this store needs, described structurally.
 *
 * Structural rather than `PrismaClient["idempotencyRecord"]` because that
 * property does not exist until the M1 migration is applied and the client
 * regenerated — a direct reference would stop the whole API compiling today.
 * Described this way the same code compiles now, refuses to activate now, and
 * starts working the moment the table and the generated client appear, with no
 * edit. Same discipline as `resolveSummaryDelegate` (Epic 06).
 */
export interface IdempotencyDelegate {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  findUnique(args: {
    where: { scope_key: { scope: string; key: string } };
  }): Promise<IdempotencyRow | null>;
  update(args: {
    where: { scope_key: { scope: string; key: string } };
    data: Record<string, unknown>;
  }): Promise<unknown>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>;
}

function isDelegate(candidate: unknown): candidate is IdempotencyDelegate {
  if (typeof candidate !== "object" || candidate === null) return false;
  const record = candidate as Record<string, unknown>;

  return (
    typeof record.create === "function" &&
    typeof record.findUnique === "function" &&
    typeof record.update === "function" &&
    typeof record.deleteMany === "function"
  );
}

/** Resolves the delegate, or null while the migration is still gated. */
export function resolveIdempotencyDelegate(prisma: PrismaService): IdempotencyDelegate | null {
  const candidate = (prisma as unknown as Record<string, unknown>).idempotencyRecord;
  return isDelegate(candidate) ? candidate : null;
}

/** Prisma's unique-constraint violation. The signal that we lost the race. */
export const PRISMA_UNIQUE_VIOLATION = "P2002";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === PRISMA_UNIQUE_VIOLATION
  );
}

function toRecord(row: IdempotencyRow): IdempotencyRecord {
  const completed = row.state === "completed" && typeof row.responseStatus === "number";

  return {
    scope: row.scope,
    key: row.key,
    route: row.route,
    fingerprint: row.fingerprint,
    state: completed ? "completed" : "in_flight",
    response: completed ? { status: row.responseStatus as number, body: row.responseBody } : null,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt.getTime()
  };
}

/**
 * The durable store — post-M1.
 *
 * `claim()` is an unconditional `create`. If the unique index on
 * `(scope, key)` rejects it, we lost the race and read the winner's row. This
 * is the point of the whole design: **the database arbitrates**, and there is
 * no window between the check and the write for a second request to slip
 * through, because there is no check.
 */
@Injectable()
export class PrismaIdempotencyStore implements IdempotencyStore {
  readonly backend = "prisma" as const;
  readonly durable = true;
  readonly shared = true;

  private readonly logger = new Logger(PrismaIdempotencyStore.name);

  constructor(
    private readonly delegate: IdempotencyDelegate,
    /** Poll interval while waiting on another replica's in-flight request. */
    private readonly pollMs = 40
  ) {}

  async claim(request: IdempotencyClaimRequest): Promise<IdempotencyClaimOutcome> {
    const attempt = await this.insert(request);
    if (attempt.outcome !== "expired") return attempt.result;

    // The row we collided with was past its TTL. Delete it *by expiry* — a
    // conditional delete, so a concurrent request that just refreshed the key
    // is not destroyed — and try to claim once more.
    await this.delegate.deleteMany({
      where: { scope: request.scope, key: request.key, expiresAt: { lte: new Date(request.now) } }
    });

    const retry = await this.insert(request);
    return retry.outcome === "expired"
      ? { outcome: "in_flight", record: retry.record }
      : retry.result;
  }

  async complete(scope: string, key: string, response: StoredResponse, now: number): Promise<void> {
    await this.delegate.update({
      where: { scope_key: { scope, key } },
      data: {
        state: "completed",
        responseStatus: response.status,
        responseBody: (response.body ?? null) as never,
        completedAt: new Date(now)
      }
    });
  }

  async release(scope: string, key: string): Promise<void> {
    await this.delegate.deleteMany({ where: { scope, key, state: "in_flight" } });
  }

  async awaitSettled(
    scope: string,
    key: string,
    timeoutMs: number
  ): Promise<IdempotencyRecord | null> {
    // Polling rather than a notification channel: the waiting request and the
    // running one may be on different replicas, and a LISTEN/NOTIFY dependency
    // for a sub-second wait would be a lot of machinery for a rare path.
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const row = await this.delegate.findUnique({ where: { scope_key: { scope, key } } });
      if (!row) return null;

      const record = toRecord(row);
      if (record.state === "completed") return record;
      if (Date.now() >= deadline) return null;

      await new Promise((resolve) => {
        const timer = setTimeout(resolve, this.pollMs);
        timer.unref?.();
      });
    }
  }

  async prune(now: number): Promise<number> {
    const { count } = await this.delegate.deleteMany({
      where: { expiresAt: { lte: new Date(now) } }
    });

    if (count > 0) this.logger.debug(`pruned ${count} expired idempotency record(s)`);
    return count;
  }

  /**
   * One insert attempt. Reports `expired` separately so `claim()` can decide
   * whether to take the row over, rather than deciding here.
   */
  private async insert(
    request: IdempotencyClaimRequest
  ): Promise<
    | { outcome: "settled"; result: IdempotencyClaimOutcome }
    | { outcome: "expired"; record: IdempotencyRecord }
  > {
    try {
      await this.delegate.create({
        data: {
          scope: request.scope,
          key: request.key,
          route: request.route,
          fingerprint: request.fingerprint,
          state: "in_flight",
          createdAt: new Date(request.now),
          expiresAt: new Date(request.now + request.ttlMs)
        }
      });

      return { outcome: "settled", result: { outcome: "claimed" } };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const row = await this.delegate.findUnique({
        where: { scope_key: { scope: request.scope, key: request.key } }
      });

      // Deleted between the collision and the read: nothing holds the key, so
      // report it in flight and let the caller wait and retry rather than
      // racing a third time here.
      if (!row) {
        return {
          outcome: "settled",
          result: {
            outcome: "in_flight",
            record: {
              scope: request.scope,
              key: request.key,
              route: request.route,
              fingerprint: request.fingerprint,
              state: "in_flight",
              response: null,
              createdAt: request.now,
              expiresAt: request.now + request.ttlMs
            }
          }
        };
      }

      const record = toRecord(row);
      if (record.expiresAt <= request.now) return { outcome: "expired", record };

      return { outcome: "settled", result: classifyExisting(record, request.fingerprint) };
    }
  }
}
