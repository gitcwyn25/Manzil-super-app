/**
 * Layer 4.5 (Hybrid Retrieval) — item identity, construction, and freshness.
 *
 * Three small decisions live here, and each one is load-bearing for the
 * pipeline above:
 *
 * - **Identity is derived, never assigned.** `retrievalItemId` is
 *   `kind:entityId`. Two engines that find the same business *must* collide,
 *   or the merge step has nothing to merge and the package carries the same
 *   provider twice under two scores. Letting engines mint their own ids would
 *   make deduplication a heuristic instead of a fact.
 * - **Freshness is computed against a declared TTL, not guessed.** Every
 *   source states how long its knowledge stays true (`RETRIEVAL_TTL`), and a
 *   source that legitimately does not rot declares `null` rather than a large
 *   number — those are different statements and ranking treats them
 *   differently.
 * - **Facts are keyed and sorted.** A payload whose key order depends on which
 *   branch ran is a payload nobody can snapshot-test or cache-key.
 *
 * Imports `core` only.
 */
import type { Confidence, EntityId, IsoDateTime } from "../core";
import type {
  CacheStatus,
  FreshnessDescriptor,
  HydrationLevel,
  RetrievalEngineId,
  RetrievalFact,
  RetrievalItem,
  RetrievalItemKind,
  RetrievalPayload,
  RetrievalScalar,
  RetrievalScore
} from "./hybrid-retrieval.types";
import type { RetrievalSource } from "../memory-engine";

/** Separator of the composite item id. Chosen to match the platform's slot keys. */
export const RETRIEVAL_ID_SEPARATOR = ":";

/** The dedupe identity of one retrieved entity. */
export function retrievalItemId(kind: RetrievalItemKind, entityId: EntityId): string {
  return `${kind}${RETRIEVAL_ID_SEPARATOR}${entityId}`;
}

/** The `(kind, entityId)` pair behind an item id, or null when malformed. */
export function parseRetrievalItemId(
  itemId: string
): { readonly kind: string; readonly entityId: EntityId } | null {
  const index = itemId.indexOf(RETRIEVAL_ID_SEPARATOR);
  if (index <= 0 || index === itemId.length - 1) return null;

  return { kind: itemId.slice(0, index), entityId: itemId.slice(index + 1) };
}

/**
 * How long each engine's knowledge stays true, in seconds.
 *
 * Declared per engine rather than per item because the answer is a property of
 * the *source*, not of the row: a stored summary is refreshed nightly whatever
 * it says, and a mission context expires when the mission does.
 *
 * `knowledge_graph` is `null` on purpose — a projected edge is a restatement of
 * a row that either exists or does not, so it has no age at which it becomes
 * wrong. Giving it a TTL would invent staleness and then rank on it.
 */
export const RETRIEVAL_TTL = {
  workspace: 300,
  memory: 900,
  feature_store: 86_400,
  knowledge_graph: null,
  business: 86_400,
  marketplace: 86_400,
  semantic: null
} as const satisfies Readonly<Record<RetrievalEngineId, number | null>>;

/** Freshness of one piece of knowledge, measured against its source's TTL. */
export function freshnessOf(
  generatedAt: IsoDateTime,
  now: IsoDateTime,
  ttlSeconds: number | null
): FreshnessDescriptor {
  const generated = Date.parse(generatedAt);
  const at = Date.parse(now);
  const ageSeconds =
    Number.isNaN(generated) || Number.isNaN(at) ? 0 : Math.max(0, (at - generated) / 1000);

  return {
    generatedAt,
    ageSeconds: Math.round(ageSeconds),
    stale: ttlSeconds !== null && ageSeconds > ttlSeconds,
    ttlSeconds
  };
}

/** A keyed fact, dropping values nothing knows — an absent key beats a null one. */
export function fact(
  key: string,
  value: RetrievalScalar | readonly RetrievalScalar[] | undefined
): RetrievalFact | null {
  if (value === undefined) return null;
  return { key, value };
}

