/**
 * Layer 3 (Knowledge Graph) — validation.
 *
 * Two rules decide everything here:
 *
 * 1. **Typed causes only.** Every defect is reported as an
 *    `IntelligenceError` from the frozen ten-cause taxonomy (patch E), so
 *    failure dashboards aggregate by cause rather than by prose. The
 *    taxonomy has no "invalid data" member, and widening it would edit a
 *    frozen contract — so a fact that fails validation is reported as
 *    `knowledge_missing` with a precise `missingKey`. That is not a
 *    euphemism: the read path *drops* what fails, so downstream the
 *    knowledge genuinely is missing, and the error says exactly which key.
 * 2. **Degrade, never throw.** A malformed edge must not take a traversal
 *    down. Validators return errors; callers decide (the read path filters,
 *    the write path in `graph-relationship.store.ts` refuses).
 */
import type { Confidence, EntityId, IntelligenceError, IsoDateTime } from "../core";
import type { AnyRelationship } from "../relationship-engine";
import type { AnyGraphEntity } from "./knowledge-graph.entities";
import { parseGraphId } from "./knowledge-graph.ids";

/** Confidence is a probability: finite and inside [0, 1]. */
export function isValidConfidence(value: Confidence): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

/** ISO-8601 instant that `Date` round-trips — the shape `IsoDateTime` promises. */
export function isValidIsoDateTime(value: IsoDateTime): boolean {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function missing(entityId: EntityId | null, missingKey: string): IntelligenceError {
  return { kind: "knowledge_missing", entityId, missingKey };
}

export interface ValidationOptions {
  /**
   * When supplied, both endpoints must be nodes the caller has resolved —
   * the dangling-edge check that keeps a stored edge from outliving the row
   * it pointed at.
   */
  readonly knownIds?: ReadonlySet<EntityId>;
  /** When supplied, the edge kind must be one this build can traverse. */
  readonly knownKinds?: ReadonlySet<string>;
}

/** Checks one edge in isolation. */
export function validateRelationship(
  edge: AnyRelationship,
  options?: ValidationOptions
): readonly IntelligenceError[] {
  const errors: IntelligenceError[] = [];
  const edgeId = `${edge.kind}|${edge.fromId}|${edge.toId}`;

  if (!edge.kind || typeof edge.kind !== "string") {
    errors.push(missing(null, "relationship.kind"));
  } else if (options?.knownKinds && !options.knownKinds.has(edge.kind)) {
    // A kind this build cannot traverse is knowledge it cannot use.
    errors.push(missing(edgeId, "relationship.kind.unknown"));
  }

  if (!parseGraphId(edge.fromId)) {
    errors.push(missing(edge.fromId ?? null, "relationship.fromId"));
  }

  if (!parseGraphId(edge.toId)) {
    errors.push(missing(edge.toId ?? null, "relationship.toId"));
  }

  if (edge.fromId && edge.fromId === edge.toId) {
    // A node related to itself carries no information and makes traversal
    // budgets meaningless.
    errors.push(missing(edge.fromId, "relationship.distinct_endpoints"));
  }

  if (!isValidConfidence(edge.confidence)) {
    errors.push(missing(edgeId, "relationship.confidence"));
  }

  if (!isValidIsoDateTime(edge.updatedAt)) {
    errors.push(missing(edgeId, "relationship.updatedAt"));
  }

  if (!edge.source) {
    errors.push(missing(edgeId, "relationship.source"));
  }

  const known = options?.knownIds;
  if (known) {
    if (edge.fromId && !known.has(edge.fromId)) {
      errors.push(missing(edge.fromId, "relationship.fromId.entity"));
    }
    if (edge.toId && !known.has(edge.toId)) {
      errors.push(missing(edge.toId, "relationship.toId.entity"));
    }
  }

  return errors;
}

/**
 * Checks one node, including the invariant that every edge it carries
 * actually touches it — a node advertising an edge between two other nodes
 * would make `related()` and traversal disagree about the same graph.
 */
export function validateGraphEntity(entity: AnyGraphEntity): readonly IntelligenceError[] {
  const errors: IntelligenceError[] = [];
  const parsed = parseGraphId(entity.id);

  if (!parsed) {
    errors.push(missing(entity.id ?? null, "entity.id"));
  } else if (parsed.type !== entity.type) {
    errors.push(missing(entity.id, "entity.id.type"));
  }

  if (!isValidConfidence(entity.confidence)) {
    errors.push(missing(entity.id, "entity.confidence"));
  }

  if (!isValidIsoDateTime(entity.updatedAt)) {
    errors.push(missing(entity.id, "entity.updatedAt"));
  }

  if (!entity.metadata || typeof entity.metadata !== "object") {
    errors.push(missing(entity.id, "entity.metadata"));
  }

  for (const edge of entity.relationships) {
    errors.push(...validateRelationship(edge));

    if (edge.fromId !== entity.id && edge.toId !== entity.id) {
      errors.push(missing(entity.id, "entity.relationships.incident"));
    }
  }

  return errors;
}

export interface SanitizedEntity {
  /** The node with only its valid edges, or null when the node itself is invalid. */
  readonly entity: AnyGraphEntity | null;
  /** Edges dropped on the way. */
  readonly droppedEdges: number;
  readonly errors: readonly IntelligenceError[];
}

/**
 * Makes a node servable, or refuses to serve it.
 *
 * A node whose own fields break the contract (wrong id shape, impossible
 * confidence) is withheld — serving it would put an unrepresentable value
 * into every consumer downstream. A node carrying a bad *edge* is served
 * without that edge: losing one connection is a smaller lie than losing the
 * business it described.
 */
export function sanitizeGraphEntity(
  entity: AnyGraphEntity,
  options?: ValidationOptions
): SanitizedEntity {
  const screened = screenRelationships(entity.relationships, options);
  const rejectedErrors = screened.rejected.flatMap((rejection) => rejection.errors);

  // Spread-and-narrow: the union's discriminant and metadata are untouched,
  // only `relationships` is replaced, which no member of the union narrows.
  const candidate = { ...entity, relationships: screened.accepted } as AnyGraphEntity;
  const nodeErrors = validateGraphEntity(candidate);

  return {
    entity: nodeErrors.length === 0 ? candidate : null,
    droppedEdges: screened.rejected.length,
    errors: [...rejectedErrors, ...nodeErrors]
  };
}

export interface RelationshipScreenResult {
  /** Edges that passed validation, in input order. */
  readonly accepted: readonly AnyRelationship[];
  /** Rejected edges with the typed causes that rejected them. */
  readonly rejected: readonly { readonly edge: AnyRelationship; readonly errors: readonly IntelligenceError[] }[];
}

/**
 * Splits a batch of edges into what the graph will serve and what it drops.
 * Used on every read that merges projected with stored edges, so a bad row in
 * storage degrades one edge instead of an entire answer.
 */
export function screenRelationships(
  edges: readonly AnyRelationship[],
  options?: ValidationOptions
): RelationshipScreenResult {
  const accepted: AnyRelationship[] = [];
  const rejected: { edge: AnyRelationship; errors: readonly IntelligenceError[] }[] = [];

  for (const edge of edges) {
    const errors = validateRelationship(edge, options);
    if (errors.length === 0) {
      accepted.push(edge);
    } else {
      rejected.push({ edge, errors });
    }
  }

  return { accepted, rejected };
}
