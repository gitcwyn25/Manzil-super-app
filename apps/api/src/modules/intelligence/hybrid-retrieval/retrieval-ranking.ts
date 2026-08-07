/**
 * Layer 4.5 (Hybrid Retrieval) — merge, dedupe, and the binding order.
 *
 * Seven engines answer in parallel and several of them will return the same
 * business. This file turns those overlapping lists into one ordered list, and
 * it does so under a rule that is not a heuristic:
 *
 * ```text
 *   sort by  (1) retrieval-source rank   ascending   ← ADR-006, binding
 *            (2) overall score           descending
 *            (3) confidence              descending
 *            (4) entity id               ascending   ← determinism
 * ```
 *
 * The first key is the whole architecture. "Structured knowledge outranks
 * semantic similarity", "memory outranks embeddings", and "workspace context
 * outranks generic recommendations" are three statements about *sources*, and
 * a single blended score cannot express them — a sufficiently high similarity
 * would always be able to outrank the user's own plan, which is exactly the
 * failure mode ADR-006 exists to prevent. Lexicographic ordering makes the
 * precedence structural: an item from a lower-priority source cannot overtake
 * one from a higher-priority source at any score.
 *
 * Within a band the score decides, which is where all the tuning lives and
 * where it belongs.
 *
 * The fourth key is not decoration. Two items can tie on the first three (two
 * graph hits with identical evidence), and a retrieval whose output depends on
 * `Promise.all` completion order is a retrieval nobody can debug, cache-key,
 * or snapshot.
 *
 * Imports `core` and lower layers only — no engine, no service, no clock.
 */
import type { EntityId } from "../core";
import { mergeScores } from "./retrieval-scoring";
import {
  engineRank,
  frozenSourceRank,
  retrievalSourceRank,
  UNRANKED_SOURCE_RANK
} from "./retrieval-priority";
import type { RetrievalEngineId, RetrievalItem } from "./hybrid-retrieval.types";

/**
 * How far below its engine's band an item sorts when the Bible names no source
 * for the item itself.
 *
 * Half a rank: after everything its engine speaks for, before the next source.
 * Relationship memory is the live case — Epic 05 reported for the v1.4
 * amendment that `relationship_context` "ranks between `mission_context` and
 * `preference_context`", and half a step below the memory engine's own rank of
 * 1 is exactly that position, derived rather than typed in a second place.
 */
export const UNNAMED_SOURCE_OFFSET = 0.5;

/**
 * The rank an item sorts under.
 *
 * Three cases, in order: the item's own source when the Bible names one, half a
 * step below its engine's source when it does not, and the amendment rank when
 * neither has one.
 *
 * The memory engine is why this reads the *item* first: it emits mission
 * knowledge (rank 1) and preference knowledge (rank 2) from one engine, and
 * collapsing them to a single engine rank would lose the distinction the AI
 * Bible cares most about — today's objective is not a durable taste.
 */
export function itemPriorityRank(item: RetrievalItem): number {
  const fromSource = retrievalSourceRank(item.retrievalSource);
  if (fromSource !== null) return fromSource;

  const fromEngine = frozenSourceRank(item.engineId);
  if (fromEngine !== null) return fromEngine + UNNAMED_SOURCE_OFFSET;

  // Unranked engines sit between business knowledge and the model's own
  // knowledge; the engine's own position breaks ties among them.
  return UNRANKED_SOURCE_RANK + engineRank(item.engineId) / 1000;
}

/**
 * The total order. Exported so tests and `explain()` can state the contract
 * rather than re-derive it.
 */
export function compareRetrievalItems(left: RetrievalItem, right: RetrievalItem): number {
  return (
    itemPriorityRank(left) - itemPriorityRank(right) ||
    right.score.overallScore - left.score.overallScore ||
    right.confidence - left.confidence ||
    left.entityId.localeCompare(right.entityId)
  );
}

/** The items in the order the contract says to present them. */
export function rankItems(items: readonly RetrievalItem[]): readonly RetrievalItem[] {
  return [...items].sort(compareRetrievalItems);
}

/**
 * Which of two views of the same entity owns it after a merge.
 *
 * The higher-priority source wins — the same rule as the sort, applied to a
 * pair. Deliberately *not* "whichever scored higher": if a marketplace-wide
 * signal could take ownership of an entity the workspace also returned, the
 * merged item would rank under the marketplace's priority and the user's own
 * plan would have been demoted by an aggregate.
 */
