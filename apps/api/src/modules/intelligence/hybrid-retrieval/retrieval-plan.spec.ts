import {
  effectiveLimits,
  INTERACTIVE_PER_ENGINE_CAP,
  isRequiredEngine,
  planRetrieval,
  plannedEngines,
  skippedEngines,
  type PlannerEngineState
} from "./retrieval-plan";
import { ENGINE_RETRIEVAL_ORDER, engineRank } from "./retrieval-priority";
import { DEFAULT_RETRIEVAL_LIMITS, type RetrievalQuery } from "./hybrid-retrieval.types";

const ALL_AVAILABLE: readonly PlannerEngineState[] = ENGINE_RETRIEVAL_ORDER.map((engineId) => ({
  engineId,
  available: true
}));

function query(overrides: Partial<RetrievalQuery> = {}): RetrievalQuery {
  return {
    retrievalId: "ret_1",
    queryId: "qry_1",
    customerId: "cus_1",
    workspaceId: "wsp_1",
    reasoningSessionId: null,
    audience: "customer",
    intent: {
      kind: "find_provider",
      experienceType: "dinner",
      subjectEntityIds: [],
      serviceIds: [],
      categoryIds: [],
      neighborhoodId: null,
      anchor: null,
      window: null,
      budget: null,
      partySize: null,
      requiredCapabilityKeys: [],
      locale: "en"
    },
    filters: [],
    limits: DEFAULT_RETRIEVAL_LIMITS,
    budget: {
      estimatedTokens: null,
      estimatedLatencyMs: null,
      estimatedCost: null,
      cacheEligible: true,
      priority: "background"
    },
    requestedAt: "2026-08-07T12:00:00.000Z",
    ...overrides
  };
}

describe("planRetrieval — what runs, and what deliberately does not", () => {
  it("orders the steps by the binding engine order", () => {
    const plan = planRetrieval(query(), ALL_AVAILABLE);
    const ranks = plan.steps.map((step) => engineRank(step.engineId));

    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it("declares itself parallel, because the fan-out is", () => {
    expect(planRetrieval(query(), ALL_AVAILABLE).parallel).toBe(true);
  });

  it("skips the workspace engine with a stated reason when there is no workspace", () => {
    const plan = planRetrieval(query({ workspaceId: null }), ALL_AVAILABLE);

    expect(plannedEngines(plan)).not.toContain("workspace");
    expect(plan.skipped).toContainEqual({ engineId: "workspace", reason: "no_workspace" });
  });

  it("skips memory for an anonymous request rather than asking about nobody", () => {
    const plan = planRetrieval(query({ customerId: null }), ALL_AVAILABLE);

    expect(plan.skipped).toContainEqual({ engineId: "memory", reason: "no_customer" });
  });

  it("skips an engine that reports itself unavailable, naming that as the reason", () => {
    const plan = planRetrieval(
      query(),
      ALL_AVAILABLE.map((state) =>
        state.engineId === "semantic" ? { ...state, available: false } : state
      )
    );

    expect(plan.skipped).toContainEqual({ engineId: "semantic", reason: "engine_unavailable" });
  });

  it("always runs the knowledge graph — structural knowledge is the substrate", () => {
    const anonymous = planRetrieval(query({ customerId: null, workspaceId: null }), ALL_AVAILABLE);

    expect(plannedEngines(anonymous)).toContain("knowledge_graph");
  });

  it("looks up named subjects instead of searching for them", () => {
    const plan = planRetrieval(
      query({
        intent: { ...query().intent, subjectEntityIds: ["biz_1"] }
      }),
      ALL_AVAILABLE
    );

    const graph = plan.steps.find((step) => step.engineId === "knowledge_graph")!;

    expect(graph.operation).toBe("lookup");
    expect(graph.ids).toEqual(["biz_1"]);
    expect(graph.reason).toBe("subjects_named");
  });

  it("gives the feature store a customer and every named subject", () => {
    const plan = planRetrieval(
      query({ intent: { ...query().intent, subjectEntityIds: ["biz_1", "biz_2"] } }),
      ALL_AVAILABLE
    );

    const features = plan.steps.find((step) => step.engineId === "feature_store")!;

    expect(features.ids).toEqual(["cus_1", "biz_1", "biz_2"]);
  });

  it("marks the four engines whose refusal makes a package partial", () => {
    const plan = planRetrieval(query(), ALL_AVAILABLE);

    expect(isRequiredEngine(plan, "workspace")).toBe(true);
    expect(isRequiredEngine(plan, "memory")).toBe(true);
    expect(isRequiredEngine(plan, "knowledge_graph")).toBe(true);
    expect(isRequiredEngine(plan, "business")).toBe(true);
    expect(isRequiredEngine(plan, "marketplace")).toBe(false);
  });
});

describe("budget awareness (patch F)", () => {
  it("drops marketplace context when a person is waiting", () => {
    const plan = planRetrieval(
      query({
        budget: { ...query().budget, priority: "interactive" }
      }),
      ALL_AVAILABLE
    );

    expect(skippedEngines(plan)).toContain("marketplace");
    expect(plan.skipped).toContainEqual({ engineId: "marketplace", reason: "budget_interactive" });
  });

  it("tightens the per-engine cap for interactive requests only", () => {
    expect(effectiveLimits(DEFAULT_RETRIEVAL_LIMITS, "interactive").perEngine).toBe(
      INTERACTIVE_PER_ENGINE_CAP
    );
    expect(effectiveLimits(DEFAULT_RETRIEVAL_LIMITS, "background").perEngine).toBe(
      DEFAULT_RETRIEVAL_LIMITS.perEngine
    );
    expect(effectiveLimits(DEFAULT_RETRIEVAL_LIMITS, "batch").perEngine).toBe(
      DEFAULT_RETRIEVAL_LIMITS.perEngine
    );
  });

  it("never raises a cap a caller set below the interactive one", () => {
    expect(
      effectiveLimits({ ...DEFAULT_RETRIEVAL_LIMITS, perEngine: 3 }, "interactive").perEngine
    ).toBe(3);
  });

  it("passes the effective limits to every step", () => {
    const plan = planRetrieval(
      query({ budget: { ...query().budget, priority: "interactive" } }),
      ALL_AVAILABLE
    );

    for (const step of plan.steps) {
      expect(step.limits.perEngine).toBe(INTERACTIVE_PER_ENGINE_CAP);
    }
  });
});

describe("determinism", () => {
  it("produces the identical plan for the identical query, so it can be cache-keyed", () => {
    const first = planRetrieval(query(), ALL_AVAILABLE);
    const second = planRetrieval(query(), ALL_AVAILABLE);

    expect(first).toEqual(second);
  });

  it("accounts for every engine exactly once, as a step or as a skip", () => {
    const plan = planRetrieval(query({ customerId: null, workspaceId: null }), ALL_AVAILABLE);
    const accounted = [...plannedEngines(plan), ...skippedEngines(plan)].sort();

    expect(accounted).toEqual([...ENGINE_RETRIEVAL_ORDER].sort());
  });
});
