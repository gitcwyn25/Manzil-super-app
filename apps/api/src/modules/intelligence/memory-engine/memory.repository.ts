/**
 * Layer 4 (Memory Engine) — the tier repositories.
 *
 * One class, six tiers, because every tier obeys the same four rules and a
 * class per tier would be five copies of them:
 *
 * 1. **Tier isolation.** Every read and write is keyed by `(tier, subjectId)`.
 *    A mission written for a customer cannot be read as their preferences, and
 *    forgetting a mission cannot touch anything else. The isolation is
 *    structural — there is no query in this module that spans tiers.
 * 2. **Expiry on read.** A memory past `expires` is never served, and is
 *    deleted as it is discovered. The `ExpireMemoryJob` sweep exists as well,
 *    because a memory nobody reads must also stop existing — but correctness
 *    does not depend on the sweep having run.
 * 3. **Conflict resolution on write.** Two statements about one slot are
 *    resolved by `memory.conflict.ts`, never averaged, and the reason is
 *    returned so the change can be explained.
 * 4. **Degrade, never throw.** A stored memory that fails validation is
 *    dropped, not served and not raised.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { EntityId, IntelligenceError, IntelligenceFailure, IsoDateTime, MemoryTier } from "../core";
import {
  mergeMemoryPair,
  resolveMemoryConflict,
  type MemoryConflictResolution
} from "./memory.conflict";
import { isExpired, scopeOfMemory } from "./memory.lifecycle";
import {
  MEMORY_OBJECT_STORE_TOOL_ID,
  type MemoryObjectStore,
  type StoredMemoryRecord
} from "./memory-object.store";
import { MEMORY_ENGINE_CLOCK, MEMORY_OBJECT_STORE } from "./memory-engine.tokens";
import type { MemoryClock } from "./memory-engine.clock";
import { memoryScopeKey, type MemoryScope } from "./memory.scope";
import { screenMemories } from "./memory.validation";
import type { AnyMemoryObject } from "./memory.tiers";

/** What a write did, and why. */
export type MemoryWriteOutcome = "written" | "kept_existing" | "rejected";

export interface MemoryWriteResult {
  /** The memory now occupying the slot; null only when the write was rejected. */
  readonly memory: AnyMemoryObject | null;
  readonly outcome: MemoryWriteOutcome;
  /** How the incoming claim was resolved against what was there. */
  readonly resolution: MemoryConflictResolution | null;
  /** Typed causes for a rejection (validation, raw conversation). */
  readonly errors: readonly IntelligenceError[];
  /** Set only when storage refused the write. */
  readonly failure: IntelligenceFailure | null;
}

/** Converts a contract memory into the flat row the store holds. */
export function toStoredRecord(memory: AnyMemoryObject): StoredMemoryRecord {
  const scope = scopeOfMemory(memory);

  return {
    tier: memory.tier,
    subjectId: scope.subjectId,
    memoryId: memory.memoryId,
    source: memory.source,
    confidence: memory.confidence,
    knowledge: memory.knowledge as unknown as Record<string, unknown>,
    created: memory.created,
    updated: memory.updated,
    expires: memory.expires,
    retrievalPriority: memory.retrievalPriority
  };
}

/**
 * Converts a stored row back into a contract memory.
 *
 * The cast is narrow and screened: `screenMemories` runs on everything this
 * function produces, so a row whose tier or payload this build cannot honour
 * is dropped before any consumer sees it.
 */
export function toMemoryObject(record: StoredMemoryRecord): AnyMemoryObject {
  return {
    memoryId: record.memoryId,
    tier: record.tier,
    source: record.source,
    confidence: record.confidence,
    created: record.created,
    updated: record.updated,
    expires: record.expires,
    retrievalPriority: record.retrievalPriority,
    knowledge: record.knowledge
  } as unknown as AnyMemoryObject;
}

function storeUnavailable(): IntelligenceFailure {
  return {
    error: { kind: "tool_unavailable", toolId: MEMORY_OBJECT_STORE_TOOL_ID },
    // A store that is not provisioned is a deployment precondition, not a
    // transient fault; retrying would spin forever.
    retryable: false,
    occurredAt: new Date().toISOString()
  };
}

@Injectable()
export class MemoryRepository {
  private readonly logger = new Logger(MemoryRepository.name);

  constructor(
    @Inject(MEMORY_OBJECT_STORE) private readonly store: MemoryObjectStore,
    @Inject(MEMORY_ENGINE_CLOCK) private readonly clock: MemoryClock
  ) {}

  /** Whether memory written here survives a restart (false until M1). */
  get durable(): boolean {
    return this.store.durable;
  }

  /** Which storage is actually behind the engine right now. */
  get backend(): "memory" | "prisma" {
    return this.store.backend;
  }

  /**
   * The live memory in one slot, or null.
   *
   * Null covers three different situations on purpose — nothing was ever
   * written, what was written expired, what was written cannot be honoured —
   * because from the reasoning layer's side they are one situation: this tier
   * has nothing to say. The distinctions are logged and, at the retrieval
   * layer, reported as typed `memory_missing` causes.
   */
  async read(scope: MemoryScope): Promise<AnyMemoryObject | null> {
    const found = await this.readMany([scope]);
    return found.get(memoryScopeKey(scope)) ?? null;
  }

