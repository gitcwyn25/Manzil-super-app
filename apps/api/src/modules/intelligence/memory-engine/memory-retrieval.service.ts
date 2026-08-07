/**
 * Layer 4 (Memory Engine) — retrieval, in the binding order.
 *
 * AI Bible v1.2: "Gurman always prefers the user's current plan over generic
 * knowledge. This ordering is part of the AI contract, not an implementation
 * detail." So this service does not decide an order — it reads one, from
 * `MEMORY_TIER_RETRIEVAL_ORDER`, which in turn restates the frozen
 * `RETRIEVAL_PRIORITY` for every tier the Bible names.
 *
 * Two things happen here beyond loading rows:
 *
 * - **The preference overlay.** Preference memory is projection *plus* what
 *   was explicitly remembered. Behaviour proves a floor (four visits to one
 *   tea house), statements refine it, and the conflict rule decides where they
 *   disagree — with the projection stamped at the time of the last visit, not
 *   at read time, so a live derivation can never out-recency something the
 *   customer actually said.
 * - **Honest absence.** A tier with nothing to say is reported as a typed
 *   `memory_missing`, not as an empty object. "We have not met before" and "we
 *   forgot" must not look the same to the reasoning layer.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId, IntelligenceError, IsoDateTime, MemoryTier } from "../core";
import { resolveMemoryConflict, mergeMemoryPair } from "./memory.conflict";
import { stampMemory } from "./memory.lifecycle";
import { MemoryCacheService, MEMORY_CACHE_TTL } from "./memory-cache.service";
import { MemoryProjectionRepository } from "./memory-projection.repository";
import { MEMORY_ENGINE_CLOCK } from "./memory-engine.tokens";
import type { MemoryClock } from "./memory-engine.clock";
import { projectPreferenceKnowledge } from "./memory.projection";
import {
  MEMORY_TIER_RETRIEVAL_ORDER,
  sortByRetrievalPriority
} from "./memory.priority";
import { MemoryRepository } from "./memory.repository";
import { memoryScopeKey, scopeFor, type MemoryScope, type MemorySubjects } from "./memory.scope";
import { memoryMissing } from "./memory.validation";
import type {
  AnyMemoryObject,
  BusinessContext,
  MarketplaceContext,
  MemoryBundle,
  MissionContext,
  PreferenceContext,
  RelationshipContext,
  WorkspaceTimeline
} from "./memory.tiers";

/** A recall, with everything doc 23 §9 needs to explain it afterwards. */
export interface MemoryRecallResult {
  readonly bundle: MemoryBundle;
  /** Every loaded memory, in the binding retrieval order. */
  readonly memories: readonly AnyMemoryObject[];
  /** `memoryIds consulted` — the ids a recommendation must carry (doc 23 §9). */
  readonly consultedMemoryIds: readonly EntityId[];
  /** Typed causes for every tier that had nothing to say. */
  readonly missing: readonly IntelligenceError[];
  readonly at: IsoDateTime;
}

/** The empty bundle: total in shape, honest about holding nothing. */
export function emptyMemoryBundle(): MemoryBundle {
  return {
    mission: null,
    preferences: null,
    relationships: null,
    workspaceTimeline: null,
    businessContext: null,
    marketplaceContext: null
  };
}

@Injectable()
export class MemoryRetrievalService {
  constructor(
    private readonly repository: MemoryRepository,
    private readonly projection: MemoryProjectionRepository,
    private readonly cache: MemoryCacheService,
    @Inject(MEMORY_ENGINE_CLOCK) private readonly clock: MemoryClock
  ) {}

  /** The frozen `MemoryEngineProvider.recall` contract. */
  async recall(customerId: EntityId, workspaceId: EntityId | null): Promise<MemoryBundle> {
    return (await this.recallOrdered({ customerId, workspaceId })).bundle;
  }

