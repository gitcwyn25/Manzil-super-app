/**
 * Layer 4.5 (Hybrid Retrieval) — the query plan, as pure logic.
 *
 * "Fan out to everything" is not a plan, it is an absence of one: it asks the
 * memory engine about an anonymous visitor, the workspace engine about a query
 * with no workspace, and the semantic engine about a provider nobody bound —
 * three guaranteed refusals per request, each costing a round trip and each
 * arriving as a warning that means nothing.
 *
 * So planning is a real step, and it is *pure*: given a query, decide which
 * engines can contribute, with which operation, and record — for every engine
 * left out — the reason. `skipped` is as important as `steps`. An engine
 * missing from a retrieval with no stated reason is indistinguishable from an
 * engine that crashed, and the whole point of ADR-006's replaceability is that
 * you can tell.
 *
 * The plan also honours the `InferenceBudget` (patch F): an `interactive`
 * request tightens per-engine limits, because a plan that ignores its own
 * declared latency budget is a budget nobody is keeping.
 *
 * Imports `core` and lower layers only.
 */
import type { EntityId, InferencePriority } from "../core";
import { ENGINE_RETRIEVAL_ORDER, engineRank } from "./retrieval-priority";
import type {
  RetrievalEngineId,
  RetrievalLimits,
  RetrievalQuery
} from "./hybrid-retrieval.types";

/** What an engine is asked to do in this plan. */
export type RetrievalOperation = "search" | "lookup";

/** Why an engine is in the plan, as a stable key rather than prose. */
export type RetrievalPlanReason =
  | "workspace_scoped"
  | "customer_scoped"
  | "subjects_named"
  | "services_named"
  | "categories_named"
  | "structural_always"
  | "market_context"
  | "semantic_enabled";

/** Why an engine was left out. */
export type RetrievalSkipReason =
  | "no_customer"
  | "no_workspace"
  | "no_subjects"
  | "engine_unavailable"
  | "budget_interactive";

/** One engine's slot in the plan. */
export interface RetrievalPlanStep {
  readonly engineId: RetrievalEngineId;
  readonly operation: RetrievalOperation;
  readonly reason: RetrievalPlanReason;
  /** Ids to look up; empty for `search`. */
  readonly ids: readonly EntityId[];
  /**
   * True when a refusal from this engine makes the whole package partial.
   * False for engines whose contribution is additive — the marketplace's city
   * context improves an answer, its absence does not invalidate one.
   */
  readonly required: boolean;
  readonly limits: RetrievalLimits;
}

/** One engine's absence, with the reason it is absent. */
export interface RetrievalPlanSkip {
  readonly engineId: RetrievalEngineId;
  readonly reason: RetrievalSkipReason;
}

/** The plan: what runs, in what order, and what deliberately does not. */
export interface RetrievalPlan {
  readonly retrievalId: EntityId;
  readonly queryId: EntityId;
  /** Steps in `ENGINE_RETRIEVAL_ORDER`; execution is parallel, order is for reading. */
  readonly steps: readonly RetrievalPlanStep[];
  readonly skipped: readonly RetrievalPlanSkip[];
  /** Always true today: the fan-out is concurrent and the field says so. */
  readonly parallel: boolean;
}

/**
 * Per-engine caps under an `interactive` budget.
 *
 * Interactive means a human is waiting, so breadth is traded for latency: half
 * the per-engine ceiling and no marketplace-wide context, which is the
 * engine whose value is least tied to *this* request.
 */
export const INTERACTIVE_PER_ENGINE_CAP = 20;

/** Engines dropped when the budget says a person is waiting. */
export const INTERACTIVE_SKIPPED_ENGINES: readonly RetrievalEngineId[] = ["marketplace"];

/** Engines whose refusal makes a package partial rather than merely thinner. */
export const REQUIRED_ENGINES: readonly RetrievalEngineId[] = [
  "workspace",
  "memory",
  "knowledge_graph",
  "business"
];

/** What the planner needs to know about the installed engines. */
export interface PlannerEngineState {
  readonly engineId: RetrievalEngineId;
  readonly available: boolean;
}

/**
 * Builds the plan.
 *
 * Deterministic and side-effect-free: the same query and the same engine
 * states always yield the same plan, which is what lets the plan participate
 * in the cache key.
 */
