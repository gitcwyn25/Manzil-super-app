import { WorkspaceSummarizerService } from "./workspace-summarizer.service";
import { computeWorkspaceSummary, WORKSPACE_MISSING_KEY } from "./workspace.model";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";

const NOW = "2026-08-07T09:00:00.000Z";

const clock: MarketplaceClock = { now: () => NOW, newId: () => "id_1" };

describe("the workspace summarizer", () => {
  it("refuses with knowledge_missing, never with sparsity", async () => {
    const summarizer = new WorkspaceSummarizerService(clock);

    const result = await summarizer.summarize("wsp_1");

    expect(result.summary).toBeNull();
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]?.failure.error).toEqual({
      kind: "knowledge_missing",
      entityId: "wsp_1",
      missingKey: WORKSPACE_MISSING_KEY
    });

    // Sparsity means "grow and ask again"; this will never be fixed by growth,
    // so a scheduler must not retry it forever.
    expect(result.gaps[0]?.failure.retryable).toBe(false);
  });

  it("stores nothing — an empty stored summary would say we looked and found a plan", async () => {
    const summarizer = new WorkspaceSummarizerService(clock);

    const result = await summarizer.summarize("wsp_1");

    expect(result.write).toBeNull();
    expect(result.changed).toBe(false);
  });

  it("returns the same outcome shape every other model returns", () => {
    const outcome = computeWorkspaceSummary("wsp_1", NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.evidence.observations).toBe(0);
    expect(outcome.failure.occurredAt).toBe(NOW);
  });
});
