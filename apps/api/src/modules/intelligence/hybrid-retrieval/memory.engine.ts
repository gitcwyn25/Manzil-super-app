/**
 * Layer 4.5 (Hybrid Retrieval) — the Memory engine.
 *
 * ADR-006: **memory outranks embeddings**. This is the engine that makes that
 * true, and it is the one whose items carry finer-grained priority than their
 * engine does: mission knowledge ranks 1 and preference knowledge ranks 2
 * under the frozen `RETRIEVAL_PRIORITY`, because "today's objective" and "a
 * durable taste" are the distinction the AI Bible cares most about and
 * flattening them would lose it.
 *
 * **Three of the six tiers are emitted here, and three deliberately are not.**
 *
 * | tier | emitted | why |
 * | --- | --- | --- |
 * | `mission_context` | yes | rank 1; the current objective |
 * | `preference_context` | yes | rank 2; durable tastes |
 * | `relationship_context` | yes | half a step below the engine (Epic 05's v1.4 amendment) |
 * | `workspace_timeline` | **no** | the Workspace engine owns it — it *is* that engine's data |
 * | `business_context` | **no** | Layer 2 summaries memory caches; the Business engine reads the same ones |
 * | `marketplace_context` | **no** | same, for the Marketplace engine |
 *
 * The last two matter. Memory holds Layer 2 summaries so a reasoning pass does
 * not re-read them, but emitting them *from here* would rank a marketplace
 * trend at memory priority — which is precisely the inversion the retrieval
 * order exists to prevent. The Business and Marketplace engines return the
 * same knowledge at the rank it deserves, and the merge step folds the two
 * views together when they overlap.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_MEMORY } from "../orchestrator-contracts/orchestrator.tokens";
import type {
  AnyMemoryObject,
  MemoryBundle,
  MemoryEngineProvider,
  RetrievalSource
} from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore, freshnessScoreOf } from "./retrieval-scoring";
import { refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** The featureKey reported when the memory provider is not wired. */
export const MEMORY_PROVIDER_FEATURE = "retrieval.memory.provider";

