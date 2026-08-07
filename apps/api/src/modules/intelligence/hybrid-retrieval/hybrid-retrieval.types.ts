/**
 * Layer 4.5 (Hybrid Retrieval) — the vocabulary of retrieval.
 *
 * Epic 07's mission in one sentence: given a **structured** intent, gather
 * everything the platform already knows before anyone reasons about it. This
 * file fixes the shapes that flow through that gathering — the query, the
 * item, the score, the package — and it does so with two hard rules visible
 * in the types themselves:
 *
 * 1. **No natural language anywhere.** `RetrievalQuery` has no `utterance`,
 *    no `text`, no `prompt`. The reasoning layer hands retrieval structured
 *    intent; turning words into structure is Layer 5's job and turning
 *    structure into words is Layer 6's. A retrieval layer that accepted a
 *    sentence would immediately become the place someone puts an LLM.
 * 2. **No prose comes back.** A `RetrievalItem` carries keyed facts and
 *    entity references — there is no free-text field to write a sentence
 *    into. "Retrieval returns structured data only, never prose" (ADR-006)
 *    is therefore a property of the type, not a convention.
 *
 * Imports `core` and lower layers only.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  GeoPoint,
  InferenceBudget,
  IntelligenceFailure,
  IntelligenceLocale,
  IsoDateTime,
  NonEmptyArray,
  ReasoningSessionId,
  TimeWindow
} from "../core";
import type { RetrievalSource } from "../memory-engine";

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

/**
 * The seven engines, as a closed union.
 *
 * Closed rather than an open registry (unlike `RelationshipKindRegistry` or
 * `IntentRegistry`) because every engine must be *placed* in the retrieval
 * order and mapped to a context-window section, and both of those are
 * exhaustive typed records here. An eighth engine is a deliberate edit to
 * three tables, which is the review tripwire we want.
 */
export type RetrievalEngineId =
  | "workspace"
  | "memory"
  | "feature_store"
  | "knowledge_graph"
  | "business"
  | "marketplace"
  | "semantic";

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/**
 * What a retrieved item *is*. Twelve kinds, one per section of the Context
 * Package the epic specifies — the mapping is total (`CONTEXT_PACKAGE_SECTION`
 * in `context-package.ts`), so a kind added without a home does not compile.
 */
export type RetrievalItemKind =
  | "business"
  | "service"
  | "experience"
  | "workspace"
  | "preference"
  | "mission"
  | "knowledge_node"
  | "feature"
  | "related_customer"
  | "campaign"
  | "availability"
  | "alternative";

/** The only value shapes a retrieved fact may carry. Scalars, never sentences. */
export type RetrievalScalar = string | number | boolean | null;

/**
 * One keyed fact about a retrieved entity.
 *
 * `key` is a stable dotted key (`health.overall`, `capability.parking`), never
 * a label to render. Renderers map keys to locale strings at Layer 6; nothing
 * here is written in a language.
 */
export interface RetrievalFact {
  readonly key: string;
  readonly value: RetrievalScalar | readonly RetrievalScalar[];
}

/** The structured body of a retrieved item: keyed facts plus graph references. */
export interface RetrievalPayload {
  readonly facts: readonly RetrievalFact[];
  /** Ids this item points at (services offered, companions, alternatives). */
  readonly relatedEntityIds: readonly EntityId[];
}

/**
 * How much of an entity has been loaded.
 *
 * Lazy hydration (doc 22's "minimal load → expand on demand"): retrieval
 * fetches a summary for everything and expands only what survives ranking,
 * because hydrating 200 candidates to load 5 is how a retrieval layer becomes
 * the slowest thing in the request.
 */
export type HydrationLevel =
  | "summary"
  | "services"
  | "reviews"
  | "campaigns"
  | "media"
  | "analytics";

/**
 * The expansion order, as a tuple: position is the contract. Level *n* implies
 * every level before it — asking for `reviews` gets you `summary` and
 * `services` too.
 */
export const HYDRATION_LEVELS = [
  "summary",
  "services",
  "reviews",
  "campaigns",
  "media",
  "analytics"
] as const satisfies readonly HydrationLevel[];

