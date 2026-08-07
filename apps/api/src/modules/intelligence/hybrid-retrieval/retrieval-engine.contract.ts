/**
 * Layer 4.5 (Hybrid Retrieval) — the one contract all seven engines satisfy.
 *
 * The epic's central structural demand: **identical contracts**. Five methods,
 * the same five, whether the engine walks a graph, reads memory tiers, or
 * would one day query a vector index. That identity is what makes ADR-006's
 * "every engine replaceable" true — the pipeline holds a `readonly
 * RetrievalEngine[]` and cannot tell them apart, so swapping, adding, or
 * removing one is a change to a provider array and nothing else.
 *
 * ```text
 *   search()  — find candidates from a structured query
 *   lookup()  — fetch known ids (replacement, hydration, "tell me about THIS")
 *   hydrate() — expand items to a deeper level, lazily
 *   score()   — attach this engine's score components
 *   explain() — structured reasons, never prose
 * ```
 *
 * Everything else on the interface is metadata the pipeline needs to *place*
 * an engine — its rank, its context section, what it can honestly serve — and
 * all of it is data, so an engine cannot lie about its own availability
 * without that lie being visible in one field.
 */
import type { EntityId, IsoDateTime } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import type { RetrievalSource } from "../memory-engine";
import type {
  CacheStatus,
  HydrationLevel,
  RetrievalEngineId,
  RetrievalExplanation,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalOutcome,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/**
 * What an engine can honestly promise right now.
 *
 * `available: false` is a first-class, expected state — the semantic engine
 * ships that way by design, and the workspace engine is that way because the
 * relational schema has no workspace table. An engine that is unavailable
 * still answers every call; it answers with `insufficient_data`.
 */
export interface RetrievalEngineAvailability {
  readonly available: boolean;
  /** Where the engine's answers come from, for health output. */
  readonly backend: "graph" | "memory" | "summaries" | "features" | "vector" | "none";
  /**
   * Why it is unavailable, as a stable key (`schema.workspace`,
   * `provider.semantic`). `null` when available.
   */
  readonly unavailableReason: string | null;
  /** True when the engine's answers survive a process restart. */
  readonly durable: boolean;
}

/** The result of one engine call, with the accounting the pipeline aggregates. */
export interface RetrievalEngineResult {
  readonly engineId: RetrievalEngineId;
  readonly outcome: RetrievalOutcome<readonly RetrievalItem[]>;
  readonly executionMs: number;
  readonly cacheStatus: CacheStatus;
  readonly generatedAt: IsoDateTime;
  /** True when `limits.perEngine` cut the result short — never silent. */
  readonly truncated: boolean;
}

/**
 * The uniform engine contract.
 *
 * Deliberately *not* generic over a payload type. A generic engine interface
 * would let the pipeline's type depend on which engines are installed, and
 * then "swap the business engine for a different one" stops being a wiring
 * change. Payload variance lives inside `RetrievalPayload`'s keyed facts,
 * where it costs nothing.
 */
export interface RetrievalEngine {
  readonly id: RetrievalEngineId;
  /** The frozen source this engine speaks for; `null` where the Bible names none. */
  readonly retrievalSource: RetrievalSource | null;
  /** Which context-window section this engine's items fill (patch G). */
  readonly contextSection: ContextSection;
  /** The item kinds this engine can produce — checked against what it returns. */
  readonly itemKinds: readonly RetrievalItemKind[];
  /** The hydration levels this engine can actually serve, cheapest first. */
  readonly hydrationLevels: readonly HydrationLevel[];
  /** Honest self-report; read by the planner, health checks, and the docs. */
  readonly availability: RetrievalEngineAvailability;

  /** Find candidates for a structured query. */
  search(query: RetrievalQuery): Promise<RetrievalEngineResult>;

  /** Fetch entities already named — replacement flows, re-hydration, follow-ups. */
  lookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<RetrievalEngineResult>;

  /**
   * Expand items to a deeper level.
   *
   * Engines return what they can and leave the rest at the level they were:
   * a `hydration` field that did not move is the honest report that this
   * engine has nothing deeper, and the pipeline records it as a warning rather
   * than pretending the expansion happened.
   */
  hydrate(items: readonly RetrievalItem[], level: HydrationLevel): Promise<readonly RetrievalItem[]>;

  /**
   * Attach this engine's score components.
   *
   * Separate from `search` because the same item can be scored by more than
   * one engine after a merge — the graph knows the relationship strength, the
   * feature store knows popularity — and a scoring step folded into retrieval
   * could only ever see its own engine's view.
   */
  score(items: readonly RetrievalItem[], query: RetrievalQuery): Promise<readonly RetrievalItem[]>;

  /** Why this item is here, as structured data. Synchronous: it is a projection. */
  explain(item: RetrievalItem): RetrievalExplanation;
}

/** Health of one engine, as a health endpoint would report it. */
export interface RetrievalEngineHealth {
  readonly engineId: RetrievalEngineId;
  readonly availability: RetrievalEngineAvailability;
  readonly retrievalSource: RetrievalSource | null;
  readonly contextSection: ContextSection;
  readonly itemKinds: readonly RetrievalItemKind[];
  readonly hydrationLevels: readonly HydrationLevel[];
}

/** The health projection of one engine. */
export function engineHealth(engine: RetrievalEngine): RetrievalEngineHealth {
  return {
    engineId: engine.id,
    availability: engine.availability,
    retrievalSource: engine.retrievalSource,
    contextSection: engine.contextSection,
    itemKinds: engine.itemKinds,
    hydrationLevels: engine.hydrationLevels
  };
}
