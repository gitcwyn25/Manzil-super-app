/**
 * Layer 2 (Marketplace Intelligence) — the Service summarizer.
 *
 * "Haircut → provided by 120 businesses" (doc 21) is a question about a
 * *service*, not about a package row. Packages are per provider, so the
 * marketplace-level identity of a service is its normalized name, and the
 * subject id encodes exactly that (`service-market:haircut`).
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type { ServiceSummary } from "./marketplace-intelligence.types";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository, type SummaryWriteResult } from "./summary.repository";
import {
  gapOf,
  valueOrNull,
  type IntelligenceGap
} from "./marketplace-intelligence.evidence";
import { computeServiceSummary } from "./marketplace.model";
import { FACT_SOURCE } from "./marketplace-intelligence.projection";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import { windowEndingAt } from "./marketplace-intelligence.statistics";

/** What one service summarization produced. */
export interface ServiceSummarizationResult {
  readonly serviceId: EntityId;
  readonly summary: ServiceSummary | null;
  readonly write: SummaryWriteResult | null;
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class ServiceSummarizerService {
  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async summarize(serviceId: EntityId): Promise<ServiceSummarizationResult> {
    const observations = await this.projection.serviceObservations(serviceId);
    const now = this.clock.now();

    if (!observations) {
      return { serviceId, summary: null, write: null, changed: false, gaps: [] };
    }

    const outcome = computeServiceSummary(observations, now);
    const summary = valueOrNull(outcome);
    const gaps = [gapOf("service_market", outcome)].filter(
      (gap): gap is IntelligenceGap => gap !== null
    );

    if (!summary) {
      return { serviceId, summary: null, write: null, changed: false, gaps };
    }

    const write = await this.summaries.write({
      slot: { kind: "service", subjectId: serviceId },
      value: summary,
      confidence: outcome.status === "computed" ? outcome.confidence : 0,
      sampleSize: observations.packages.length,
      window: windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour),
      source: FACT_SOURCE.merchantInput,
      computedAt: now
    });

    return { serviceId, summary, write, changed: write.outcome === "written", gaps };
  }
}
