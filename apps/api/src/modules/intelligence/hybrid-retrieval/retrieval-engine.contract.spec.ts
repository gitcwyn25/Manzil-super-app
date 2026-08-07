import type { EntityId } from "../core";
import type { AnyGraphEntity, KnowledgeGraphProvider } from "../knowledge-graph";
import type { AnyRelationship } from "../relationship-engine";
import type { MemoryBundle, MemoryEngineProvider } from "../memory-engine";
import type { BusinessIntelligenceProvider, BusinessSummary } from "../business-intelligence";
import type { FeatureStoreProvider } from "../feature-store";
import type { MarketplaceIntelligenceProvider } from "../marketplace-intelligence";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { engineHealth, type RetrievalEngine } from "./retrieval-engine.contract";
import { WorkspaceRetrievalEngine, WORKSPACE_SCHEMA_MISSING_KEY } from "./workspace.engine";
import { MemoryRetrievalEngine } from "./memory.engine";
import { FeatureStoreRetrievalEngine } from "./feature-store.engine";
import { KnowledgeGraphRetrievalEngine, GRAPH_OPEN_SEARCH_FEATURE } from "./knowledge-graph.engine";
import { BusinessRetrievalEngine, CANDIDATE_GENERATION_FEATURE } from "./business.engine";
import { MarketplaceRetrievalEngine } from "./marketplace.engine";
import { SemanticRetrievalEngine } from "./semantic.engine";
import { SEMANTIC_FEATURE_KEY } from "./semantic-provider.contract";
import { ENGINE_CONTEXT_SECTION, ENGINE_RETRIEVAL_ORDER, ENGINE_RETRIEVAL_SOURCE } from "./retrieval-priority";
import { isRetrieved } from "./retrieval-outcome";
import { DEFAULT_RETRIEVAL_LIMITS, type RetrievalQuery } from "./hybrid-retrieval.types";

const NOW = "2026-08-07T12:00:00.000Z";

const clock: RetrievalClock = {
  now: () => NOW,
  newId: () => "id_1",
  monotonicMs: () => 0
};

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
    requestedAt: NOW,
    ...overrides
  };
}

/** Every engine, unwired — the deployment shape a fresh install actually has. */
function unwiredEngines(): readonly RetrievalEngine[] {
  return [
    new WorkspaceRetrievalEngine(clock),
    new MemoryRetrievalEngine(clock),
    new FeatureStoreRetrievalEngine(clock),
    new KnowledgeGraphRetrievalEngine(clock),
    new BusinessRetrievalEngine(clock),
    new MarketplaceRetrievalEngine(clock),
    new SemanticRetrievalEngine(clock)
  ];
}

