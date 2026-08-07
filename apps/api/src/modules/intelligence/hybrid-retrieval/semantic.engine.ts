/**
 * Layer 4.5 (Hybrid Retrieval) — the Semantic engine. **Contract-only.**
 *
 * The seventh engine exists so that the other six do not have to pretend
 * semantic search is impossible, and it is unimplemented so that nobody can
 * pretend it is mandatory. ADR-006: *vector search is optional, never
 * mandatory* — and an optional capability is only optional if the system is
 * correct without it.
 *
 * So this engine:
 *
 * - satisfies the same five-method contract as the other six, so the pipeline
 *   cannot tell it apart and no code branches on "is semantic installed?";
 * - injects `HYBRID_RETRIEVAL_SEMANTIC_PROVIDER` `@Optional()`, and **nothing
 *   in this repository binds it**;
 * - answers every call with `feature_unavailable`, naming
 *   `retrieval.semantic.vector_index`, so the refusal is a typed fact an
 *   operator can act on rather than an empty list that reads as "no matches";
 * - ranks **last** in `ENGINE_RETRIEVAL_ORDER` if it ever does return items.
 *
 * **There is no embedding here and there must never be one.** The provider
 * contract takes a vector as *input* (`semantic-provider.contract.ts`);
 * whatever computes that vector lives outside this module, outside this layer,
 * and behind its own seam. An `embed()` on this class would put a model inside
 * the retrieval layer — the precise inversion ADR-005 exists to prevent, and
 * the reason this epic's scope boundary was drawn where it was.
 *
 * The test of whether this contract was drawn correctly: binding a provider
 * should make this engine return items with **no change to any other file**.
 */
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { EntityId } from "../core";
import type { ContextSection } from "../orchestrator-contracts/context-window.contract";
import type { RetrievalSource } from "../memory-engine";
import {
  HYBRID_RETRIEVAL_CLOCK,
  HYBRID_RETRIEVAL_SEMANTIC_PROVIDER
} from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { BaseRetrievalEngine, type EngineRun } from "./retrieval-engine.base";
import type { RetrievalEngineAvailability } from "./retrieval-engine.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { buildItem, fact, payloadOf, RETRIEVAL_TTL } from "./retrieval-item";
import { buildScore } from "./retrieval-scoring";
import { refuseUnavailableFeature } from "./retrieval-outcome";
import {
  SEMANTIC_FEATURE_KEY,
  type SemanticMatch,
  type SemanticRecordKind,
  type SemanticRetrievalProvider
} from "./semantic-provider.contract";
import type {
  HydrationLevel,
  RetrievalEngineId,
  RetrievalItemKind,
  RetrievalItem,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/**
 * The kinds a semantic index would carry, mapped to retrieval kinds.
 *
 * Declared even though nothing uses it today, because it is the piece a future
 * adapter would otherwise have to invent — and inventing it later, in an
 * adapter, is how a vector store's vocabulary leaks into the platform's.
 */
export const SEMANTIC_KIND_TO_ITEM_KIND = {
  business: "business",
  service: "service",
  experience: "experience",
  review: "knowledge_node",
  story: "knowledge_node"
} as const satisfies Readonly<Record<SemanticRecordKind, RetrievalItemKind>>;

/** Default neighbour count, were a provider ever bound. */
export const SEMANTIC_DEFAULT_TOP_K = 25;

/** Default similarity floor: below this a neighbour is noise wearing a score. */
export const SEMANTIC_MIN_SCORE = 0.6;

@Injectable()
export class SemanticRetrievalEngine extends BaseRetrievalEngine {
  readonly id: RetrievalEngineId = "semantic";
  readonly retrievalSource: RetrievalSource | null = ENGINE_RETRIEVAL_SOURCE.semantic;
  readonly contextSection: ContextSection = ENGINE_CONTEXT_SECTION.semantic;
  readonly itemKinds: readonly RetrievalItemKind[] = ["business", "service", "experience", "knowledge_node"];
  readonly hydrationLevels: readonly HydrationLevel[] = ["summary"];

  constructor(
    @Inject(HYBRID_RETRIEVAL_CLOCK) clock: RetrievalClock,
    @Optional()
    @Inject(HYBRID_RETRIEVAL_SEMANTIC_PROVIDER)
    private readonly provider: SemanticRetrievalProvider | null = null
  ) {
    super(clock);
  }

  get availability(): RetrievalEngineAvailability {
    return {
      available: this.provider !== null,
      backend: this.provider !== null ? "vector" : "none",
      unavailableReason: this.provider !== null ? null : SEMANTIC_FEATURE_KEY,
      durable: this.provider !== null
    };
  }

  /**
   * Semantic search needs a query vector. This module does not make vectors.
   *
   * Even with a provider bound, `RetrievalQuery` carries no vector — because
   * `RetrievalIntent` is structured intent, not text, and there is nothing here
   * to embed. A future embedding seam would hand the vector in alongside the
   * query; until both exist, the honest answer is the same one an unbound
   * provider gives.
   */
  protected async runSearch(query: RetrievalQuery): Promise<EngineRun> {
    void query;
    return { outcome: refuseUnavailableFeature(SEMANTIC_FEATURE_KEY, this.clock.now()) };
  }

  /**
   * Lookup by id is not a semantic operation.
   *
   * A vector store can fetch a record by id, but "give me the stored embedding
   * of this business" is not retrieval — it is inspection, and the six engines
   * above already answer everything a retrieval could want about a known id.
   */
  protected async runLookup(ids: readonly EntityId[], query: RetrievalQuery): Promise<EngineRun> {
    void ids;
    void query;
    return { outcome: refuseUnavailableFeature(SEMANTIC_FEATURE_KEY, this.clock.now()) };
  }

  /**
   * The adapter a future provider would use, written now and unreachable
   * today.
   *
   * It exists so the shape of a semantic item is decided *here*, under review,
   * rather than inside whichever adapter ships first: `semanticScore` is the
   * only component it may set, the reason code is `semantic_similarity`, and
   * the item carries the backend it came from. A provider that wanted to write
   * a `graphScore` would have to change this file, which is the tripwire.
   */
  toItem(match: SemanticMatch, backend: string, now: string): RetrievalItem {
    return buildItem({
      kind: SEMANTIC_KIND_TO_ITEM_KIND[match.kind],
      entityId: match.entityId,
      engineId: this.id,
      retrievalSource: this.retrievalSource,
      score: buildScore(match.score, ["semantic_similarity"], { semanticScore: match.score }),
      payload: payloadOf([
        fact("semantic.backend", backend),
        fact("semantic.kind", match.kind),
        fact("semantic.score", match.score)
      ]),
      confidence: match.score,
      generatedAt: now,
      now,
      ttlSeconds: RETRIEVAL_TTL.semantic
    });
  }
}