  /** The live memories in these slots, keyed by scope key. */
  async readMany(scopes: readonly MemoryScope[]): Promise<ReadonlyMap<string, AnyMemoryObject>> {
    const live = new Map<string, AnyMemoryObject>();
    if (scopes.length === 0) return live;

    const records = await this.store.read(scopes);
    const screened = screenMemories(records.map((record) => toMemoryObject(record)));

    if (screened.rejected.length > 0) {
      this.logger.warn(
        `dropped ${screened.rejected.length} stored memory object(s) that failed validation: ` +
          screened.rejected.map((rejection) => rejection.errors[0]?.kind ?? "unknown").join(", ")
      );
    }

    const now = this.clock.now();
    const expired: MemoryScope[] = [];

    for (const memory of screened.accepted) {
      const scope = scopeOfMemory(memory);

      if (isExpired(memory, now)) {
        // Lazy deletion: the read that discovers an expired memory is the read
        // that removes it, so expiry does not depend on a sweep having run.
        expired.push(scope);
        continue;
      }

      live.set(memoryScopeKey(scope), memory);
    }

    if (expired.length > 0) await this.store.forget(expired);

    return live;
  }

  /**
   * Writes one memory into its slot, resolving any conflict with what is
   * already there.
   *
   * Returns `kept_existing` — and writes nothing — when the incoming claim
   * loses or changes nothing. That is what makes a redelivered job harmless:
   * the second write finds identical knowledge, resolves to a stable tie, and
   * leaves `updated` where it was, so replaying a job cannot make memory look
   * fresher than the knowledge in it.
   */
  async write(incoming: AnyMemoryObject): Promise<MemoryWriteResult> {
    const errors = screenMemories([incoming]).rejected[0]?.errors ?? [];
    if (errors.length > 0) {
      this.logger.warn(
        `refused a ${incoming.tier} memory: ${errors.map((error) => error.kind).join(", ")}`
      );
      return { memory: null, outcome: "rejected", resolution: null, errors, failure: null };
    }

    if (!this.store.available) {
      return {
        memory: null,
        outcome: "rejected",
        resolution: null,
        errors: [],
        failure: storeUnavailable()
      };
    }

    const scope = scopeOfMemory(incoming);
    const existing = await this.read(scope);
    const resolution = resolveMemoryConflict(existing, incoming);
    const resolved = mergeMemoryPair(existing, incoming, resolution);

    if (existing && knowledgeEquals(existing, resolved) && existing.confidence === resolved.confidence) {
      return { memory: existing, outcome: "kept_existing", resolution, errors: [], failure: null };
    }

    const outcome = await this.store.write([toStoredRecord(resolved)]);
    if (!outcome.persisted) {
      return {
        memory: existing,
        outcome: "rejected",
        resolution,
        errors: [],
        failure: outcome.failure
      };
    }

    return { memory: resolved, outcome: "written", resolution, errors: [], failure: null };
  }

  /** Removes one slot; true when something was there. */
  async forget(scope: MemoryScope): Promise<boolean> {
    return (await this.store.forget([scope])) > 0;
  }

  /** Removes several slots; returns how many existed. */
  async forgetMany(scopes: readonly MemoryScope[]): Promise<number> {
    return scopes.length === 0 ? 0 : this.store.forget(scopes);
  }

  /**
   * Deletes everything that has aged out, optionally for one subject, and
   * reports what it removed.
   *
   * The tiers are what `ExpireMemoryJob` announces: a subscriber that cached
   * a recommendation built on an expired mission needs to know the mission
   * tier changed, not that "a sweep ran".
   */
  async sweepExpired(now?: IsoDateTime, subjectId?: EntityId | null): Promise<readonly MemoryScope[]> {
    return this.store.sweepExpired(now ?? this.clock.now(), subjectId);
  }

  /** The distinct tiers a set of scopes touches, in a stable order. */
  static tiersOf(scopes: readonly MemoryScope[]): readonly MemoryTier[] {
    return [...new Set(scopes.map((scope) => scope.tier))].sort();
  }

  /** The subjects a set of scopes touches — used to scope announcements. */
  static subjectsOf(scopes: readonly MemoryScope[]): readonly EntityId[] {
    return [...new Set(scopes.map((scope) => scope.subjectId))].sort();
  }
}

/**
 * Deep equality of two knowledge payloads, order-insensitive on object keys.
 *
 * Used for one decision only: is this write a change? Key order differs
 * between a payload built by the projection and the same payload read back
 * from JSON storage, and treating that as a change would rewrite `updated` on
 * every recall — which would make every memory look permanently fresh and
 * quietly break recency-based conflict resolution.
 */
export function knowledgeEquals(
  left: { readonly knowledge: object },
  right: { readonly knowledge: object }
): boolean {
  return stableStringify(left.knowledge) === stableStringify(right.knowledge);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

  return `{${entries.join(",")}}`;
}
