/**
 * Layer 4.5 (Hybrid Retrieval) — the three cache tiers.
 *
 * The epic asks for L1 memory, an L2 Redis contract gated on M1 provisioning,
 * and an L3 persistent contract. What ships here is exactly that, with the
 * gating stated rather than implied:
 *
 * | tier | implementation | shared across processes? |
 * | --- | --- | --- |
 * | L1 | in-process, bounded, TTL'd | no |
 * | L2 | platform `CacheService` | **only when Redis is provisioned — it is not** |
 * | L3 | `RetrievalCacheStore` contract | no implementation; gated on M1 |
 *
 * Two decisions carry the design.
 *
 * **What is cached is ids, never items.** Epic 06 learned this the expensive
 * way: `CacheService` round-trips through `JSON.stringify`, so a cached `Date`
 * returns as a string and a cached `Map` returns as `{}`. A `RetrievalItem`
 * carries a `FreshnessDescriptor` whose whole purpose is to be *measured*, and
 * a cache that silently returns a stale freshness reading is worse than no
 * cache, because the corruption surfaces as a confident wrong number. So the
 * shared tiers hold ordered `retrievalItemId` lists — strings — and the items
 * are re-read and re-measured. L1 may hold whole packages because it never
 * serializes anything.
 *
 * **L2 reports whether it is actually shared.** Production has no Redis, so
 * `CacheService` falls back to an in-process map — which is L1 again, wearing a
 * second name. `SharedRetrievalCache.shared` is `false` in that state, and the
 * service reports `hit_l1` rather than `hit_l2` for it, because claiming a
 * distributed cache hit that never left the process is the kind of lie that
 * makes a capacity plan wrong.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { EntityId, IntelligenceFailure, IsoDateTime } from "../core";
import { CacheService } from "../../cache/cache.service";
import { HYBRID_RETRIEVAL_CACHE_STORE, HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import type { CacheStatus, RetrievalPackage, RetrievalQuery } from "./hybrid-retrieval.types";

/** One namespace for the whole layer; invalidation is namespace-versioned. */
export const RETRIEVAL_CACHE_NAMESPACE = "hybrid-retrieval";

/**
 * Seconds.
 *
 * Sixty: long enough that a reasoning pass which retrieves, then re-retrieves
 * after a constraint change, reads once; short enough that a booking made this
 * minute is not missing from the next answer. Retrieval sits in front of
 * knowledge that other jobs mutate, so its TTL is bounded by how wrong an
 * answer may be, not by how expensive the read was.
 */
export const RETRIEVAL_CACHE_TTL = {
  package: 60,
  ids: 60
} as const;

/** Ceiling on L1 entries, so a long-lived API process cannot leak. */
export const MAX_L1_ENTRIES = 500;

/** The tier vocabulary; `l1` is also what a degraded L2 honestly reports as. */
export type RetrievalCacheTierName = "l1" | "l2" | "l3";

/**
 * The L3 seam: a persistent retrieval cache.
 *
 * Contract only. Its use case is real — the same "quiet restaurant near
 * Yunusabad on a Friday" is retrieved by many customers, and a durable cache
 * would survive deploys — but it needs a table, and tables are gated on M1.
 * Declared now so the tier exists in the type and the pipeline's cache
 * accounting is written once.
 */
export interface RetrievalCacheStore {
  readonly available: boolean;
  readonly durable: boolean;
  read(key: string): Promise<readonly string[] | null>;
  write(key: string, itemIds: readonly string[], ttlSeconds: number): Promise<void>;
  invalidate(): Promise<void>;
}

/**
 * The shipped L3: honest absence.
 *
 * Every method answers, none of them pretends. A tier that threw would make
 * every retrieval fail on a capability the platform does not have.
 */
@Injectable()
export class UnavailableRetrievalCacheStore implements RetrievalCacheStore {
  readonly available = false;
  readonly durable = false;

  async read(): Promise<readonly string[] | null> {
    return null;
  }

  async write(): Promise<void> {
    // No-op: writing to a tier that does not exist must not look like it worked.
  }

  async invalidate(): Promise<void> {
    // Nothing to invalidate; idempotent by construction.
  }

  /** The typed reason, for the warning a caller may surface. */
  failure(at: IsoDateTime): IntelligenceFailure {
    return {
      error: { kind: "tool_unavailable", toolId: "hybrid-retrieval.l3-cache" },
      retryable: false,
      occurredAt: at
    };
  }
}