@Injectable()
export class MemoryRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "memory";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.memory;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.memory;
  readonly itemKinds: readonly RetrievalItemKind[] = ["mission", "preference", "related_customer"];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary"];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(INTELLIGENCE_MEMORY)
    private readonly memory: MemoryEngineProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.memory !== null,
      backend: this.memory !== null ? "memory" : "none",
      unavailableReason: this.memory !== null ? null : MEMORY_PROVIDER_FEATURE,
      // Epic 05 ships memory in-process until M1 applies its migration, and
      // says so on `MemoryEngineService.persistence`. This engine cannot read
      // that through the frozen provider interface, so it reports the
      // conservative answer rather than a guess.
      durable: false
    };
  }

  /**
   * Memory has no search: it is keyed by customer, always.
   *
   * `recall(customerId, workspaceId)` is the whole read side of the frozen
   * contract, so a "search memory" operation would have to invent a query
   * language over knowledge that is already indexed by the only key that
   * matters. `search` therefore delegates to `lookup` on the query's customer
   * — the contract stays identical across the seven engines, and this one
   * simply has one way in.
   */
  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    return this.runLookup(query.customerId === null ? [] : [query.customerId], query);
  }

  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const memory = this.memory;
    const now = this.clock.now();

    if (memory === null) {
      return { outcome: refuseUnavailableFeature(MEMORY_PROVIDER_FEATURE, now) };
    }

    const customerId = ids[0] ?? query.customerId;
    if (!customerId) {
      // An anonymous request has no memory, and that is a fact rather than a
      // fault: `memory_missing` names the tier and the (absent) customer.
      return {
        outcome: {
          status: "insufficient_data",
          failure: {
            error: { kind: "memory_missing", tier: "preference_context", customerId: null },
            retryable: false,
            occurredAt: now
          }
        }
      };
    }

    const bundle = await memory.recall(customerId, query.workspaceId);
    const items = this.toItems(bundle, now);

    return { outcome: retrieved(items, bundleConfidence(items)) };
  }

  /** The three emitted tiers as retrieval items. See the file comment. */
  private toItems(bundle: MemoryBundle, now: string): readonly RetrievalItem[] {
    const items: RetrievalItem[] = [];

    if (bundle.mission) {
      const knowledge = bundle.mission.knowledge;
      items.push(
        this.toItem(bundle.mission, "mission", knowledge.customerId, "mission_context", now, [
          fact("mission.experienceType", knowledge.experienceType),
          fact("mission.targetDate", knowledge.targetDate),
          fact("mission.guestCount", knowledge.guestCount),
          fact("mission.nearNeighborhoodId", knowledge.nearNeighborhoodId),
          fact("mission.workspaceId", knowledge.workspaceId),
          fact("mission.requiredCapabilityKeys", knowledge.requiredCapabilityKeys),
          fact("mission.budgetMinMinor", knowledge.budget?.min?.amountMinor ?? null),
          fact("mission.budgetMaxMinor", knowledge.budget?.max?.amountMinor ?? null)
        ])
      );
    }

    if (bundle.preferences) {
      const knowledge = bundle.preferences.knowledge;
      items.push(
        this.toItem(
          bundle.preferences,
          "preference",
          knowledge.customerId,
          "persistent_preferences",
          now,
          [
            fact(
              "preference.dimensions",
              knowledge.preferences.map((entry) => `${entry.dimension}=${entry.fact.value}`)
            ),
            fact(
              "preference.dietary",
              knowledge.dietary.map((entry) => String(entry.value))
            ),
            fact("preference.favoriteBusinessIds", knowledge.favoriteBusinessIds),
            fact("preference.budgetMaxMinor", knowledge.budget?.max?.amountMinor ?? null)
          ],
          knowledge.favoriteBusinessIds
        )
      );
    }

    if (bundle.relationships) {
      const knowledge = bundle.relationships.knowledge;
      for (const companion of knowledge.companions) {
        items.push(
          this.toItem(
            bundle.relationships,
            "related_customer",
            companion.companionId,
            // The Bible's seven-source list has no member for relationship
            // memory (Epic 05's v1.4 amendment): `null` here, and the ranking
            // places it half a step below the memory engine's own rank.
            null,
            now,
            [
              fact("companion.sharedVisitCount", companion.sharedVisitCount),
              fact(
                "companion.recurringOccasions",
                companion.recurringOccasions.map((occasion) => occasion.value.experienceType)
              )
            ]
          )
        );
      }
    }

    return items;
  }

  private toItem(
    memory: AnyMemoryObject,
    kind: RetrievalItemKind,
    entityId: EntityId,
    source: RetrievalSource | null,
    now: string,
    facts: readonly (ReturnType<typeof fact>)[],
    relatedIds: readonly EntityId[] = []
  ): RetrievalItem {
    const freshness = freshnessScoreOf(
      Math.max(0, (Date.parse(now) - Date.parse(memory.updated)) / 1000),
      RETRIEVAL_TTL.memory
    );

    return buildItem({
      kind,
      entityId,
      engineId: this.id,
      retrievalSource: source,
      score: buildScore(memory.confidence, [kind === "mission" ? "mission_match" : "memory_match"], {
        memoryScore: memory.confidence,
        freshnessScore: freshness
      }),
      payload: payloadOf(
        [...facts, fact("memory.tier", memory.tier), fact("memory.memoryId", memory.memoryId)],
        relatedIds
      ),
      confidence: memory.confidence,
      generatedAt: memory.updated,
      now,
      ttlSeconds: RETRIEVAL_TTL.memory
    });
  }
}

/** Confidence of a recall: the highest-priority memory's own confidence. */
function bundleConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.confidence));
}