export function ownerOf(left: RetrievalItem, right: RetrievalItem): RetrievalItem {
  const byPriority = itemPriorityRank(left) - itemPriorityRank(right);
  if (byPriority !== 0) return byPriority < 0 ? left : right;

  // Same priority band — two engines that both speak for `business_knowledge`,
  // say. The earlier engine in `ENGINE_RETRIEVAL_ORDER` owns it, then the
  // better-scored one. Both tie-breaks are needed for `dedupeItems` to be
  // independent of `Promise.all` completion order, which it must be.
  const byEngine = engineRank(left.engineId) - engineRank(right.engineId);
  if (byEngine !== 0) return byEngine < 0 ? left : right;

  return right.score.overallScore > left.score.overallScore ? right : left;
}

/**
 * Merges two views of one entity into one item.
 *
 * The owner keeps identity, source, engine, and hydration depth; the other
 * contributes score components the owner could not measure, facts the owner
 * does not have, and its engine id. Facts collide by key and the owner wins —
 * knowledge from a more-trusted source is not overwritten by a less-trusted
 * one, which is Epic 05's conflict rule applied to a different pair of things.
 */
export function mergeItems(left: RetrievalItem, right: RetrievalItem): RetrievalItem {
  const owner = ownerOf(left, right);
  const other = owner === left ? right : left;

  const factKeys = new Set(owner.payload.facts.map((entry) => entry.key));
  const mergedFacts = [
    ...owner.payload.facts,
    ...other.payload.facts.filter((entry) => !factKeys.has(entry.key))
  ].sort((a, b) => a.key.localeCompare(b.key));

  const contributing = [...new Set([...owner.contributingEngineIds, ...other.contributingEngineIds])];

  return {
    ...owner,
    contributingEngineIds: contributing,
    // The deeper hydration survives: having loaded services once, forgetting
    // them because the other view was shallower would mean loading them twice.
    hydration: deeperHydration(owner, other),
    score: mergeScores(owner.score, other.score),
    payload: {
      facts: mergedFacts,
      relatedEntityIds: [
        ...new Set([...owner.payload.relatedEntityIds, ...other.payload.relatedEntityIds])
      ].sort()
    },
    confidence: Math.max(owner.confidence, other.confidence),
    // The *worse* cache status is reported: a package assembled from one live
    // read and one cache hit was not served from cache.
    cacheStatus: owner.cacheStatus === "miss" || other.cacheStatus === "miss" ? "miss" : owner.cacheStatus,
    // The *older* knowledge governs freshness, for the same reason.
    freshness: owner.freshness.ageSeconds >= other.freshness.ageSeconds ? owner.freshness : other.freshness
  };
}

function deeperHydration(left: RetrievalItem, right: RetrievalItem): RetrievalItem["hydration"] {
  const order: readonly RetrievalItem["hydration"][] = [
    "summary",
    "services",
    "reviews",
    "campaigns",
    "media",
    "analytics"
  ];
  return order.indexOf(left.hydration) >= order.indexOf(right.hydration) ? left.hydration : right.hydration;
}

/**
 * Deduplicates by `retrievalItemId`, merging collisions.
 *
 * Insertion order of the *first* sighting is irrelevant to the result: merge
 * is priority-driven, so the same set of items produces the same merged item
 * whichever engine happened to answer first. `dedupeItems` is therefore safe
 * to run over the output of a `Promise.all` whose completion order varies —
 * which it does.
 */
export function dedupeItems(items: readonly RetrievalItem[]): readonly RetrievalItem[] {
  const byId = new Map<string, RetrievalItem>();

  for (const item of items) {
    const existing = byId.get(item.retrievalItemId);
    byId.set(item.retrievalItemId, existing ? mergeItems(existing, item) : item);
  }

  return [...byId.values()];
}

/** How many entities two engines both returned — reported in diagnostics. */
export function duplicateCount(items: readonly RetrievalItem[]): number {
  return items.length - new Set(items.map((item) => item.retrievalItemId)).size;
}

/** The full merge: dedupe, then rank, then cap. One call, in contract order. */
export function mergeAndRank(
  items: readonly RetrievalItem[],
  limit: number
): readonly RetrievalItem[] {
  const ranked = rankItems(dedupeItems(items));
  return limit > 0 ? ranked.slice(0, limit) : ranked;
}

/** Engines that contributed at least one item to a merged list. */
export function contributingEngines(
  items: readonly RetrievalItem[]
): readonly RetrievalEngineId[] {
  const engines = new Set<RetrievalEngineId>();
  for (const item of items) {
    for (const engineId of item.contributingEngineIds) engines.add(engineId);
  }
  return [...engines];
}

/** Entity ids in the merged list, deduplicated — the package's reach. */
export function entityIdsOf(items: readonly RetrievalItem[]): readonly EntityId[] {
  return [...new Set(items.map((item) => item.entityId))];
}