interface L1Entry {
  readonly value: RetrievalPackage;
  readonly expiresAtMs: number;
}

/**
 * L1: in-process, bounded, FIFO-evicted.
 *
 * The only tier that may hold whole packages, because nothing is serialized
 * crossing this boundary — the object handed back is the object stored, so a
 * `FreshnessDescriptor` is still a measurement and not a JSON ghost of one.
 */
@Injectable()
export class InProcessRetrievalCache {
  private readonly entries = new Map<string, L1Entry>();

  read(key: string, nowMs: number): RetrievalPackage | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (entry.expiresAtMs <= nowMs) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  write(key: string, value: RetrievalPackage, ttlSeconds: number, nowMs: number): void {
    if (!this.entries.has(key) && this.entries.size >= MAX_L1_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest) this.entries.delete(oldest);
    }

    this.entries.set(key, { value, expiresAtMs: nowMs + ttlSeconds * 1000 });
  }

  clear(): void {
    this.entries.clear();
  }

  /** Test/diagnostic surface: how many packages are held right now. */
  get size(): number {
    return this.entries.size;
  }
}

/**
 * L2: the platform cache, holding **engine-level candidate id lists** only.
 *
 * Not packages, and not the merged result — the shared tier's job is the
 * question several customers ask identically: "which providers are candidates
 * in this category and area?". That answer is a list of strings, changes when
 * a provider is added (days), and is the same for everyone, which is exactly
 * the shape a shared cache serves well. A *package*, by contrast, is
 * customer-scoped and freshness-measured, so it stays in L1.
 *
 * The API is read-through only (`getOrSet`), which is all `CacheService`
 * exposes; there is deliberately no "peek", because a peek implemented on top
 * of `getOrSet` would write a placeholder on every miss and poison the entry
 * it was trying to inspect.
 *
 * `shared` is the honest bit — see the file comment. When it is false this tier
 * is a second in-process map and the service reports `hit_l1` for it.
 */
@Injectable()
export class SharedRetrievalCache {
  constructor(private readonly cache: CacheService) {}

  /** `redis` or `memory` — surfaced so health checks can report the truth. */
  get backend(): "redis" | "memory" {
    return this.cache.backend;
  }

  /** True only when this tier is genuinely shared across processes. */
  get shared(): boolean {
    return this.cache.backend === "redis";
  }

  /**
   * Read-through cache for one candidate id list.
   *
   * Typed `readonly string[]` on purpose — see the file comment. Widening this
   * signature is how the JSON round-trip bug gets in.
   */
  readIds(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<readonly string[]>
  ): Promise<readonly string[]> {
    return this.cache.getOrSet(RETRIEVAL_CACHE_NAMESPACE, key, ttlSeconds, loader);
  }

  async invalidate(): Promise<void> {
    await this.cache.invalidate(RETRIEVAL_CACHE_NAMESPACE);
  }
}

/** What a cache lookup found, and where. */
export interface RetrievalCacheLookup {
  readonly package: RetrievalPackage | null;
  readonly status: CacheStatus;
}

/**
 * The cache key of one query.
 *
 * Deterministic and total over everything that can change an answer: audience,
 * scope, intent, filters, limits, and the budget priority (which changes the
 * *plan*, and therefore the answer). Two queries that differ in any of those
 * are different questions and must not share a cached answer.
 *
 * `retrievalId` and `queryId` are deliberately excluded — they identify the
 * *call*, not the question, and including them would make every key unique and
 * the cache a memory leak with a hit rate of zero.
 */
export function retrievalCacheKey(query: RetrievalQuery): string {
  const intent = query.intent;

  const parts = [
    `a=${query.audience}`,
    `c=${query.customerId ?? "-"}`,
    `w=${query.workspaceId ?? "-"}`,
    `i=${intent.kind}`,
    `x=${intent.experienceType ?? "-"}`,
    `s=${sorted(intent.subjectEntityIds)}`,
    `sv=${sorted(intent.serviceIds)}`,
    `cat=${sorted(intent.categoryIds)}`,
    `n=${intent.neighborhoodId ?? "-"}`,
    `geo=${intent.anchor ? `${round(intent.anchor.latitude)},${round(intent.anchor.longitude)}` : "-"}`,
    `win=${intent.window ? `${intent.window.start}/${intent.window.end}` : "-"}`,
    `b=${intent.budget ? `${money(intent.budget.min)}-${money(intent.budget.max)}` : "-"}`,
    `p=${intent.partySize ?? "-"}`,
    `cap=${sorted(intent.requiredCapabilityKeys)}`,
    `loc=${intent.locale ?? "-"}`,
    `f=${filterKey(query)}`,
    `l=${query.limits.perEngine}/${query.limits.total}/${query.limits.hydrateTo}`,
    `pr=${query.budget.priority}`
  ];

  return parts.join("|");
}

