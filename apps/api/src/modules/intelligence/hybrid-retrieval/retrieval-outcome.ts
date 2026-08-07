/**
 * Layer 4.5 (Hybrid Retrieval) — the honesty rule, as code.
 *
 * Epic 06 established the discipline one layer down: a model either has the
 * evidence or it says so, in a typed shape carrying what was missing. Epic 07
 * inherits it verbatim, because retrieval is where the temptation is worst —
 * an engine with no data can always return an empty array, and an empty array
 * is indistinguishable from "there is nothing to find". Those are opposite
 * statements. One means *look elsewhere*; the other means *stop looking*.
 *
 * So every engine returns a `RetrievalOutcome`: items, or a typed
 * `IntelligenceFailure` naming the cause from the ten-kind taxonomy. There is
 * no third branch, and "no results" is a `retrieved` outcome with zero items —
 * which is a real, different answer from `insufficient_data`.
 *
 * The mapping from cause to taxonomy kind is fixed here rather than at each
 * call site, because the difference between `feature_unavailable`,
 * `knowledge_missing` and `marketplace_sparse` is the difference between "a
 * module has not shipped", "a column does not exist", and "ask again when we
 * have grown" — three different things for an operator to do.
 *
 * Imports `core` only.
 */
import type { Confidence, EntityId, IntelligenceFailure, IsoDateTime } from "../core";
import type {
  RetrievalEngineId,
  RetrievalItem,
  RetrievalOutcome,
  RetrievalWarning
} from "./hybrid-retrieval.types";

/** A successful retrieval, including the honest zero-item case. */
export function retrieved<TValue>(
  value: TValue,
  confidence: Confidence
): Extract<RetrievalOutcome<TValue>, { status: "retrieved" }> {
  return { status: "retrieved", value, confidence };
}

/** A refusal, from an already-built failure. */
export function refused<TValue>(
  failure: IntelligenceFailure
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return { status: "insufficient_data", failure };
}

/**
 * A refusal because *the module that would answer has not shipped* — the
 * semantic engine today, and any engine whose provider token nobody bound.
 *
 * Not retryable: no amount of waiting binds a provider. An operator reading
 * this needs to deploy something, not schedule a retry.
 */
export function refuseUnavailableFeature<TValue>(
  featureKey: string,
  at: IsoDateTime,
  entityId: EntityId | null = null
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "feature_unavailable", featureKey, entityId },
    retryable: false,
    occurredAt: at
  });
}

/**
 * A refusal because *the relational schema records nothing at all* — the
 * workspace engine today, which has no `Workspace` model to read.
 *
 * Not retryable, for the reason Epic 06 spelled out: `marketplace_sparse` says
 * "ask again when we have grown", `knowledge_missing` says "a column has to
 * exist first", and conflating them has a scheduler retrying forever for data
 * no row can ever contain.
 */
export function refuseMissingKnowledge<TValue>(
  missingKey: string,
  at: IsoDateTime,
  entityId: EntityId | null = null
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "knowledge_missing", entityId, missingKey },
    retryable: false,
    occurredAt: at
  });
}

/**
 * A refusal because there is too little marketplace data to answer honestly.
 *
 * Retryable: this is the one failure kind in the taxonomy that time alone
 * fixes.
 */
export function refuseSparse<TValue>(
  scopeKey: string,
  sampleSize: number,
  at: IsoDateTime
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "marketplace_sparse", scopeKey, sampleSize },
    retryable: true,
    occurredAt: at
  });
}

/**
 * A refusal because the caller may not ask this.
 *
 * The internal-only filters are the live case: a customer-audience query
 * carrying `premium_only` is not a thinner answer, it is a request the
 * principal has no standing to make (ADR-001).
 */
export function refuseForbidden<TValue>(
  principal: string,
  action: string,
  at: IsoDateTime
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "permission_denied", principal, action },
    retryable: false,
    occurredAt: at
  });
}

/** A refusal because an engine exceeded its slice of the request budget. */
export function refuseTimeout<TValue>(
  operation: string,
  timeoutMs: number,
  at: IsoDateTime
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "timeout", operation, timeoutMs },
    retryable: true,
    occurredAt: at
  });
}

/**
 * A refusal because an engine threw.
 *
 * `reasoning_failure` is the taxonomy's "a stage could not produce a result
 * from valid inputs", which is exactly what an unexpected throw is. The thrown
 * value never travels: a stack trace is prose, and prose does not leave this
 * module (ADR-006).
 */
export function refuseEngineFault<TValue>(
  engineId: RetrievalEngineId,
  operation: string,
  at: IsoDateTime
): Extract<RetrievalOutcome<TValue>, { status: "insufficient_data" }> {
  return refused({
    error: { kind: "reasoning_failure", stage: `retrieval.${engineId}.${operation}` },
    retryable: true,
    occurredAt: at
  });
}

/** True when an outcome carries items — the type guard consumers narrow on. */
export function isRetrieved<TValue>(
  outcome: RetrievalOutcome<TValue>
): outcome is Extract<RetrievalOutcome<TValue>, { status: "retrieved" }> {
  return outcome.status === "retrieved";
}

/** The items an outcome carries, or an empty list. For call sites that merge. */
export function itemsOf(
  outcome: RetrievalOutcome<readonly RetrievalItem[]>
): readonly RetrievalItem[] {
  return outcome.status === "retrieved" ? outcome.value : [];
}

/** The failure an outcome carries, or null when it retrieved. */
export function failureOf<TValue>(outcome: RetrievalOutcome<TValue>): IntelligenceFailure | null {
  return outcome.status === "insufficient_data" ? outcome.failure : null;
}

/** A warning built from a refusal, for the package's `warnings` list. */
export function warningOf(
  engineId: RetrievalEngineId | null,
  scopeKey: string,
  failure: IntelligenceFailure
): RetrievalWarning {
  return { engineId, scopeKey, failure };
}
