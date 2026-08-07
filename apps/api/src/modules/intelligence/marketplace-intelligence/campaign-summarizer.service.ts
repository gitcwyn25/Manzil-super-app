/**
 * Layer 2 (Marketplace Intelligence) — the Campaign summarizer.
 *
 * Subject is the business, not the campaign: an owner asks "is my messaging
 * working?", and the answer spans every automation they run. Per-trigger
 * performance is carried inside the summary so the question "which one is
 * working?" is answerable without a second slot.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository, type SummaryWriteResult } from "./summary.repository";
import {
  gapOf,
  valueOrNull,
  type IntelligenceGap
} from "./marketplace-intelligence.evidence";
import { computeCampaignSummary, type CampaignSummary } from "./campaign.model";
import { FACT_SOURCE } from "./marketplace-intelligence.projection";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import { windowEndingAt } from "./marketplace-intelligence.statistics";

/** What one campaign summarization produced. */
export interface CampaignSummarizationResult {
  readonly businessId: EntityId;
  readonly summary: CampaignSummary | null;
  readonly write: SummaryWriteResult | null;
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class CampaignSummarizerService {
  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async summarize(businessId: EntityId): Promise<CampaignSummarizationResult> {
    const observations = await this.projection.campaignObservations(businessId);
    const now = this.clock.now();

    const outcome = computeCampaignSummary(observations, now);
    const summary = valueOrNull(outcome);
    const gaps = [gapOf("campaign_performance", outcome)].filter(
      (gap): gap is IntelligenceGap => gap !== null
    );

    if (!summary) {
      return { businessId, summary: null, write: null, changed: false, gaps };
    }

    const write = await this.summaries.write({
      slot: { kind: "campaign", subjectId: businessId },
      value: summary,
      confidence: outcome.status === "computed" ? outcome.confidence : 0,
      sampleSize: outcome.evidence.observations,
      window: windowEndingAt(now, OBSERVATION_WINDOW_DAYS.campaign),
      source: FACT_SOURCE.campaign,
      computedAt: now
    });

    return { businessId, summary, write, changed: write.outcome === "written", gaps };
  }
}
