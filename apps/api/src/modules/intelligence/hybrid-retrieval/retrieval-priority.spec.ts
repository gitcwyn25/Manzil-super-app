import { CONTEXT_ASSEMBLY_PRIORITY } from "../orchestrator-contracts/context-window.contract";
import { RETRIEVAL_PRIORITY } from "../memory-engine";
import {
  ENGINE_CONTEXT_SECTION,
  ENGINE_RETRIEVAL_ORDER,
  ENGINE_RETRIEVAL_SOURCE,
  RETRIEVAL_SOURCE_DISCREPANCY,
  SECTIONS_WITHOUT_ENGINE,
  UNRANKED_RETRIEVAL_ENGINES,
  contextSectionRank,
  engineRank,
  enginesInRetrievalOrder,
  frozenSourceRank,
  isEngineAmendmentRanked,
  retrievalSourceRank
} from "./retrieval-priority";

/**
 * The whole architecture of Epic 07 is an ordering claim, and an ordering
 * claim that lives in prose drifts. These tests are the tripwire: they assert
 * that this module's engine order *agrees with the frozen constants position
 * for position* wherever the AI Bible names a source, and that the one place it
 * cannot is declared rather than silently invented.
 *
 * Epic 05 wrote the same spec one layer down (`memory.priority.spec.ts`).
 */
describe("engine retrieval order — agreement with the frozen contracts", () => {
  it("ranks every one of the seven engines exactly once", () => {
    expect(new Set(ENGINE_RETRIEVAL_ORDER).size).toBe(ENGINE_RETRIEVAL_ORDER.length);
    expect(ENGINE_RETRIEVAL_ORDER).toHaveLength(7);
  });

  it("maps every engine to a frozen source or an explicit null", () => {
    for (const engineId of ENGINE_RETRIEVAL_ORDER) {
      expect(ENGINE_RETRIEVAL_SOURCE).toHaveProperty(engineId);
    }
  });

  it("is monotone in the frozen RETRIEVAL_PRIORITY — the load-bearing assertion", () => {
    const ranked = ENGINE_RETRIEVAL_ORDER.map(frozenSourceRank).filter(
      (rank): rank is number => rank !== null
    );

    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index]!).toBeGreaterThanOrEqual(ranked[index - 1]!);
    }
  });

  it("puts the workspace first, because the user's own plan outranks everything", () => {
    expect(ENGINE_RETRIEVAL_ORDER[0]).toBe("workspace");
    expect(frozenSourceRank("workspace")).toBe(0);
    expect(RETRIEVAL_PRIORITY[0]).toBe("workspace_timeline");
  });

  it("puts semantic last, which is what makes vector search optional (ADR-006)", () => {
    expect(ENGINE_RETRIEVAL_ORDER[ENGINE_RETRIEVAL_ORDER.length - 1]).toBe("semantic");
    expect(ENGINE_RETRIEVAL_SOURCE.semantic).toBe("general_llm_knowledge");
    expect(frozenSourceRank("semantic")).toBe(RETRIEVAL_PRIORITY.length - 1);
  });

  it("ranks memory above every business-knowledge engine — memory outranks embeddings", () => {
    expect(engineRank("memory")).toBeLessThan(engineRank("business"));
    expect(engineRank("memory")).toBeLessThan(engineRank("knowledge_graph"));
    expect(engineRank("memory")).toBeLessThan(engineRank("semantic"));
  });

  it("ranks structured knowledge above semantic similarity", () => {
    expect(engineRank("knowledge_graph")).toBeLessThan(engineRank("semantic"));
    expect(frozenSourceRank("knowledge_graph")!).toBeLessThan(frozenSourceRank("semantic")!);
  });

  it("declares the one engine the frozen list cannot rank, rather than inventing a slot", () => {
    expect(UNRANKED_RETRIEVAL_ENGINES).toEqual(["marketplace"]);
    expect(ENGINE_RETRIEVAL_SOURCE.marketplace).toBeNull();
    expect(frozenSourceRank("marketplace")).toBeNull();
    expect(isEngineAmendmentRanked("marketplace")).toBe(true);
  });

  it("reports no amendment for the six engines the Bible does name", () => {
    for (const engineId of ENGINE_RETRIEVAL_ORDER) {
      if (engineId === "marketplace") continue;
      expect(isEngineAmendmentRanked(engineId)).toBe(false);
    }
  });

  it("keeps the discrepancy inspectable as data, not folklore", () => {
    expect(RETRIEVAL_SOURCE_DISCREPANCY.unrankedEngines).toEqual(["marketplace"]);
    expect(RETRIEVAL_SOURCE_DISCREPANCY.unservedSources).toContain("recent_activity");
  });

  it("resolves a source's rank straight from the frozen tuple", () => {
    expect(retrievalSourceRank("mission_context")).toBe(1);
    expect(retrievalSourceRank("persistent_preferences")).toBe(2);
    expect(retrievalSourceRank(null)).toBeNull();
  });

  it("enumerates engines in the binding order", () => {
    expect(enginesInRetrievalOrder()).toBe(ENGINE_RETRIEVAL_ORDER);
  });
});

describe("context section mapping — the second, different order", () => {
  it("maps every engine to a section in the frozen assembly priority", () => {
    for (const engineId of ENGINE_RETRIEVAL_ORDER) {
      const section = ENGINE_CONTEXT_SECTION[engineId];
      expect(CONTEXT_ASSEMBLY_PRIORITY).toContain(section);
    }
  });

  it("agrees with retrieval priority at both ends and only there", () => {
    expect(ENGINE_CONTEXT_SECTION.workspace).toBe(CONTEXT_ASSEMBLY_PRIORITY[0]);
    expect(ENGINE_CONTEXT_SECTION.semantic).toBe(
      CONTEXT_ASSEMBLY_PRIORITY[CONTEXT_ASSEMBLY_PRIORITY.length - 1]
    );
  });

  it("declares the sections no engine fills instead of leaving them to be discovered", () => {
    expect(SECTIONS_WITHOUT_ENGINE).toEqual(["history", "conversation"]);

    const filled = new Set<string>(Object.values(ENGINE_CONTEXT_SECTION));
    for (const section of SECTIONS_WITHOUT_ENGINE) {
      expect(filled.has(section)).toBe(false);
    }
  });

  it("ranks sections by the frozen assembly priority, truncating from the end", () => {
    expect(contextSectionRank("workspace")).toBe(0);
    expect(contextSectionRank("llm")).toBe(CONTEXT_ASSEMBLY_PRIORITY.length - 1);
    expect(contextSectionRank("memory")).toBeLessThan(contextSectionRank("summaries"));
  });
});