export function planRetrieval(
  query: RetrievalQuery,
  engines: readonly PlannerEngineState[]
): RetrievalPlan {
  const steps: RetrievalPlanStep[] = [];
  const skipped: RetrievalPlanSkip[] = [];
  const interactive = query.budget.priority === "interactive";
  const limits = effectiveLimits(query.limits, query.budget.priority);

  const stateOf = new Map(engines.map((engine) => [engine.engineId, engine.available]));

  for (const engineId of ENGINE_RETRIEVAL_ORDER) {
    // `!== true`, not `=== false`: an engine missing from the installed set is
    // as uncallable as one that reports itself unavailable, and planning a call
    // to an engine nobody provided would produce a step the fan-out silently
    // drops — an engine absent from a retrieval with no stated reason, which is
    // exactly what `skipped` exists to prevent.
    if (stateOf.get(engineId) !== true) {
      skipped.push({ engineId, reason: "engine_unavailable" });
      continue;
    }

    if (interactive && (INTERACTIVE_SKIPPED_ENGINES as readonly string[]).includes(engineId)) {
      skipped.push({ engineId, reason: "budget_interactive" });
      continue;
    }

    const step = stepFor(engineId, query, limits);
    if (step === null) {
      skipped.push({ engineId, reason: skipReasonFor(engineId, query) });
      continue;
    }

    steps.push(step);
  }

  return {
    retrievalId: query.retrievalId,
    queryId: query.queryId,
    steps: [...steps].sort((left, right) => engineRank(left.engineId) - engineRank(right.engineId)),
    skipped,
    parallel: true
  };
}

/** The limits after the budget has had its say. */
export function effectiveLimits(
  limits: RetrievalLimits,
  priority: InferencePriority
): RetrievalLimits {
  if (priority !== "interactive") return limits;

  return {
    ...limits,
    perEngine: Math.min(limits.perEngine, INTERACTIVE_PER_ENGINE_CAP)
  };
}

/** One engine's step, or null when this query gives it nothing to work with. */
function stepFor(
  engineId: RetrievalEngineId,
  query: RetrievalQuery,
  limits: RetrievalLimits
): RetrievalPlanStep | null {
  const required = (REQUIRED_ENGINES as readonly string[]).includes(engineId);
  const subjects = query.intent.subjectEntityIds;

  switch (engineId) {
    case "workspace":
      if (query.workspaceId === null) return null;
      return step(engineId, "lookup", "workspace_scoped", [query.workspaceId], required, limits);

    case "memory":
      if (query.customerId === null) return null;
      return step(engineId, "lookup", "customer_scoped", [query.customerId], required, limits);

    case "feature_store": {
      // Features are per-entity: without a customer or a named subject there is
      // no vector to fetch, and a "search the feature store" operation does not
      // exist — the store is a keyed read by contract (`FeatureStoreProvider`).
      const ids = [...(query.customerId ? [query.customerId] : []), ...subjects];
      if (ids.length === 0) return null;
      return step(
        engineId,
        "lookup",
        query.customerId ? "customer_scoped" : "subjects_named",
        ids,
        required,
        limits
      );
    }

    case "knowledge_graph":
      // The only engine that always runs: structural knowledge is the substrate
      // every other engine's ids point into.
      return subjects.length > 0
        ? step(engineId, "lookup", "subjects_named", subjects, required, limits)
        : step(engineId, "search", "structural_always", [], required, limits);

    case "business":
      return subjects.length > 0
        ? step(engineId, "lookup", "subjects_named", subjects, required, limits)
        : step(engineId, "search", "structural_always", [], required, limits);

    case "marketplace":
      return step(engineId, "search", "market_context", [], required, limits);

    case "semantic":
      // Reachable only when a provider is bound — the engine reports
      // `available: false` otherwise and the loop above skips it first.
      return step(engineId, "search", "semantic_enabled", [], required, limits);
  }
}

function step(
  engineId: RetrievalEngineId,
  operation: RetrievalOperation,
  reason: RetrievalPlanReason,
  ids: readonly EntityId[],
  required: boolean,
  limits: RetrievalLimits
): RetrievalPlanStep {
  return { engineId, operation, reason, ids, required, limits };
}

/** The reason an engine had nothing to work with, from the query's own shape. */
function skipReasonFor(engineId: RetrievalEngineId, query: RetrievalQuery): RetrievalSkipReason {
  if (engineId === "workspace") return "no_workspace";
  if (engineId === "memory") return "no_customer";
  if (engineId === "feature_store") {
    return query.customerId === null && query.intent.subjectEntityIds.length === 0
      ? "no_customer"
      : "no_subjects";
  }
  return "no_subjects";
}

/** The engines a plan will actually call. */
export function plannedEngines(plan: RetrievalPlan): readonly RetrievalEngineId[] {
  return plan.steps.map((planStep) => planStep.engineId);
}

/** The engines a plan deliberately left out. */
export function skippedEngines(plan: RetrievalPlan): readonly RetrievalEngineId[] {
  return plan.skipped.map((skip) => skip.engineId);
}

/** True when a refusal by this engine makes the package partial. */
export function isRequiredEngine(plan: RetrievalPlan, engineId: RetrievalEngineId): boolean {
  return plan.steps.some((planStep) => planStep.engineId === engineId && planStep.required);
}