/**
 * A payload from a sparse fact list.
 *
 * Nulls are dropped and keys sorted: the payload of an item must depend on
 * what is known about it, never on the order the knowing happened.
 */
export function payloadOf(
  facts: readonly (RetrievalFact | null)[],
  relatedEntityIds: readonly EntityId[] = []
): RetrievalPayload {
  const present = facts.filter((entry): entry is RetrievalFact => entry !== null);

  return {
    facts: [...present].sort((left, right) => left.key.localeCompare(right.key)),
    relatedEntityIds: [...new Set(relatedEntityIds)].sort()
  };
}

/** Everything needed to build one item; the engines' single construction path. */
export interface RetrievalItemInput {
  readonly kind: RetrievalItemKind;
  readonly entityId: EntityId;
  readonly engineId: RetrievalEngineId;
  readonly retrievalSource: RetrievalSource | null;
  readonly score: RetrievalScore;
  readonly payload: RetrievalPayload;
  readonly confidence: Confidence;
  readonly hydration?: HydrationLevel;
  readonly cacheStatus?: CacheStatus;
  readonly generatedAt: IsoDateTime;
  readonly now: IsoDateTime;
  readonly ttlSeconds: number | null;
}

/** One retrieval item, with its identity and freshness derived. */
export function buildItem(input: RetrievalItemInput): RetrievalItem {
  return {
    retrievalItemId: retrievalItemId(input.kind, input.entityId),
    entityId: input.entityId,
    kind: input.kind,
    engineId: input.engineId,
    contributingEngineIds: [input.engineId],
    retrievalSource: input.retrievalSource,
    hydration: input.hydration ?? "summary",
    score: input.score,
    payload: input.payload,
    confidence: input.confidence,
    cacheStatus: input.cacheStatus ?? "miss",
    freshness: freshnessOf(input.generatedAt, input.now, input.ttlSeconds)
  };
}

/** The value of one fact key, or null. Used by filters and hydration. */
export function factValue(
  item: RetrievalItem,
  key: string
): RetrievalScalar | readonly RetrievalScalar[] | null {
  const found = item.payload.facts.find((entry) => entry.key === key);
  return found ? found.value : null;
}

/** A numeric fact, or null when absent or not a number. */
export function numericFact(item: RetrievalItem, key: string): number | null {
  const value = factValue(item, key);
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** A boolean fact, or null when absent or not a boolean. */
export function booleanFact(item: RetrievalItem, key: string): boolean | null {
  const value = factValue(item, key);
  return typeof value === "boolean" ? value : null;
}

/** A string fact, or null when absent or not a string. */
export function stringFact(item: RetrievalItem, key: string): string | null {
  const value = factValue(item, key);
  return typeof value === "string" ? value : null;
}

/** A string-list fact, or an empty list. */
export function stringListFact(item: RetrievalItem, key: string): readonly string[] {
  const value = factValue(item, key);
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/**
 * The fact keys the filter pipeline reads.
 *
 * Declared in one place because a filter and the engine that produces the fact
 * it filters on are written months apart, and a typo in either is a filter
 * that silently never matches. The filter layer treats an absent key as
 * *undecidable*, never as "does not match" (see `retrieval-filters.ts`), so a
 * drifted key degrades to an honest warning rather than to a wrong answer.
 */
export const RETRIEVAL_FACT_KEYS = {
  distanceKm: "location.distanceKm",
  priceLevel: "price.level",
  priceMinorUnits: "price.amountMinor",
  currency: "price.currency",
  status: "lifecycle.status",
  categoryIds: "taxonomy.categoryIds",
  workspaceId: "workspace.id",
  capabilityKeys: "capability.keys",
  locales: "locale.supported",
  familyFriendly: "capability.familyFriendly",
  petFriendly: "capability.petFriendly",
  verified: "trust.verified",
  premium: "commercial.premium",
  openWindows: "availability.openWindows",
  availableInWindow: "availability.inWindow",
  availabilityWindowStart: "availability.windowStart",
  availabilityWindowEnd: "availability.windowEnd",
  trustScore: "trust.overall",
  popularity: "feature.popularity"
} as const;
