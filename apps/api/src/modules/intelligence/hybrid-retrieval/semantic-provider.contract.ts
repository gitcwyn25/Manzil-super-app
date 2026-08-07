/**
 * Layer 4.5 (Hybrid Retrieval) — the semantic provider contract. **No
 * implementation, deliberately.**
 *
 * Epic 07's hardest scope boundary is this file. "RAG 2.0" is not "vector
 * search plus a model"; the retrieval this platform needs is over structured
 * knowledge it owns, and ADR-006 states the consequence: *vector search is
 * optional, never mandatory*. A capability that is optional must be provably
 * absent-able — so the seventh engine ships as a contract with a null binding
 * and answers `feature_unavailable`, every time, honestly.
 *
 * What this file therefore is: one interface that **pgvector, Pinecone,
 * Qdrant, Weaviate, Milvus, and OpenSearch could each satisfy**, sized to
 * their common denominator (upsert · query-by-vector · filter · delete ·
 * describe) and to nothing beyond it. What it is not, and must never become:
 *
 * - **an embedding pipeline.** `SemanticQueryRequest.vector` is an input.
 *   Something outside this module computes it, from a model this module knows
 *   nothing about. There is no `embed()` here and adding one would put a model
 *   inside the retrieval layer, which is the exact inversion ADR-005 was
 *   written to prevent.
 * - **a default.** Nothing binds `HYBRID_RETRIEVAL_SEMANTIC_PROVIDER`. The
 *   engine injects it `@Optional()` and reports the truth.
 *
 * When a provider does arrive it binds this token, the engine starts
 * returning items, they rank *last* under `ENGINE_RETRIEVAL_ORDER`, and not
 * one line of the pipeline changes. That is the test of whether this contract
 * was drawn in the right place.
 */
import type { Confidence, EntityId, IsoDateTime } from "../core";

/** The stores this contract was sized against. */
export type SemanticBackend =
  | "pgvector"
  | "pinecone"
  | "qdrant"
  | "weaviate"
  | "milvus"
  | "opensearch";

/** The distance metrics all six support. */
export type SemanticDistanceMetric = "cosine" | "dot_product" | "euclidean";

/** What a stored vector is *about* — the retrievable kinds, not free-form. */
export type SemanticRecordKind = "business" | "service" | "experience" | "review" | "story";

/** The static description of a bound provider, for health output and planning. */
export interface SemanticProviderDescriptor {
  readonly backend: SemanticBackend;
  /** Vector width the index was built with; a mismatch is a fatal config error. */
  readonly dimensions: number;
  readonly metric: SemanticDistanceMetric;
  /** The index/collection/namespace name, whichever the backend calls it. */
  readonly indexName: string;
  /** True when the backend supports server-side metadata filtering. */
  readonly supportsFilters: boolean;
}

/** Whether the provider can serve right now, and what it holds. */
export interface SemanticProviderAvailability {
  readonly available: boolean;
  /** Vectors currently indexed; `null` when the backend will not say cheaply. */
  readonly vectorCount: number | null;
  /** Stable key naming why it cannot serve; `null` when available. */
  readonly unavailableReason: string | null;
}

/**
 * One stored vector with the metadata needed to turn a hit back into a
 * platform entity. Metadata values are scalars: a vector store is not a place
 * to keep documents, and this platform's documents are its own tables.
 */
export interface SemanticRecord {
  readonly entityId: EntityId;
  readonly kind: SemanticRecordKind;
  readonly vector: readonly number[];
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
  readonly indexedAt: IsoDateTime;
}

/**
 * A similarity query.
 *
 * `vector` is required and supplied by the caller — see the file comment. The
 * scalar filters mirror what all six backends can push down; anything richer
 * is applied by this platform's own filter pipeline after the fact, which is
 * where it belongs anyway.
 */
export interface SemanticQueryRequest {
  readonly vector: readonly number[];
  readonly kinds: readonly SemanticRecordKind[];
  readonly topK: number;
  /** Minimum similarity to return, in [0, 1]; below it, a hit is noise. */
  readonly minScore: Confidence;
  readonly metadataFilters: Readonly<Record<string, string | number | boolean>>;
}

/** One neighbour, as every one of the six backends returns it. */
export interface SemanticMatch {
  readonly entityId: EntityId;
  readonly kind: SemanticRecordKind;
  /** Similarity normalized to [0, 1] by the adapter, not by the caller. */
  readonly score: Confidence;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

/** The result of one similarity query. */
export interface SemanticQueryResult {
  readonly matches: readonly SemanticMatch[];
  readonly queriedAt: IsoDateTime;
  /** True when the backend truncated below `topK` for its own reasons. */
  readonly truncated: boolean;
}

/** The result of one upsert batch. */
export interface SemanticUpsertResult {
  readonly upserted: number;
  readonly at: IsoDateTime;
}

/**
 * The provider seam. Six backends, one interface, zero implementations in this
 * repository.
 *
 * Everything is async including `describe`, because two of the six can only
 * answer it over the network.
 */
export interface SemanticRetrievalProvider {
  describe(): Promise<SemanticProviderDescriptor>;
  availability(): Promise<SemanticProviderAvailability>;
  query(request: SemanticQueryRequest): Promise<SemanticQueryResult>;
  upsert(records: readonly SemanticRecord[]): Promise<SemanticUpsertResult>;
  remove(entityIds: readonly EntityId[]): Promise<number>;
}

/** The `featureKey` the semantic engine reports when nothing is bound. */
export const SEMANTIC_FEATURE_KEY = "retrieval.semantic.vector_index";

/**
 * The backends this contract was checked against, as data.
 *
 * Kept so the claim in ADR-006 — "one interface six stores could satisfy" — is
 * inspectable rather than a sentence in a document, and so that adding a
 * seventh backend is a visible edit.
 */
export const SEMANTIC_BACKENDS = [
  "pgvector",
  "pinecone",
  "qdrant",
  "weaviate",
  "milvus",
  "opensearch"
] as const satisfies readonly SemanticBackend[];
