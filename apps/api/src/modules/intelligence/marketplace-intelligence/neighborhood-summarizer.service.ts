/**
 * Layer 2 (Marketplace Intelligence) — the Neighborhood summarizer.
 *
 * A neighborhood is the `(city, district)` pair carried by business rows; no
 * table owns one. So the subject id is derived and reversible, byte-identical
 * to the knowledge graph's — the two layers name the same place without one
 * importing the other.
 *
 * Stores the `NeighborhoodSummary` and the `NeighborhoodFeatures` vector.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";
import type { NeighborhoodFeatures } from "../feature-store";
import type { NeighborhoodSummary } from "./marketplace-intelligence.types";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository, type SummaryWriteResult } from "./summary.repository";
import {
  gapOf,
  valueOrNull,
  type IntelligenceGap
} from "./marketplace-intelligence.evidence";
import {
  computeDemand,
  computeDemandPrediction,
  computeNeighborhoodSummary,
  computeTrend,
  type DemandPrediction,
  type NeighborhoodObservations
} from "./marketplace.model";
import type { DemandSummary } from "./marketplace-intelligence.types";
import { FACT_SOURCE, isCanceledBooking } from "./marketplace-intelligence.projection";
import { dayPartShares, roundTo, unique, windowEndingAt } from "./marketplace-intelligence.statistics";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import { demandSubjectId, type SummarySlot } from "./marketplace-intelligence.slots";

/**
 * Ceiling on categories one district job measures demand for.
 *
 * A district has a handful of categories today; the cap is what stops a
 * district job from becoming a scan of the category tree when it does not.
 */
export const MAX_DEMAND_CATEGORIES = 10;

