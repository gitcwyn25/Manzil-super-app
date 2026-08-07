/**
 * Layer 2 (Marketplace Intelligence) — the Trend summarizer.
 *
 * The only summarizer whose subject is a *pair* — one entity and one metric —
 * so its slot subject is `<metric>@<entityId>`. Storing bookings-momentum and
 * views-momentum in one slot would have the second overwrite the first, and
 * they answer different questions.
 *
 * Trends have the shortest TTL in the module (six hours). A stale business
 * profile is merely old; a stale trend is actively misleading, because a trend
 * is a claim *about change*.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type { TrendSummary } from "./marketplace-intelligence.types";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository, type SummaryWriteResult } from "./summary.repository";
import {
  gapOf,
  valueOrNull,
  type IntelligenceGap
} from "./marketplace-intelligence.evidence";
import { computeTrend } from "./marketplace.model";
import { FACT_SOURCE } from "./marketplace-intelligence.projection";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import { precedingWindow, windowEndingAt } from "./marketplace-intelligence.statistics";

/** The metrics this summarizer refreshes on a schedule. */
export const TRACKED_TREND_METRICS: readonly TrendSummary["metric"][] = [
  "bookings",
  "views",
  "reviews",
  "searches"
];

/** Slot subject for one `(metric, entity)` pair. */
export function trendSubjectId(metric: TrendSummary["metric"], entityId: EntityId): EntityId {
  return `${metric}@${entityId}`;
}

/** Recovers the pair from a trend subject id. */
export function parseTrendSubjectId(
  subjectId: EntityId
): { readonly metric: string; readonly entityId: EntityId } | null {
  const at = subjectId.indexOf("@");
  if (at <= 0 || at === subjectId.length - 1) return null;

  return { metric: subjectId.slice(0, at), entityId: subjectId.slice(at + 1) };
}

/** What one trend refresh produced. */
export interface TrendSummarizationResult {
  readonly subjectEntityId: EntityId;
  readonly trends: readonly TrendSummary[];
  readonly writes: readonly SummaryWriteResult[];
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class TrendSummarizerService {
  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  /** Refreshes every tracked metric for one subject. */
  async summarize(
    subjectEntityId: EntityId,
    metrics: readonly TrendSummary["metric"][] = TRACKED_TREND_METRICS
  ): Promise<TrendSummarizationResult> {
    const now = this.clock.now();
    const current = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.trendHalf);
    const span = { start: precedingWindow(current).start, end: current.end };

    const trends: TrendSummary[] = [];
    const writes: SummaryWriteResult[] = [];
    const gaps: IntelligenceGap[] = [];

    for (const metric of metrics) {
      const observations = await this.projection.trendObservations(subjectEntityId, metric);
      const outcome = computeTrend(observations, now);
      const gap = gapOf("trend", outcome);

      if (gap) {
        gaps.push(gap);
        // A metric that cannot be computed is not stored. Leaving yesterday's
        // trend in place while today's refuses would serve a claim about
        // change that the current data does not support.
        await this.summaries.forget({
          kind: "trend",
          subjectId: trendSubjectId(metric, subjectEntityId)
        });
        continue;
      }

      const trend = valueOrNull(outcome);
      if (!trend) continue;

      trends.push(trend);
      writes.push(
        await this.summaries.write({
          slot: { kind: "trend", subjectId: trendSubjectId(metric, subjectEntityId) },
          value: trend,
          confidence: outcome.status === "computed" ? outcome.confidence : 0,
          sampleSize: outcome.evidence.observations,
          window: span,
          source: FACT_SOURCE.inference,
          computedAt: now
        })
      );
    }

    return {
      subjectEntityId,
      trends,
      writes,
      changed: writes.some((write) => write.outcome === "written"),
      gaps
    };
  }
}
