/**
 * Layer 4.5 (Hybrid Retrieval) — the Workspace engine.
 *
 * **Rank 0. Nothing outranks this.** ADR-006: *workspace context outranks
 * generic recommendations*, which is the AI Bible v1.2's first sentence about
 * retrieval restated — "Gurman always prefers the user's current plan over
 * generic knowledge. This ordering is part of the AI contract, not an
 * implementation detail." If the plan already holds a date, a budget, or a
 * confirmed venue, no recommendation may quietly contradict it.
 *
 * **Where the data comes from, honestly.** There is no `Workspace` table.
 * Epic 06 found this and reported it: `SummarizeWorkspaceJob` refuses with
 * `knowledge_missing` every time it runs, and will until a migration exists.
 * So this engine has exactly one real source — the Memory Engine's
 * `workspace_timeline` tier, which holds the timeline entries a workspace has
 * accumulated in *this* process.
 *
 * That gives two honest outcomes and no third:
 *
 * - the tier has entries → **real items** at rank 0, from live memory;
 * - the tier is empty → `knowledge_missing` naming `schema.workspace`, so the
 *   caller can tell "this plan is empty" from "this platform has no plans".
 *
 * Returning `[]` for the second case would have told a reasoning layer that the
 * user's plan places no constraints on the answer. It does not know that.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Confidence, EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import { INTELLIGENCE_MEMORY } from "../orchestrator-contracts/orchestrator.tokens";
import type { MemoryEngineProvider, RetrievalSource, WorkspaceTimeline } from "../memory-engine";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_FACT_KEYS, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { refuseMissingKnowledge, refuseUnavailableFeature, retrieved } from "./retrieval-outcome";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** The featureKey reported when the memory provider (this engine's source) is absent. */
export const WORKSPACE_SOURCE_FEATURE = "retrieval.workspace.memory_source";

/**
 * The missingKey reported when no workspace knowledge exists.
 *
 * `schema.workspace` rather than `workspace.empty`: the reason nothing is here
 * is that the relational schema has no Workspace model, and a scheduler that
 * read this as "sparse" would retry forever for data no row can contain.
 */
export const WORKSPACE_SCHEMA_MISSING_KEY = "schema.workspace";

/**
 * Kinds of timeline entry that constrain a recommendation.
 *
 * A confirmed booking or a made payment is a commitment the plan has already
 * taken; a note is not. Both are retrieved — the distinction is a fact on the
 * item (`workspace.committing`), so Layer 5 decides what to do with it and
 * this layer does not decide anything.
 */
export const COMMITTING_TIMELINE_KINDS = ["booking_confirmed", "payment_made"] as const;

@Injectable()
export class WorkspaceRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "workspace";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.workspace;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.workspace;
  readonly itemKinds: readonly RetrievalItemKind[] = ["workspace", "experience", "availability"];
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
      unavailableReason: this.memory !== null ? null : WORKSPACE_SOURCE_FEATURE,
      // No Workspace table; the timeline lives in the Memory Engine's
      // in-process store until M1. Nothing here survives a restart.
      durable: false
    };
  }

  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    return this.runLookup(query.workspaceId === null ? [] : [query.workspaceId], query);
  }

  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    const memory = this.memory;
    const now = this.clock.now();

    if (memory === null) {
      return { outcome: refuseUnavailableFeature(WORKSPACE_SOURCE_FEATURE, now) };
    }

    const workspaceId = ids[0] ?? query.workspaceId;
    if (!workspaceId || !query.customerId) {
      return { outcome: refuseMissingKnowledge(WORKSPACE_SCHEMA_MISSING_KEY, now, workspaceId ?? null) };
    }

    const bundle = await memory.recall(query.customerId, workspaceId);
    const timeline = bundle.workspaceTimeline;

    if (!timeline || timeline.knowledge.entries.length === 0) {
      return { outcome: refuseMissingKnowledge(WORKSPACE_SCHEMA_MISSING_KEY, now, workspaceId) };
    }

    return {
      outcome: retrieved(this.toItems(timeline, now), timeline.confidence)
    };
  }

  /**
   * The timeline as items.
   *
   * One item for the workspace itself — the thing that ranks above everything
   * — and one per *committing* entry, because a confirmed booking is a
   * constraint on the answer and deserves to be an item a filter can see, not
   * a fact buried in a list.
   */
  private toItems(timeline: WorkspaceTimeline, now: string): readonly RetrievalItem[] {
    const knowledge = timeline.knowledge;
    const committing = new Set<string>(COMMITTING_TIMELINE_KINDS);

    const workspaceItem = buildItem({
      kind: "workspace",
      entityId: knowledge.workspaceId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(timeline.confidence, ["workspace_match", "priority_source"], {
        memoryScore: timeline.confidence
      }),
      payload: payloadOf(
        [
          fact(RETRIEVAL_FACT_KEYS.workspaceId, knowledge.workspaceId),
          fact("workspace.experienceId", knowledge.experienceId),
          fact("workspace.entryCount", knowledge.entries.length),
          fact(
            "workspace.entryKinds",
            [...new Set(knowledge.entries.map((entry) => entry.kind))].sort()
          ),
          fact("workspace.lastEntryAt", lastEntryAt(knowledge.entries))
        ],
        knowledge.experienceId ? [knowledge.experienceId] : []
      ),
      confidence: timeline.confidence,
      generatedAt: timeline.updated,
      now,
      ttlSeconds: RETRIEVAL_TTL.workspace
    });

    const commitments = knowledge.entries
      .filter((entry) => committing.has(entry.kind) && entry.taskId !== null)
      .map((entry) =>
        buildItem({
          kind: "availability",
          entityId: entry.taskId as EntityId,
          engineId: this.id,
          retrievalSource: this.retrievalSource,
          score: buildScore(timeline.confidence, ["workspace_match"], {
            memoryScore: timeline.confidence,
            // A confirmed commitment is availability that already happened.
            availabilityScore: 1
          }),
          payload: payloadOf(
            [
              fact("workspace.entryKind", entry.kind),
              fact("workspace.committing", true),
              fact(RETRIEVAL_FACT_KEYS.availabilityWindowStart, entry.at),
              fact(RETRIEVAL_FACT_KEYS.workspaceId, knowledge.workspaceId)
            ],
            [knowledge.workspaceId]
          ),
          confidence: timeline.confidence,
          generatedAt: entry.at,
          now,
          ttlSeconds: RETRIEVAL_TTL.workspace
        })
      );

    return [workspaceItem, ...commitments];
  }
}

/** The most recent entry timestamp, or null for an empty timeline. */
function lastEntryAt(entries: readonly { readonly at: string }[]): string | null {
  if (entries.length === 0) return null;
  return entries.reduce((latest, entry) => (entry.at > latest ? entry.at : latest), entries[0]!.at);
}

/** Kept for symmetry with the other engines' confidence helpers. */
export function workspaceConfidence(items: readonly RetrievalItem[]): Confidence {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.confidence));
}