/** What one neighborhood summarization produced. */
export interface NeighborhoodSummarizationResult {
  readonly neighborhoodId: EntityId;
  readonly summary: NeighborhoodSummary | null;
  readonly features: NeighborhoodFeatures | null;
  readonly demand: readonly DemandSummary[];
  readonly predictions: readonly DemandPrediction[];
  readonly writes: readonly SummaryWriteResult[];
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class NeighborhoodSummarizerService {
  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async summarize(neighborhoodId: EntityId): Promise<NeighborhoodSummarizationResult> {
    const observations = await this.projection.neighborhoodObservations(neighborhoodId);
    const now = this.clock.now();

    if (!observations) {
      return {
        neighborhoodId,
        summary: null,
        features: null,
        demand: [],
        predictions: [],
        writes: [],
        changed: false,
        gaps: []
      };
    }

    // Demand first: "which services is this district underserved in?" is a
    // demand question, and the neighborhood summary must not answer it a
    // second, different way.
    const measured = await this.measureDemand(observations, now);

    const outcome = computeNeighborhoodSummary(observations, now, measured.underservedServiceIds);
    const summary = valueOrNull(outcome);
    const gaps = [gapOf("neighborhood_character", outcome), ...measured.gaps].filter(
      (gap): gap is IntelligenceGap => gap !== null
    );

    if (!summary) {
      return {
        neighborhoodId,
        summary: null,
        features: null,
        demand: measured.demand,
        predictions: measured.predictions,
        writes: measured.writes,
        changed: measured.writes.some((write) => write.outcome === "written"),
        gaps
      };
    }

    const features = this.featuresOf(observations, now);
    const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
    const confidence = outcome.status === "computed" ? outcome.confidence : 0;

    const summarySlot: SummarySlot = { kind: "neighborhood", subjectId: neighborhoodId };
    const featureSlot: SummarySlot = { kind: "neighborhood_features", subjectId: neighborhoodId };

    const writes = [
      ...measured.writes,
      await this.summaries.write({
        slot: summarySlot,
        value: summary,
        confidence,
        sampleSize: observations.businesses.length,
        window,
        source: FACT_SOURCE.inference,
        computedAt: now
      }),
      await this.summaries.write({
        slot: featureSlot,
        value: features,
        confidence,
        sampleSize: observations.businesses.length,
        window,
        source: FACT_SOURCE.inference,
        computedAt: now
      })
    ];

    return {
      neighborhoodId,
      summary,
      features,
      demand: measured.demand,
      predictions: measured.predictions,
      writes,
      changed: writes.some((write) => write.outcome === "written"),
      gaps
    };
  }

  /**
   * Demand pressure and the forecast, per category present in this district.
   *
   * Both are stored under `demand` / `demand_prediction` slots keyed
   * `category:<slug>@<neighborhoodId>`, so `MarketplaceIntelligenceProvider.
   * demand()` is a stored read like every other question this layer answers.
   *
   * A category whose demand refuses has its slot **forgotten**, not left
   * holding last week's pressure: an old answer to "is this underserved?" is
   * exactly the answer somebody would open a business on.
   */
  private async measureDemand(
    observations: NeighborhoodObservations,
    now: IsoDateTime
  ): Promise<{
    readonly demand: readonly DemandSummary[];
    readonly predictions: readonly DemandPrediction[];
    readonly underservedServiceIds: readonly EntityId[];
    readonly writes: readonly SummaryWriteResult[];
    readonly gaps: readonly IntelligenceGap[];
  }> {
    const slugs = unique(
      observations.businesses
        .map((business) => business.categorySlug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    ).slice(0, MAX_DEMAND_CATEGORIES);

    const demand: DemandSummary[] = [];
    const predictions: DemandPrediction[] = [];
    const underservedServiceIds: EntityId[] = [];
    const writes: SummaryWriteResult[] = [];
    const gaps: IntelligenceGap[] = [];

    for (const slug of slugs) {
      const input = await this.projection.demandObservations(slug, observations.key.district);
      const subjectId = demandSubjectId(input.serviceOrCategoryId, observations.neighborhoodId);

      const pressure = computeDemand(input, now);
      const forecast = computeDemandPrediction(input, now);

      const pressureGap = gapOf("demand_pressure", pressure);
      const forecastGap = gapOf("demand_prediction", forecast);
      if (pressureGap) gaps.push(pressureGap);
      if (forecastGap) gaps.push(forecastGap);

      if (pressure.status === "computed") {
        demand.push(pressure.value);
        if (pressure.value.pressure.value > 1) {
          underservedServiceIds.push(input.serviceOrCategoryId);
        }

        writes.push(
          await this.summaries.write({
            slot: { kind: "demand", subjectId },
            value: pressure.value,
            confidence: pressure.confidence,
            sampleSize: pressure.evidence.observations,
            window: pressure.value.window,
            source: FACT_SOURCE.inference,
            computedAt: now
          })
        );
      } else {
        await this.summaries.forget({ kind: "demand", subjectId });
      }

      if (forecast.status === "computed") {
        predictions.push(forecast.value);
        writes.push(
          await this.summaries.write({
            slot: { kind: "demand_prediction", subjectId },
            value: forecast.value,
            confidence: forecast.confidence,
            sampleSize: forecast.evidence.observations,
            window: forecast.value.horizon,
            source: FACT_SOURCE.inference,
            computedAt: now
          })
        );
      } else {
        await this.summaries.forget({ kind: "demand_prediction", subjectId });
      }
    }

    return { demand, predictions, underservedServiceIds, writes, gaps };
  }

  /**
   * The doc 23 neighborhood feature vector.
   *
   * Three of six are null and stay null until something records them:
   *
   * - **parking** and **walkability** are properties of streets, and Manzil
   *   stores addresses, not streets. There is no first-party signal at all —
   *   not a thin one, none — so a number here would be invented rather than
   *   uncertain.
   * - **familyFriendliness** is genuinely derivable, but only by aggregating
   *   the `kids_friendliness` aspect across the district's businesses, which
   *   means reading every member's stored profile. That read is honest and
   *   cheap the moment summaries are durable (M1); until then it would mean
   *   re-summarizing the district's businesses inside a district job, and a
   *   summarizer that recomputes other summarizers is how a nightly pass
   *   becomes quadratic.
   */
  private featuresOf(
    observations: NeighborhoodObservations,
    now: IsoDateTime
  ): NeighborhoodFeatures {
    const instants = [
      ...observations.bookings
        .filter((booking) => !isCanceledBooking(booking.status))
        .map((booking) => booking.startsAt),
      ...observations.visits.map((visit) => visit.occurredAt)
    ];

    const parts = dayPartShares(instants);
    const confidence = instants.length === 0 ? 0 : 0.6;

    const demand = computeTrend(
      {
        subjectEntityId: observations.neighborhoodId,
        metric: "searches",
        instants: observations.searches.map((row) => row.createdAt)
      },
      now
    );

    return {
      neighborhoodId: observations.neighborhoodId,
      morningActivity: parts
        ? {
            value: roundTo(parts.morningShare),
            confidence,
            computedAt: now,
            source: FACT_SOURCE.visit
          }
        : null,
      nightActivity: parts
        ? {
            value: roundTo(parts.nightShare + parts.eveningShare),
            confidence,
            computedAt: now,
            source: FACT_SOURCE.visit
          }
        : null,
      parkingAvailability: null,
      familyFriendliness: null,
      walkability: null,
      demandTrend:
        demand.status === "computed"
          ? {
              value: demand.value.direction,
              confidence: demand.confidence,
              computedAt: now,
              source: FACT_SOURCE.inference
            }
          : null,
      computedAt: now
    };
  }
}
