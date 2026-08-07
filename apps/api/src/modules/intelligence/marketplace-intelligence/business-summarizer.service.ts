/**
 * Layer 2 (Marketplace Intelligence) — the Business summarizer.
 *
 * The first of the epic's seven, and the one the canonical event chain runs
 * through: `BusinessCreated → BusinessSummaryRequested → SummarizeBusinessJob
 * → BusinessSummaryCompleted`.
 *
 * It reads real rows, runs eight pure models over them, and **stores** the
 * result — doc 22's "stored summaries, not regeneration". Nothing here is
 * computed at question time; `BusinessIntelligenceService` reads what this
 * wrote.
 *
 * The stored artefact carries the gaps beside the knowledge. A business whose
 * health could not be computed does not get a fabricated health block and does
 * not get a silently missing one either: it gets `health: null` and a typed
 * `IntelligenceGap` saying which model refused, on how many observations, and
 * how many it needed.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { EntityId, IsoDateTime, MoneyAmount } from "../core";
import type {
  AlternativeBusiness,
  BusinessAspectAssessment,
  BusinessHealth,
  BusinessSummary,
  PeakHoursProfile,
  PopularService,
  SuitableExperience,
  TypicalCustomerProfile
} from "../business-intelligence";
import type { BusinessFeatures } from "../feature-store";
import type { BusinessFactSummary, RelationshipFactSummary } from "./marketplace-intelligence.types";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository, type SummaryWriteResult } from "./summary.repository";
import {
  gapOf,
  valueOrNull,
  type IntelligenceGap,
  type IntelligenceOutcome
} from "./marketplace-intelligence.evidence";
import {
  behaviourWindow,
  computeAlternatives,
  computeAspectSignals,
  computeBusinessFacts,
  computeBusinessHealth,
  computePeakHours,
  computePopularServices,
  computePopularity,
  computeRecommendedServices,
  computeSuitableExperiences,
  computeTypicalCustomers,
  type BusinessObservations,
  type RecommendedService
} from "./business.model";
import { substitutionFacts } from "./marketplace.model";
import { FACT_SOURCE, priceTierLevel } from "./marketplace-intelligence.projection";
import { countNoiseMentions, noiseLevelFrom, type AspectSignals } from "./review-signals";
import { clamp01, roundTo } from "./marketplace-intelligence.statistics";
import type { SummarySlot } from "./marketplace-intelligence.slots";

/**
 * The stored profile of one business — everything Epic 06 derives about a
 * provider, with its gaps.
 *
 * The frozen `BusinessSummary` is *assembled* from these parts on read rather
 * than stored a second time inside them. That is deserialization, not
 * regeneration: no model runs, no row is read, and a health block that refused
 * cannot reappear.
 */
export interface StoredBusinessProfile {
  readonly businessId: EntityId;
  readonly strengths: readonly BusinessAspectAssessment[];
  readonly weaknesses: readonly BusinessAspectAssessment[];
  readonly health: BusinessHealth | null;
  readonly popularServices: readonly PopularService[];
  readonly typicalCustomers: readonly TypicalCustomerProfile[];
  readonly peakHours: PeakHoursProfile | null;
  readonly suitableExperiences: readonly SuitableExperience[];
  readonly alternatives: readonly AlternativeBusiness[];
  readonly averageSpend: MoneyAmount | null;
  readonly facts: BusinessFactSummary;
  readonly recommendedServices: readonly RecommendedService[];
  readonly relationships: readonly RelationshipFactSummary[];
  /** Every model that refused, with the typed reason and the counts. */
  readonly gaps: readonly IntelligenceGap[];
  readonly updatedAt: IsoDateTime;
}