function sorted(values: readonly string[]): string {
  return values.length === 0 ? "-" : [...values].sort().join(",");
}

/** Six decimals ≈ 11cm: finer than that is noise, and noise breaks cache keys. */
function round(value: number): string {
  return value.toFixed(6);
}

function money(amount: { readonly amountMinor: number; readonly currency: string } | null): string {
  return amount ? `${amount.amountMinor}${amount.currency}` : "-";
}

/** Filters, canonicalized: same set in any order is the same question. */
function filterKey(query: RetrievalQuery): string {
  if (query.filters.length === 0) return "-";

  return [...query.filters]
    .map((filter) => JSON.stringify(filter, Object.keys(filter).sort()))
    .sort()
    .join(";");
}

/**
 * The tiered cache, as one dependency.
 *
 * Reads walk L1 → L2 → L3 and stop at the first hit; writes populate every
 * available tier. The `cacheEligible` flag on the request's `InferenceBudget`
 * (patch F) is honoured at the top: a caller that declared itself ineligible
 * gets `bypass` and neither reads nor writes.
 */
@Injectable()
export class RetrievalCacheService {
  constructor(
    private readonly l1: InProcessRetrievalCache,
    private readonly l2: SharedRetrievalCache,
    @Inject(HYBRID_RETRIEVAL_CLOCK) private readonly clock: RetrievalClock,
    @Optional()
    @Inject(HYBRID_RETRIEVAL_CACHE_STORE)
    private readonly l3: RetrievalCacheStore | null = null
  ) {}

  /** Which tiers can actually serve — reported by health output and the docs. */
  get tiers(): Readonly<Record<RetrievalCacheTierName, boolean>> {
    return {
      l1: true,
      l2: true,
      l3: this.l3?.available ?? false
    };
  }

  /** True when L2 is genuinely a shared tier rather than a second L1. */
  get l2Shared(): boolean {
    return this.l2.shared;
  }

  /**
   * Reads one query's package.
   *
   * L1 holds packages; L3 holds ids and is asked second, because a persistent
   * hit still proves the question was answered recently and is worth reporting
   * even though the items must be re-read. L2 is not consulted here at all —
   * it caches engine candidate lists, not packages, and pretending otherwise
   * would report a tier that had nothing to do with the answer.
   */
  async read(query: RetrievalQuery): Promise<RetrievalCacheLookup> {
    if (!query.budget.cacheEligible) return { package: null, status: "bypass" };

    const key = retrievalCacheKey(query);

    const hit = this.l1.read(key, this.clock.monotonicMs());
    if (hit) return { package: hit, status: "hit_l1" };

    const persisted = await this.l3?.read(key);
    if (persisted && persisted.length > 0) return { package: null, status: "hit_l3" };

    return { package: null, status: "miss" };
  }

  /** Stores a package in every tier that can hold it. */
  async write(query: RetrievalQuery, value: RetrievalPackage): Promise<void> {
    if (!query.budget.cacheEligible) return;

    const key = retrievalCacheKey(query);
    this.l1.write(key, value, RETRIEVAL_CACHE_TTL.package, this.clock.monotonicMs());

    await this.l3?.write(
      key,
      value.items.map((item) => item.retrievalItemId),
      RETRIEVAL_CACHE_TTL.ids
    );
  }

  /**
   * The shared tier, for engines that cache candidate id lists.
   *
   * Exposed rather than injected separately so there is one cache dependency
   * in this module and one namespace to invalidate.
   */
  readEngineIds(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<readonly string[]>
  ): Promise<readonly string[]> {
    return this.l2.readIds(key, ttlSeconds, loader);
  }

  /** Drops every cached retrieval. Idempotent: invalidating twice is harmless. */
  async invalidate(): Promise<void> {
    this.l1.clear();
    await this.l2.invalidate();
    await this.l3?.invalidate();
  }

  /** Ids of the entities a cached package covered — for cache-aware invalidation. */
  static entityIdsOf(value: RetrievalPackage): readonly EntityId[] {
    return [...new Set(value.items.map((item) => item.entityId))];
  }
}