/** Depth of one hydration level in `HYDRATION_LEVELS`; lower = cheaper. */
export function hydrationDepth(level: HydrationLevel): number {
  return HYDRATION_LEVELS.indexOf(level);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Why an item is in the result. A closed union, mirroring the discipline of
 * `ReasonCode` in the (Layer 5) explanation engine without importing it —
 * Layer 4.5 may not reach up. The two vocabularies are deliberately
 * different: an explanation reason answers "why should you go here?", a
 * retrieval reason answers "why did this come back at all?".
 */
export type RetrievalReasonCode =
  | "graph_match"
  | "graph_neighbour"
  | "memory_match"
  | "preference_match"
  | "mission_match"
  | "workspace_match"
  | "feature_match"
  | "marketplace_signal"
  | "business_knowledge"
  | "within_distance"
  | "available_in_window"
  | "fresh_knowledge"
  | "stale_knowledge"
  | "trusted_provider"
  | "substitute_candidate"
  | "semantic_similarity"
  | "priority_source"
  | "filter_undecidable"
  | "sole_candidate";

/**
 * The per-entity score breakdown the epic mandates.
 *
 * Every component but `retrievalScore` and `overallScore` is nullable, and
 * that nullability is the whole point: a signal nobody could compute must not
 * be indistinguishable from a signal computed as zero. `semanticScore` is
 * `null` on every item this module can produce today, because there is no
 * embedding pipeline — and saying so is more useful than a zero.
 */
export interface RetrievalScore {
  /** The producing engine's own relevance, in [0, 1]. Always present. */
  readonly retrievalScore: number;
  /** Vector similarity. `null` until a semantic provider is bound — always, today. */
  readonly semanticScore: number | null;
  readonly graphScore: number | null;
  readonly memoryScore: number | null;
  readonly featureScore: number | null;
  readonly distanceScore: number | null;
  readonly availabilityScore: number | null;
  readonly freshnessScore: number | null;
  readonly businessTrustScore: number | null;
  /** Weighted mean over the components that exist, in [0, 1]. */
  readonly overallScore: number;
  readonly reasonCodes: NonEmptyArray<RetrievalReasonCode>;
}

// ---------------------------------------------------------------------------
// Cache + freshness
// ---------------------------------------------------------------------------

/** Which tier served a result — reported on every result, per the epic. */
export type CacheStatus = "hit_l1" | "hit_l2" | "hit_l3" | "miss" | "bypass" | "uncacheable";

/** How old a piece of retrieved knowledge is, and whether that is too old. */
export interface FreshnessDescriptor {
  readonly generatedAt: IsoDateTime;
  readonly ageSeconds: number;
  /** True when age exceeded the source's declared TTL. */
  readonly stale: boolean;
  /** `null` when the source declares no TTL (structural facts do not rot). */
  readonly ttlSeconds: number | null;
}

// ---------------------------------------------------------------------------
// The item
// ---------------------------------------------------------------------------

/**
 * One retrieved thing.
 *
 * `retrievalItemId` is the dedupe identity (`kind:entityId`) and is derived,
 * never assigned: two engines that find the same business must collide, or
 * merge cannot happen.
 */
export interface RetrievalItem {
  readonly retrievalItemId: string;
  readonly entityId: EntityId;
  readonly kind: RetrievalItemKind;
  /** The engine whose priority this item ranks under after any merge. */
  readonly engineId: RetrievalEngineId;
  /** Every engine that returned this entity, in merge order. */
  readonly contributingEngineIds: readonly RetrievalEngineId[];
  /** The frozen retrieval source this item speaks for; `null` where the Bible names none. */
  readonly retrievalSource: RetrievalSource | null;
  readonly hydration: HydrationLevel;
  readonly score: RetrievalScore;
  readonly payload: RetrievalPayload;
  readonly confidence: Confidence;
  readonly cacheStatus: CacheStatus;
  readonly freshness: FreshnessDescriptor;
}

/**
 * Why one item is in the package, as structured data.
 *
 * `explain()` returns this — never a sentence. The epic's rule and ADR-006's
 * last principle are the same rule: retrieval hands Layer 5 the material for
 * an explanation and refuses to write one.
 */
export interface RetrievalExplanation {
  readonly retrievalItemId: string;
  readonly engineId: RetrievalEngineId;
  readonly retrievalSource: RetrievalSource | null;
  /** Rank of the source under the binding order; `null` where unranked. */
  readonly sourceRank: number | null;
  readonly reasonCodes: NonEmptyArray<RetrievalReasonCode>;
  /** The score components that were actually available, keyed. */
  readonly contributingSignals: readonly RetrievalFact[];
  readonly overallScore: number;
  readonly cacheStatus: CacheStatus;
  readonly freshness: FreshnessDescriptor;
}

// ---------------------------------------------------------------------------
// The query
// ---------------------------------------------------------------------------

/**
 * Who is asking. Drives the internal-only filters (ADR-001: the AI is
 * least-privilege, and so is anything acting for it).
 */
export type RetrievalAudience = "customer" | "business_owner" | "internal";

/**
 * The structured intent retrieval accepts.
 *
 * `kind` is a plain string on purpose: intents come from the Layer 5 intent
 * registry (patch B), and a Layer 4.5 module that enumerated them would fork
 * the registry. Retrieval never branches on the *value*; it reads the
 * structured fields.
 */
export interface RetrievalIntent {
  readonly kind: string;
  readonly experienceType: ExperienceType | null;
  /** Entities already named by the intent ("replace THIS restaurant"). */
  readonly subjectEntityIds: readonly EntityId[];
  readonly serviceIds: readonly EntityId[];
  readonly categoryIds: readonly EntityId[];
  readonly neighborhoodId: EntityId | null;
  /** Where the mission is anchored, for distance scoring. */
  readonly anchor: GeoPoint | null;
  readonly window: TimeWindow | null;
  readonly budget: BudgetRange | null;
  readonly partySize: number | null;
  readonly requiredCapabilityKeys: readonly string[];
  readonly locale: IntelligenceLocale | null;
}

/** Caps on one retrieval, so a pathological query cannot walk the marketplace. */
export interface RetrievalLimits {
  /** Items one engine may return before it truncates (and says so). */
  readonly perEngine: number;
  /** Items the merged package may carry. */
  readonly total: number;
  /** How deep to hydrate the items that survive ranking. */
  readonly hydrateTo: HydrationLevel;
}

/** The default caps: generous enough to rank, small enough to stay interactive. */
export const DEFAULT_RETRIEVAL_LIMITS: RetrievalLimits = {
  perEngine: 50,
  total: 120,
  hydrateTo: "summary"
};

/**
 * One retrieval request.
 *
 * Carries an `InferenceBudget` (patch F) like every other intelligence
 * request, because retrieval has a bill too — engines are skipped and limits
 * tightened when the priority is `interactive`.
 */
export interface RetrievalQuery {
  readonly retrievalId: EntityId;
  readonly queryId: EntityId;
  readonly customerId: EntityId | null;
  readonly workspaceId: EntityId | null;
  readonly reasoningSessionId: ReasoningSessionId | null;
  readonly audience: RetrievalAudience;
  readonly intent: RetrievalIntent;
  readonly filters: readonly RetrievalFilter[];
  readonly limits: RetrievalLimits;
  readonly budget: InferenceBudget;
  readonly requestedAt: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Filters (declared here to keep RetrievalQuery total; semantics in
// retrieval-filters.ts)
// ---------------------------------------------------------------------------

/**
 * The fourteen filter dimensions the epic names. Data, never hardcoded `if`s
 * in an engine: a filter set is part of a query, and adding a dimension is a
 * union member plus a predicate, not an edit to seven engines.
 */
export type RetrievalFilterKind =
  | "distance"
  | "budget"
  | "availability"
  | "status"
  | "category"
  | "workspace"
  | "time"
  | "language"
  | "accessibility"
  | "family_friendly"
  | "pet_friendly"
  | "open_now"
  | "verified_only"
  | "premium_only";

/**
 * How strictly a filter binds.
 *
 * `hard` removes non-matching items; `soft` leaves them in and lowers their
 * score. Both are needed: "within 3km" is usually a preference, "verified
 * only" never is.
 */
export type RetrievalFilterMode = "hard" | "soft";

/** One configured filter: a dimension, its parameters, and how hard it binds. */
export type RetrievalFilter =
  | { readonly kind: "distance"; readonly mode: RetrievalFilterMode; readonly maxKm: number }
  | { readonly kind: "budget"; readonly mode: RetrievalFilterMode; readonly range: BudgetRange }
  | { readonly kind: "availability"; readonly mode: RetrievalFilterMode; readonly window: TimeWindow }
  | {
      readonly kind: "status";
      readonly mode: RetrievalFilterMode;
      /** Acceptable lifecycle states (`active`, `published`). */
      readonly allowed: readonly string[];
    }
  | {
      readonly kind: "category";
      readonly mode: RetrievalFilterMode;
      readonly categoryIds: readonly EntityId[];
    }
  | { readonly kind: "workspace"; readonly mode: RetrievalFilterMode; readonly workspaceId: EntityId }
  | { readonly kind: "time"; readonly mode: RetrievalFilterMode; readonly window: TimeWindow }
  | {
      readonly kind: "language";
      readonly mode: RetrievalFilterMode;
      readonly locales: readonly IntelligenceLocale[];
    }
  | {
      readonly kind: "accessibility";
      readonly mode: RetrievalFilterMode;
      readonly capabilityKeys: readonly string[];
    }
  | { readonly kind: "family_friendly"; readonly mode: RetrievalFilterMode }
  | { readonly kind: "pet_friendly"; readonly mode: RetrievalFilterMode }
  | { readonly kind: "open_now"; readonly mode: RetrievalFilterMode; readonly at: IsoDateTime }
  | { readonly kind: "verified_only"; readonly mode: RetrievalFilterMode }
  | { readonly kind: "premium_only"; readonly mode: RetrievalFilterMode };

// ---------------------------------------------------------------------------
// Outcomes, warnings, diagnostics
// ---------------------------------------------------------------------------

/**
 * What an engine returns: items with the confidence they carry, or a typed
 * reason there are none.
 *
 * Epic 06 named its equivalent `IntelligenceOutcome` with `status: "computed"`
 * — a *model* either computes or refuses. Retrieval either retrieves or
 * refuses, which is a different verb about a different act, so it gets its own
 * name rather than a second meaning bolted onto the first (domain-language
 * rule: one canonical term per concept).
 */
export type RetrievalOutcome<TValue> =
  | {
      readonly status: "retrieved";
      readonly value: TValue;
      readonly confidence: Confidence;
    }
  | {
      readonly status: "insufficient_data";
      readonly failure: IntelligenceFailure;
    };

/** A non-fatal problem that changed the shape of the answer. */
export interface RetrievalWarning {
  readonly engineId: RetrievalEngineId | null;
  /** The typed cause, so warnings aggregate by reason rather than by prose. */
  readonly failure: IntelligenceFailure;
  /** Stable key naming what was affected (`filter:distance`, `limit:per_engine`). */
  readonly scopeKey: string;
}

/** One engine that did not deliver, and why. */
export interface RetrievalEngineFailure {
  readonly engineId: RetrievalEngineId;
  readonly failure: IntelligenceFailure;
  readonly executionMs: number;
}

/**
 * The observability record of one retrieval, field-for-field as the epic
 * specifies. Emitted to the `MetricsSink` and carried on the package, because
 * a retrieval nobody can account for is a retrieval nobody can tune.
 */
export interface RetrievalDiagnostics {
  readonly retrievalId: EntityId;
  readonly queryId: EntityId;
  readonly workspaceId: EntityId | null;
  readonly customerId: EntityId | null;
  readonly enginesUsed: readonly RetrievalEngineId[];
  readonly enginesSkipped: readonly RetrievalEngineId[];
  readonly executionMs: number;
  readonly entitiesRetrieved: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly rankingMs: number;
  readonly hydrationMs: number;
}

/**
 * The answer: ranked structured knowledge plus everything needed to audit how
 * it was assembled.
 */
export interface RetrievalPackage {
  readonly retrievalId: EntityId;
  readonly queryId: EntityId;
  readonly customerId: EntityId | null;
  readonly workspaceId: EntityId | null;
  /** Merged, deduped, ranked — best first, under the binding source order. */
  readonly items: readonly RetrievalItem[];
  readonly diagnostics: RetrievalDiagnostics;
  readonly warnings: readonly RetrievalWarning[];
  /** True when at least one engine failed or was skipped for a non-plan reason. */
  readonly partialResults: boolean;
  readonly failedEngines: readonly RetrievalEngineFailure[];
  readonly generatedAt: IsoDateTime;
  readonly cacheStatus: CacheStatus;
}