/** What one business summarization produced. */
export interface BusinessSummarizationResult {
  readonly businessId: EntityId;
  readonly profile: StoredBusinessProfile | null;
  readonly features: BusinessFeatures | null;
  readonly writes: readonly SummaryWriteResult[];
  /** True when any stored slot's knowledge actually changed. */
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class BusinessSummarizerService {
  private readonly logger = new Logger(BusinessSummarizerService.name);

  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  /**
   * Rebuilds and stores one business's profile and feature vector.
   *
   * Naturally convergent: the same rows derive the same profile, so a second
   * run writes an identical payload and the repository reports `unchanged` —
   * which is what keeps a nightly pass from announcing that every business
   * changed every night.
   */
  async summarize(businessId: EntityId): Promise<BusinessSummarizationResult> {
    const observations = await this.projection.businessObservations(businessId);

    if (!observations) {
      this.logger.debug(`no business row for ${businessId}; nothing to summarize`);
      return { businessId, profile: null, features: null, writes: [], changed: false, gaps: [] };
    }

    const now = this.clock.now();
    const context = await this.projection.peerContext(observations.business);

    const health = computeBusinessHealth(observations, now);
    const aspects = computeAspectSignals(observations, now);
    const peak = computePeakHours(observations, now);
    const typical = computeTypicalCustomers(observations, now);
    const popularServices = computePopularServices(observations, now);
    const alternatives = computeAlternatives(observations, context, now);
    const recommended = computeRecommendedServices(observations, context, now);
    const popularity = computePopularity(observations, context, now);

    const signals = valueOrNull(aspects);
    const facts = computeBusinessFacts(observations, now);
    const alternativeList = valueOrNull(alternatives) ?? [];

    const gaps = [
      gapOf("business_health", health),
      gapOf("business_strengths", aspects),
      gapOf("peak_hours", peak),
      gapOf("typical_customers", typical),
      gapOf("popular_services", popularServices),
      gapOf("alternative_businesses", alternatives),
      gapOf("recommended_services", recommended),
      gapOf("popularity", popularity)
    ].filter((gap): gap is IntelligenceGap => gap !== null);

    const profile: StoredBusinessProfile = {
      businessId,
      strengths: signals?.strengths ?? [],
      weaknesses: signals?.weaknesses ?? [],
      health: valueOrNull(health),
      popularServices: valueOrNull(popularServices) ?? [],
      typicalCustomers: valueOrNull(typical) ?? [],
      peakHours: valueOrNull(peak),
      suitableExperiences: signals ? computeSuitableExperiences(signals) : [],
      alternatives: alternativeList,
      averageSpend: facts.averageSpend?.value ?? null,
      facts,
      recommendedServices: valueOrNull(recommended) ?? [],
      relationships: substitutionFacts(
        businessId,
        alternativeList,
        behaviourWindow(now),
        now
      ),
      gaps,
      updatedAt: now
    };

    const features = this.featuresOf(observations, popularity, peak, signals, facts, now);

    const profileSlot: SummarySlot = { kind: "business", subjectId: businessId };
    const featureSlot: SummarySlot = { kind: "business_features", subjectId: businessId };

    const writes = [
      await this.summaries.write({
        slot: profileSlot,
        value: profile,
        // The profile's confidence is the health block's when there is one and
        // the aspect signal's otherwise — the strongest thing it can claim,
        // never an average of a model that ran and one that refused.
        confidence: confidenceOf(health, aspects),
        sampleSize: observations.reviews.length + observations.bookings.length,
        window: behaviourWindow(now),
        source: FACT_SOURCE.inference,
        computedAt: now
      }),
      await this.summaries.write({
        slot: featureSlot,
        value: features,
        confidence: confidenceOf(popularity, aspects),
        sampleSize: observations.reviews.length + observations.bookings.length,
        window: behaviourWindow(now),
        source: FACT_SOURCE.inference,
        computedAt: now
      })
    ];

    return {
      businessId,
      profile,
      features,
      writes,
      changed: writes.some((write) => write.outcome === "written"),
      gaps
    };
  }

  /**
   * Recomputes **only** the health block and patches the stored profile.
   *
   * `RefreshBusinessHealthJob` exists in the frozen catalog beside
   * `SummarizeBusinessJob` because health moves on a different clock: a
   * cancellation changes it today, while strengths change when reviews
   * accumulate over weeks. Re-running the whole summarizer under a job called
   * "refresh health" would read the peer set, re-extract every aspect and
   * re-derive every alternative to update one field.
   *
   * With no stored profile there is nothing to patch, so it falls back to a
   * full summarization — the honest behaviour, because the alternative is a
   * stored profile containing health and nothing else.
   */
  async refreshHealth(businessId: EntityId): Promise<BusinessSummarizationResult> {
    const stored = await this.summaries.read<StoredBusinessProfile>(
      { kind: "business", subjectId: businessId },
      this.clock.now()
    );

    if (!stored) return this.summarize(businessId);

    const observations = await this.projection.businessObservations(businessId);
    if (!observations) {
      return { businessId, profile: null, features: null, writes: [], changed: false, gaps: [] };
    }

    const now = this.clock.now();
    const health = computeBusinessHealth(observations, now);
    const gap = gapOf("business_health", health);

    const profile: StoredBusinessProfile = {
      ...stored.value,
      health: valueOrNull(health),
      // Replace this model's gap, keep every other model's untouched: this job
      // did not re-run them and must not claim to have.
      gaps: [
        ...stored.value.gaps.filter((existing) => existing.model !== "business_health"),
        ...(gap ? [gap] : [])
      ],
      updatedAt: now
    };

    const write = await this.summaries.write({
      slot: { kind: "business", subjectId: businessId },
      value: profile,
      confidence: health.status === "computed" ? health.confidence : stored.confidence,
      sampleSize: observations.reviews.length + observations.bookings.length,
      window: behaviourWindow(now),
      source: FACT_SOURCE.inference,
      computedAt: now
    });

    return {
      businessId,
      profile,
      features: null,
      writes: [write],
      changed: write.outcome === "written",
      gaps: gap ? [gap] : []
    };
  }

  /**
   * The doc 23 business feature vector.
   *
   * Four of the eight fields are permanently null on this schema and each says
   * why at its own line. They are null rather than zero because a feature
   * store is read by ranking: a zero family score would push a family-friendly
   * venue down a list, and "we do not know" must not act like "no".
   */
  private featuresOf(
    observations: BusinessObservations,
    popularity: IntelligenceOutcome<number>,
    peak: IntelligenceOutcome<PeakHoursProfile>,
    signals: AspectSignals | null,
    facts: BusinessFactSummary,
    now: IsoDateTime
  ): BusinessFeatures {
    const kids = signals?.strengths.find((assessment) => assessment.aspect === "kids_friendliness");
    const luxury = priceTierLevel(observations.business.priceTier);
    const noise = noiseLevelFrom(countNoiseMentions(observations.reviews));

    return {
      businessId: observations.business.id,
      popularity:
        popularity.status === "computed"
          ? {
              value: popularity.value,
              confidence: popularity.confidence,
              computedAt: now,
              source: FACT_SOURCE.inference
            }
          : null,
      // The Trust Engine is contract-only (Epic 03 froze `TrustScoreProvider`;
      // nothing implements it yet). Mirroring a score that does not exist would
      // be the one fabrication a feature store must never contain.
      trust: null,
      familyScore: kids
        ? {
            value: roundTo(clamp01((kids.score + 1) / 2)),
            confidence: kids.confidence,
            computedAt: now,
            source: FACT_SOURCE.review
          }
        : null,
      luxuryScore:
        luxury === null
          ? null
          : {
              value: luxury,
              // A restatement of what the owner typed: certain about the claim,
              // which is not the same as certain about the venue.
              confidence: 1,
              computedAt: now,
              source: FACT_SOURCE.merchantInput
            },
      averageVisitMinutes: facts.averageVisitMinutes
        ? {
            value: facts.averageVisitMinutes.value,
            confidence: facts.averageVisitMinutes.confidence,
            computedAt: now,
            source: FACT_SOURCE.booking
          }
        : null,
      peakHours:
        peak.status === "computed"
          ? {
              value: peak.value.windows,
              confidence: peak.confidence,
              computedAt: now,
              source: FACT_SOURCE.booking
            }
          : null,
      noise:
        noise === null
          ? null
          : {
              value: noise,
              confidence: 0.6,
              computedAt: now,
              source: FACT_SOURCE.review
            },
      // Price stability needs a price *history*; `BusinessPackage` keeps one
      // current price and an `updatedAt`, so the platform can see that a price
      // changed but never what it changed from.
      priceStability: null,
      computedAt: now
    };
  }
}

/** The strongest confidence among outcomes that actually computed; 0 if none. */
function confidenceOf(...outcomes: readonly IntelligenceOutcome<unknown>[]): number {
  const confidences = outcomes
    .filter(
      (outcome): outcome is Extract<IntelligenceOutcome<unknown>, { status: "computed" }> =>
        outcome.status === "computed"
    )
    .map((outcome) => outcome.confidence);

  return confidences.length === 0 ? 0 : Math.max(...confidences);
}

/**
 * Assembles the frozen `BusinessSummary` from a stored profile.
 *
 * Returns null when health is absent, because the contract has no nullable
 * health and inventing one is exactly what this epic refuses to do. Callers
 * that want the partial knowledge read the profile, which is why the profile
 * is what gets stored.
 */
export function assembleBusinessSummary(
  profile: StoredBusinessProfile
): BusinessSummary | null {
  if (!profile.health || !profile.peakHours) return null;

  return {
    businessId: profile.businessId,
    strengths: profile.strengths,
    weaknesses: profile.weaknesses,
    health: profile.health,
    popularServices: profile.popularServices,
    typicalCustomers: profile.typicalCustomers,
    peakHours: profile.peakHours,
    suitableExperiences: profile.suitableExperiences,
    alternatives: profile.alternatives,
    averageSpend: profile.averageSpend,
    updatedAt: profile.updatedAt
  };
}
