/**
 * Layer 2 (Marketplace Intelligence) — the Workspace summarizer.
 *
 * The seventh summarizer. It exists, it is wired, it is scheduled, and it
 * **always refuses**, because the relational schema has no Workspace model at
 * all. Nothing is stored: a stored empty workspace summary would tell the next
 * reader that the platform looked and found an empty plan, which is a
 * different and false statement.
 *
 * The refusal is `knowledge_missing`, not `marketplace_sparse` — see
 * `workspace.model.ts` for why that distinction is load-bearing rather than
 * pedantic.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { EntityId } from "../core";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import type { SummaryWriteResult } from "./summary.repository";
import { gapOf, type IntelligenceGap } from "./marketplace-intelligence.evidence";
import { computeWorkspaceSummary, type WorkspaceSummary } from "./workspace.model";

/** What one workspace summarization produced — today, always a gap. */
export interface WorkspaceSummarizationResult {
  readonly workspaceId: EntityId;
  readonly summary: WorkspaceSummary | null;
  readonly write: SummaryWriteResult | null;
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class WorkspaceSummarizerService {
  private readonly logger = new Logger(WorkspaceSummarizerService.name);

  constructor(
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async summarize(workspaceId: EntityId): Promise<WorkspaceSummarizationResult> {
    const outcome = computeWorkspaceSummary(workspaceId, this.clock.now());
    const gaps = [gapOf("workspace_plan", outcome)].filter(
      (gap): gap is IntelligenceGap => gap !== null
    );

    this.logger.debug(
      `workspace ${workspaceId} cannot be summarized: no Workspace model exists (Epic 08)`
    );

    return { workspaceId, summary: null, write: null, changed: false, gaps };
  }
}
