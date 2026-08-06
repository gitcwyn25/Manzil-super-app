/**
 * Layer 3 (Knowledge Graph) — graph identity.
 *
 * A graph id is `type:part[:part…]` with every part percent-encoded, e.g.
 * `business:clx123`, `neighborhood:Tashkent:Yunusobod%20tumani`.
 *
 * Why not raw Prisma ids: `KnowledgeGraphProvider.entity(id)` receives one
 * opaque id and must return the right node. With bare cuids that means
 * probing eight tables per lookup, and it leaves the graph unable to name
 * nodes no table owns — a neighborhood exists only as the `(city, district)`
 * pair repeated across business rows. Prefixing makes resolution a single
 * typed query, keeps edges self-describing when read in isolation, and makes
 * projected ids deterministic, which is what lets a rebuild converge.
 *
 * Encoding is reversible on purpose: `parseGraphId` recovers the exact
 * source values, so a neighborhood id round-trips back into the `{ city,
 * district }` filter that produced it.
 */
import type { EntityId } from "../core";
import type { GraphEntityType } from "./knowledge-graph.entity";

/** Separator between the type prefix and the parts. */
export const GRAPH_ID_SEPARATOR = ":";

/**
 * The fifteen node kinds as runtime data. `satisfies` makes this exhaustive:
 * a kind added to `GraphEntityType` without a key here does not compile.
 */
const GRAPH_ENTITY_TYPE_KEYS = {
  business: true,
  service: true,
  category: true,
  experience: true,
  workspace: true,
  customer: true,
  campaign: true,
  story: true,
  review: true,
  booking: true,
  location: true,
  neighborhood: true,
  event: true,
  organization: true,
  relationship: true
} as const satisfies Readonly<Record<GraphEntityType, true>>;

/** Every node kind the graph understands, in declaration order. */
export const GRAPH_ENTITY_TYPES = Object.keys(GRAPH_ENTITY_TYPE_KEYS) as readonly GraphEntityType[];

/** True when `value` names a node kind. */
export function isGraphEntityType(value: string): value is GraphEntityType {
  return Object.prototype.hasOwnProperty.call(GRAPH_ENTITY_TYPE_KEYS, value);
}

/** Builds a graph id from a node kind and one or more source key parts. */
export function graphId(type: GraphEntityType, ...parts: readonly string[]): EntityId {
  return [type, ...parts.map((part) => encodeURIComponent(part))].join(GRAPH_ID_SEPARATOR);
}

export interface ParsedGraphId {
  readonly type: GraphEntityType;
  /** Decoded source key parts, in the order they were encoded. */
  readonly parts: readonly string[];
  /** Convenience for the single-part case (`business`, `review`, …). */
  readonly sourceId: string;
}

/**
 * Parses a graph id, or returns null when the string is not one.
 *
 * Null rather than throwing: ids arrive from HTTP DTOs, caches, and stored
 * edges, and a malformed id is a `knowledge_missing` condition the read path
 * degrades on (see `knowledge-graph.validation.ts`), never an exception that
 * takes a traversal down.
 */
export function parseGraphId(id: EntityId): ParsedGraphId | null {
  const segments = id.split(GRAPH_ID_SEPARATOR);
  const [type, ...rest] = segments;

  if (!type || !isGraphEntityType(type) || rest.length === 0) {
    return null;
  }

  let parts: string[];
  try {
    parts = rest.map((part) => decodeURIComponent(part));
  } catch {
    // Malformed percent-encoding — treat as "not a graph id" rather than
    // letting a URIError escape a read.
    return null;
  }

  if (parts.some((part) => part.length === 0)) {
    return null;
  }

  return { type, parts, sourceId: parts[0] as string };
}

/** True when `id` is a graph id of the given kind. */
export function isGraphIdOfType(id: EntityId, type: GraphEntityType): boolean {
  return parseGraphId(id)?.type === type;
}

/**
 * Groups ids by node kind for batched loading, dropping unparseable ones.
 * `entities([...])` uses this to issue one query per table instead of one
 * per id.
 */
export function groupGraphIdsByType(
  ids: readonly EntityId[]
): ReadonlyMap<GraphEntityType, readonly ParsedGraphId[]> {
  const grouped = new Map<GraphEntityType, ParsedGraphId[]>();

  for (const id of ids) {
    const parsed = parseGraphId(id);
    if (!parsed) continue;

    const bucket = grouped.get(parsed.type);
    if (bucket) {
      bucket.push(parsed);
    } else {
      grouped.set(parsed.type, [parsed]);
    }
  }

  return grouped;
}

/**
 * The id of the neighborhood a business sits in.
 *
 * No Neighborhood table exists: a neighborhood is the `(city, district)` pair
 * carried by business rows. Deriving the id from those two values keeps the
 * node stable across rebuilds without inventing storage — and reversibly, so
 * the node can be loaded back by filtering businesses on the same pair.
 */
export function neighborhoodGraphId(city: string, district: string): EntityId {
  return graphId("neighborhood", city, district);
}

export interface NeighborhoodKey {
  readonly city: string;
  readonly district: string;
}

/** Recovers `{ city, district }` from a neighborhood id. */
export function parseNeighborhoodGraphId(id: EntityId): NeighborhoodKey | null {
  const parsed = parseGraphId(id);

  if (!parsed || parsed.type !== "neighborhood" || parsed.parts.length !== 2) {
    return null;
  }

  return { city: parsed.parts[0] as string, district: parsed.parts[1] as string };
}