  /**
   * Recall with its provenance: the ordered memories, the ids consulted, and
   * the typed reasons for every tier that came back empty.
   *
   * Loading is one store read for all six tiers, then assembly in priority
   * order — not six sequential reads, because the order is about *precedence*,
   * not about the sequence in which bytes are fetched.
   */
  async recallOrdered(subjects: MemorySubjects): Promise<MemoryRecallResult> {
    const at = this.clock.now();
    const scopes: MemoryScope[] = [];
    const missing: IntelligenceError[] = [];

    for (const tier of MEMORY_TIER_RETRIEVAL_ORDER) {
      const scope = scopeFor(tier, subjects);
      if (scope) {
        scopes.push(scope);
      } else {
        // No subject at all — a customer with no workspace has no timeline.
        // That is an absence with a cause, and the cause is worth carrying.
        missing.push(memoryMissing(tier, subjects.customerId));
      }
    }

    const stored = await this.repository.readMany(scopes);
    const byTier = new Map<MemoryTier, AnyMemoryObject>();

    for (const scope of scopes) {
      const memory = stored.get(memoryScopeKey(scope));
      if (memory) byTier.set(scope.tier, memory);
    }

    const preference = await this.assemblePreference(
      subjects.customerId,
      byTier.get("preference_context") as PreferenceContext | undefined
    );
    if (preference) byTier.set("preference_context", preference);

    for (const tier of MEMORY_TIER_RETRIEVAL_ORDER) {
      const hasSubject = scopes.some((scope) => scope.tier === tier);
      if (hasSubject && !byTier.has(tier)) missing.push(memoryMissing(tier, subjects.customerId));
    }

    const memories = sortByRetrievalPriority([...byTier.values()]);

    return {
      bundle: {
        mission: (byTier.get("mission_context") as MissionContext) ?? null,
        preferences: (byTier.get("preference_context") as PreferenceContext) ?? null,
        relationships: (byTier.get("relationship_context") as RelationshipContext) ?? null,
        workspaceTimeline: (byTier.get("workspace_timeline") as WorkspaceTimeline) ?? null,
        businessContext: (byTier.get("business_context") as BusinessContext) ?? null,
        marketplaceContext: (byTier.get("marketplace_context") as MarketplaceContext) ?? null
      },
      memories,
      consultedMemoryIds: memories.map((memory) => memory.memoryId),
      missing,
      at
    };
  }

  /**
   * Preference memory: what behaviour proves, refined by what was remembered.
   *
   * Either side may be absent. When both exist they are combined by the same
   * `mergeMemoryPair` the write path uses, so a preference assembled during a
   * recall and one written by a job are never combined by two different rules.
   */
  private async assemblePreference(
    customerId: EntityId,
    stored: PreferenceContext | undefined
  ): Promise<PreferenceContext | null> {
    const projected = await this.projectPreference(customerId);

    if (!projected) return stored ?? null;
    if (!stored) return projected;

    const resolution = resolveMemoryConflict(projected, stored);
    return mergeMemoryPair(projected, stored, resolution) as PreferenceContext;
  }

  /**
   * The preference tier derived from activity, or null when there is no
   * activity to derive it from.
   *
   * Stamped at the last visit's instant rather than now: the projection's
   * claim is as of the last thing the customer actually did, and stamping it
   * "now" on every read would let a derivation win recency against a statement
   * the customer made yesterday.
   */
  async projectPreference(customerId: EntityId): Promise<PreferenceContext | null> {
    if (!customerId) return null;

    const now = this.clock.now();
    const activity = await this.cache.read(
      `activity:${customerId}`,
      MEMORY_CACHE_TTL.projection,
      () => this.projection.activityOf(customerId)
    );

    const projected = projectPreferenceKnowledge({
      customerId,
      customers: activity.customers,
      visits: activity.visits,
      businesses: activity.businesses,
      now
    });

    if (projected.evidenceCount === 0) return null;

    return stampMemory({
      tier: "preference_context",
      subjectId: customerId,
      // The tier object is the platform's reading of counted visits; the facts
      // inside it say `visit`, because those restate rows. Keeping the two
      // apart is what lets trust distinguish "you went four times" from "so
      // you like it".
      source: "platform_inference",
      confidence: projected.confidence,
      knowledge: projected.knowledge,
      now: projected.observedAt,
      created: projected.observedAt
    });
  }
}