describe("engine contract conformance — all seven, identically", () => {
  const engines = unwiredEngines();

  it("installs exactly the seven engines the epic names", () => {
    expect(engines.map((engine) => engine.id).sort()).toEqual([...ENGINE_RETRIEVAL_ORDER].sort());
  });

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s exposes the five contract methods",
    (_id, engine) => {
      expect(typeof engine.search).toBe("function");
      expect(typeof engine.lookup).toBe("function");
      expect(typeof engine.hydrate).toBe("function");
      expect(typeof engine.score).toBe("function");
      expect(typeof engine.explain).toBe("function");
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s declares the source and section the priority tables assign it",
    (id, engine) => {
      expect(engine.retrievalSource).toBe(ENGINE_RETRIEVAL_SOURCE[id]);
      expect(engine.contextSection).toBe(ENGINE_CONTEXT_SECTION[id]);
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s declares at least one item kind and the summary hydration level",
    (_id, engine) => {
      expect(engine.itemKinds.length).toBeGreaterThan(0);
      expect(engine.hydrationLevels).toContain("summary");
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s answers search() with a typed refusal rather than throwing when unwired",
    async (_id, engine) => {
      const result = await engine.search(query());

      expect(result.engineId).toBe(engine.id);
      expect(result.outcome.status).toBe("insufficient_data");
      expect(isRetrieved(result.outcome)).toBe(false);
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s answers lookup() with a typed refusal rather than throwing when unwired",
    async (_id, engine) => {
      const result = await engine.lookup(["biz_1"], query());

      expect(result.outcome.status).toBe("insufficient_data");
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s reports itself unavailable with a stated reason when unwired",
    (_id, engine) => {
      expect(engine.availability.available).toBe(false);
      expect(engine.availability.backend).toBe("none");
      expect(engine.availability.unavailableReason).not.toBeNull();
    }
  );

  it.each(engines.map((engine) => [engine.id, engine] as const))(
    "%s hydrate() and score() are safe no-ops on an empty list",
    async (_id, engine) => {
      await expect(engine.hydrate([], "analytics")).resolves.toEqual([]);
      await expect(engine.score([], query())).resolves.toEqual([]);
    }
  );

  it("projects health for every engine without running a retrieval", () => {
    const health = engines.map(engineHealth);

    expect(health).toHaveLength(7);
    expect(health.every((entry) => entry.availability.available === false)).toBe(true);
  });
});

describe("the semantic engine is contract-only, by construction", () => {
  const semantic = new SemanticRetrievalEngine(clock);

  it("refuses with feature_unavailable naming the vector index", async () => {
    const result = await semantic.search(query());

    expect(result.outcome.status).toBe("insufficient_data");
    if (result.outcome.status === "insufficient_data") {
      const error = result.outcome.failure.error;
      expect(error.kind).toBe("feature_unavailable");
      expect(error.kind === "feature_unavailable" && error.featureKey).toBe(SEMANTIC_FEATURE_KEY);
      expect(result.outcome.failure.retryable).toBe(false);
    }
  });

  it("refuses lookup for the same reason", async () => {
    const result = await semantic.lookup(["biz_1"], query());

    expect(result.outcome.status).toBe("insufficient_data");
  });

  it("would produce items that carry only a semantic score, if a provider existed", () => {
    const item = semantic.toItem(
      { entityId: "biz_1", kind: "business", score: 0.82, metadata: {} },
      "qdrant",
      NOW
    );

    expect(item.score.semanticScore).toBe(0.82);
    expect(item.score.graphScore).toBeNull();
    expect(item.score.memoryScore).toBeNull();
    expect(item.score.reasonCodes).toEqual(["semantic_similarity"]);
    expect(item.engineId).toBe("semantic");
  });
});

describe("wired engines return real data", () => {
  const graphBusiness: AnyGraphEntity = {
    id: "biz_1",
    type: "business",
    relationships: [] as readonly AnyRelationship[],
    metadata: {
      name: "Plov Center",
      slug: "plov-center",
      categoryId: "cat_1",
      neighborhoodId: "nbh_1",
      priceTier: "$$",
      capabilities: [],
      openingHours: [{ day: "friday", startLocalTime: "18:00", endLocalTime: "23:00" }],
      verified: true
    },
    confidence: 0.9,
    updatedAt: NOW
  };

  const graph: KnowledgeGraphProvider = {
    entity: async () => graphBusiness,
    entities: async (ids: readonly EntityId[]) =>
      new Map(ids.includes("biz_1") ? [["biz_1", graphBusiness]] : []),
    related: async () => [],
    providersOfService: async () => ["biz_1"]
  };

  it("the knowledge graph engine turns a service into its providers", async () => {
    const engine = new KnowledgeGraphRetrievalEngine(clock, graph);
    const result = await engine.search(
      query({ intent: { ...query().intent, serviceIds: ["svc_1"] } })
    );

    expect(result.outcome.status).toBe("retrieved");
    if (result.outcome.status === "retrieved") {
      expect(result.outcome.value.map((item) => item.entityId)).toContain("biz_1");
      expect(result.outcome.value[0]!.score.graphScore).toBe(0.9);
    }
  });

  it("the knowledge graph engine refuses an unanchored search by name", async () => {
    const engine = new KnowledgeGraphRetrievalEngine(clock, graph);
    const result = await engine.search(query());

    expect(result.outcome.status).toBe("insufficient_data");
    if (result.outcome.status === "insufficient_data") {
      const error = result.outcome.failure.error;
      expect(error.kind === "feature_unavailable" && error.featureKey).toBe(
        GRAPH_OPEN_SEARCH_FEATURE
      );
    }
  });

  it("the memory engine emits mission and preference at their own ranks", async () => {
    const bundle: MemoryBundle = {
      mission: {
        memoryId: "mem_1",
        tier: "mission_context",
        source: "conversation",
        confidence: 0.8,
        created: NOW,
        updated: NOW,
        expires: null,
        retrievalPriority: 1,
        knowledge: {
          customerId: "cus_1",
          experienceType: "birthday",
          targetDate: "2026-08-20",
          guestCount: 6,
          budget: null,
          nearNeighborhoodId: "nbh_1",
          requiredCapabilityKeys: ["private_rooms"],
          workspaceId: "wsp_1"
        }
      },
      preferences: {
        memoryId: "mem_2",
        tier: "preference_context",
        source: "visit",
        confidence: 0.7,
        created: NOW,
        updated: NOW,
        expires: null,
        retrievalPriority: 3,
        knowledge: {
          customerId: "cus_1",
          preferences: [],
          budget: null,
          dietary: [],
          favoriteBusinessIds: ["biz_9"]
        }
      },
      relationships: null,
      workspaceTimeline: null,
      businessContext: null,
      marketplaceContext: null
    };

    const memory: MemoryEngineProvider = {
      recall: async () => bundle,
      remember: async () => undefined,
      forgetMission: async () => undefined
    };

    const engine = new MemoryRetrievalEngine(clock, memory);
    const result = await engine.search(query());

    expect(result.outcome.status).toBe("retrieved");
    if (result.outcome.status === "retrieved") {
      const sources = result.outcome.value.map((item) => item.retrievalSource);
      expect(sources).toEqual(["mission_context", "persistent_preferences"]);
    }
  });

  it("the memory engine does not emit the workspace tier — that engine owns it", async () => {
    const memory: MemoryEngineProvider = {
      recall: async () => ({
        mission: null,
        preferences: null,
        relationships: null,
        workspaceTimeline: {
          memoryId: "mem_3",
          tier: "workspace_timeline",
          source: "workspace",
          confidence: 0.95,
          created: NOW,
          updated: NOW,
          expires: null,
          retrievalPriority: 0,
          knowledge: {
            workspaceId: "wsp_1",
            experienceId: "exp_1",
            entries: [
              { at: NOW, taskId: "tsk_1", kind: "booking_confirmed", label: "Venue booked" }
            ]
          }
        },
        businessContext: null,
        marketplaceContext: null
      }),
      remember: async () => undefined,
      forgetMission: async () => undefined
    };

    const memoryEngine = new MemoryRetrievalEngine(clock, memory);
    const memoryResult = await memoryEngine.search(query());

    expect(memoryResult.outcome.status).toBe("retrieved");
    if (memoryResult.outcome.status === "retrieved") {
      expect(memoryResult.outcome.value).toHaveLength(0);
    }

    const workspaceEngine = new WorkspaceRetrievalEngine(clock, memory);
    const workspaceResult = await workspaceEngine.search(query());

    expect(workspaceResult.outcome.status).toBe("retrieved");
    if (workspaceResult.outcome.status === "retrieved") {
      expect(workspaceResult.outcome.value[0]!.retrievalSource).toBe("workspace_timeline");
      // The confirmed booking becomes its own item a filter can see.
      expect(workspaceResult.outcome.value.map((item) => item.kind)).toEqual([
        "workspace",
        "availability"
      ]);
    }
  });

  it("the workspace engine says schema.workspace rather than returning an empty list", async () => {
    const memory: MemoryEngineProvider = {
      recall: async () => ({
        mission: null,
        preferences: null,
        relationships: null,
        workspaceTimeline: null,
        businessContext: null,
        marketplaceContext: null
      }),
      remember: async () => undefined,
      forgetMission: async () => undefined
    };

    const result = await new WorkspaceRetrievalEngine(clock, memory).search(query());

    expect(result.outcome.status).toBe("insufficient_data");
    if (result.outcome.status === "insufficient_data") {
      const error = result.outcome.failure.error;
      expect(error.kind).toBe("knowledge_missing");
      expect(error.kind === "knowledge_missing" && error.missingKey).toBe(
        WORKSPACE_SCHEMA_MISSING_KEY
      );
      expect(result.outcome.failure.retryable).toBe(false);
    }
  });

  it("the business engine refuses an unanchored search by naming candidate generation", async () => {
    const businesses: BusinessIntelligenceProvider = {
      summary: async () => null,
      summaries: async () => new Map(),
      health: async () => null,
      alternatives: async () => []
    };

    const result = await new BusinessRetrievalEngine(clock, businesses).search(query());

    expect(result.outcome.status).toBe("insufficient_data");
    if (result.outcome.status === "insufficient_data") {
      const error = result.outcome.failure.error;
      expect(error.kind === "feature_unavailable" && error.featureKey).toBe(
        CANDIDATE_GENERATION_FEATURE
      );
    }
  });

  it("the business engine hydrates lazily, level by level", async () => {
    const summary: BusinessSummary = {
      businessId: "biz_1",
      strengths: [
        {
          aspect: "food_quality",
          score: 0.8,
          evidenceCount: 12,
          source: "review",
          confidence: 0.7
        }
      ],
      weaknesses: [],
      health: {
        businessId: "biz_1",
        overall: 82,
        bookingTrend: "growing",
        reviewFreshnessDays: 3,
        responseRate: 0.9,
        cancellationRate: 0.05,
        listingStale: false,
        computedAt: NOW
      },
      popularServices: [{ serviceId: "svc_1", bookingShare: 0.6, rank: 1 }],
      typicalCustomers: [],
      peakHours: { businessId: "biz_1", windows: [], peakIntensity: 0.5, computedAt: NOW },
      suitableExperiences: [
        { experienceType: "dinner", fit: 0.9, supportingCapabilityKeys: ["private_rooms"] }
      ],
      alternatives: [],
      averageSpend: null,
      updatedAt: NOW
    };

    const businesses: BusinessIntelligenceProvider = {
      summary: async () => summary,
      summaries: async () => new Map([["biz_1", summary]]),
      health: async () => summary.health,
      alternatives: async () => [
        {
          businessId: "biz_2",
          constraintOverlap: 0.8,
          gainedCapabilityKeys: ["outdoor_seating"],
          lostCapabilityKeys: []
        }
      ]
    };

    const engine = new BusinessRetrievalEngine(clock, businesses);
    const found = await engine.lookup(["biz_1"], query());

    expect(found.outcome.status).toBe("retrieved");
    if (found.outcome.status !== "retrieved") return;

    const summaryLevel = found.outcome.value.find((item) => item.kind === "business")!;
    expect(summaryLevel.hydration).toBe("summary");
    expect(summaryLevel.payload.facts.map((entry) => entry.key)).not.toContain("business.strengths");

    // The alternative is its own kind, never mixed in with what was asked for.
    expect(found.outcome.value.some((item) => item.kind === "alternative")).toBe(true);

    const deeper = await engine.hydrate([summaryLevel], "reviews");
    expect(deeper[0]!.hydration).toBe("reviews");
    expect(deeper[0]!.payload.facts.map((entry) => entry.key)).toContain("business.strengths");
    // A hydration keeps the standing the merge already decided.
    expect(deeper[0]!.score).toEqual(summaryLevel.score);
  });

  it("the feature store engine drops absent fields instead of zeroing them", async () => {
    const features: FeatureStoreProvider = {
      businessFeatures: async () => ({
        businessId: "biz_1",
        popularity: null,
        trust: { value: 0.7, confidence: 0.8, computedAt: NOW, source: "platform_inference" },
        familyScore: null,
        luxuryScore: null,
        averageVisitMinutes: null,
        peakHours: null,
        noise: null,
        priceStability: null,
        computedAt: NOW
      }),
      customerFeatures: async () => null,
      neighborhoodFeatures: async () => null
    };

    const engine = new FeatureStoreRetrievalEngine(clock, features);
    const result = await engine.lookup(["biz_1"], query({ customerId: null }));

    expect(result.outcome.status).toBe("retrieved");
    if (result.outcome.status !== "retrieved") return;

    const item = result.outcome.value[0]!;
    expect(item.score.featureScore).toBeNull();
    expect(item.score.businessTrustScore).toBe(0.7);
    expect(item.payload.facts.map((entry) => entry.key)).not.toContain("feature.popularity");
  });

  it("the marketplace engine reads city context for the query's own scope", async () => {
    const marketplace: MarketplaceIntelligenceProvider = {
      businessFacts: async () => null,
      customerFacts: async () => null,
      demand: async () => null,
      neighborhood: async () => ({
        neighborhoodId: "nbh_1",
        businessCount: {
          value: 42,
          sampleSize: 42,
          window: { start: NOW, end: NOW },
          confidence: 0.6,
          generatedAt: NOW
        },
        underservedServiceIds: ["svc_9"],
        averagePriceLevel: null,
        peakActivity: null,
        generatedAt: NOW
      }),
      service: async () => null,
      trends: async () => [],
      relationships: async () => []
    };

    const engine = new MarketplaceRetrievalEngine(clock, marketplace);
    const result = await engine.search(
      query({ intent: { ...query().intent, neighborhoodId: "nbh_1" } })
    );

    expect(result.outcome.status).toBe("retrieved");
    if (result.outcome.status === "retrieved") {
      expect(result.outcome.value[0]!.entityId).toBe("nbh_1");
      expect(result.outcome.value[0]!.score.reasonCodes).toEqual(["marketplace_signal"]);
    }
  });
});

describe("the base engine's guarantees", () => {
  it("turns a thrown error into a typed reasoning_failure instead of taking the fan-out down", async () => {
    const exploding: KnowledgeGraphProvider = {
      entity: async () => null,
      entities: async () => {
        throw new Error("connection reset");
      },
      related: async () => [],
      providersOfService: async () => ["biz_1"]
    };

    const engine = new KnowledgeGraphRetrievalEngine(clock, exploding);
    const result = await engine.search(query({ intent: { ...query().intent, serviceIds: ["svc_1"] } }));

    expect(result.outcome.status).toBe("insufficient_data");
    if (result.outcome.status === "insufficient_data") {
      const error = result.outcome.failure.error;
      expect(error.kind).toBe("reasoning_failure");
      expect(error.kind === "reasoning_failure" && error.stage).toBe(
        "retrieval.knowledge_graph.search"
      );
      // No stack trace, no message: prose does not leave this module.
      expect(JSON.stringify(result.outcome.failure)).not.toContain("connection reset");
    }
  });

  it("caps a result at limits.perEngine and says it truncated", async () => {
    const many = Array.from({ length: 5 }, (_, index) => `biz_${index}`);
    const graph: KnowledgeGraphProvider = {
      entity: async () => null,
      entities: async (ids) =>
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              type: "business",
              relationships: [],
              metadata: {
                name: id,
                slug: id,
                categoryId: null,
                neighborhoodId: null,
                priceTier: null,
                capabilities: [],
                openingHours: [],
                verified: false
              },
              confidence: 0.5,
              updatedAt: NOW
            } as AnyGraphEntity
          ])
        ),
      related: async () => [],
      providersOfService: async () => many
    };

    const engine = new KnowledgeGraphRetrievalEngine(clock, graph);
    const result = await engine.search(
      query({
        intent: { ...query().intent, serviceIds: ["svc_1"] },
        limits: { ...DEFAULT_RETRIEVAL_LIMITS, perEngine: 2 }
      })
    );

    expect(result.truncated).toBe(true);
    if (result.outcome.status === "retrieved") expect(result.outcome.value).toHaveLength(2);
  });

  it("explains an item as structured signals, never prose", async () => {
    const graph: KnowledgeGraphProvider = {
      entity: async () => null,
      entities: async () =>
        new Map([
          [
            "biz_1",
            {
              id: "biz_1",
              type: "business",
              relationships: [],
              metadata: {
                name: "Plov Center",
                slug: "plov-center",
                categoryId: null,
                neighborhoodId: null,
                priceTier: null,
                capabilities: [],
                openingHours: [],
                verified: true
              },
              confidence: 0.9,
              updatedAt: NOW
            } as AnyGraphEntity
          ]
        ]),
      related: async () => [],
      providersOfService: async () => ["biz_1"]
    };

    const engine = new KnowledgeGraphRetrievalEngine(clock, graph);
    const result = await engine.search(query({ intent: { ...query().intent, serviceIds: ["svc_1"] } }));

    if (result.outcome.status !== "retrieved") throw new Error("expected items");

    const explanation = engine.explain(result.outcome.value[0]!);

    expect(explanation.reasonCodes.length).toBeGreaterThan(0);
    expect(explanation.contributingSignals.every((signal) => signal.key.startsWith("score."))).toBe(
      true
    );
    expect(explanation.sourceRank).toBe(5);
    expect(Object.keys(explanation)).not.toContain("text");
  });
});
