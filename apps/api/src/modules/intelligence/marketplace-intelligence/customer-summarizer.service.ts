/**
 * Layer 2 (Marketplace Intelligence) — the Customer summarizer.
 *
 * Doc 22: "every customer a summary updated after each experience". This
 * service stores three artefacts per person — the analytical `CustomerSummary`
 * the reasoning layer reads, the `MemorySnapshot` Layer 4 loads into working
 * memory, and the `CustomerFeatures` vector search ranking and targeting share
 * — plus `CustomerHealth` and the gaps.
 *
 * `CustomerSummary` can be produced where `BusinessHealth` cannot, and the
 * reason is in the contracts: every pattern inside it is nullable and carries
 * its own confidence, so a person with one visit gets a summary that honestly
 * says "confidence 0" about the things one visit cannot show.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";
import type { CustomerSummary, MemorySnapshot } from "../customer-intelligence";
import type { CustomerFeatures } from "../feature-store";
import type { CustomerFactSummary } from "./marketplace-intelligence.types";
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
  computeActivityPattern,
  computeBirthdayProbability,
  computeBudgetPreference,
  computeCuisineRanking,
  computeCustomerFacts,
  computeCustomerHealth,
  computeCustomerSummary,
  computeMemorySnapshot,
  customerWindow,
  activityRadiusKm,
  type CustomerHealth,
  type CustomerObservations
} from "./customer.model";
import { FACT_SOURCE } from "./marketplace-intelligence.projection";
import type { SummarySlot } from "./marketplace-intelligence.slots";

/** The stored profile of one customer, with its gaps. */
export interface StoredCustomerProfile {
  readonly customerId: EntityId;
  readonly summary: CustomerSummary;
  readonly snapshot: MemorySnapshot;
  readonly health: CustomerHealth | null;
  readonly facts: CustomerFactSummary;
  readonly gaps: readonly IntelligenceGap[];
  readonly updatedAt: IsoDateTime;
}

/** What one customer summarization produced. */
export interface CustomerSummarizationResult {
  readonly customerId: EntityId;
  readonly profile: StoredCustomerProfile | null;
  readonly features: CustomerFeatures | null;
  readonly writes: readonly SummaryWriteResult[];
  readonly changed: boolean;
  readonly gaps: readonly IntelligenceGap[];
}

@Injectable()
export class CustomerSummarizerService {
  constructor(
    private readonly projection: MarketplaceProjectionRepository,
    private readonly summaries: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  /** Rebuilds and stores one person's profile, snapshot and feature vector. */
  async summarize(customerId: EntityId): Promise<CustomerSummarizationResult> {
    const observations = await this.projection.customerObservations(customerId);
    const now = this.clock.now();

    const summaryOutcome = computeCustomerSummary(observations, now);
    const summary = valueOrNull(summaryOutcome);

    if (!summary) {
      // Nobody by that id has a CRM row or any activity. That is not a thin
      // customer, it is not a customer — and a stored empty profile would make
      // the next reader think the platform had looked and found nothing.
      return {
        customerId,
        profile: null,
        features: null,
        writes: [],
        changed: false,
        gaps: [gapOf("customer_health", summaryOutcome)].filter(
          (gap): gap is IntelligenceGap => gap !== null
        )
      };
    }

    const health = computeCustomerHealth(observations, now);
    const gaps = [gapOf("customer_health", health)].filter(
      (gap): gap is IntelligenceGap => gap !== null
    );

    const profile: StoredCustomerProfile = {
      customerId,
      summary,
      snapshot: computeMemorySnapshot(summary, observations, now),
      health: valueOrNull(health),
      facts: computeCustomerFacts(observations, now),
      gaps,
      updatedAt: now
    };

    const features = this.featuresOf(observations, now);
    const profileSlot: SummarySlot = { kind: "customer", subjectId: customerId };
    const featureSlot: SummarySlot = { kind: "customer_features", subjectId: customerId };
    const sampleSize = observations.visits.length + observations.bookings.length;

    const writes = [
      await this.summaries.write({
        slot: profileSlot,
        value: profile,
        confidence: health.status === "computed" ? health.confidence : summary.behavior.confidence,
        sampleSize,
        window: customerWindow(now),
        source: FACT_SOURCE.inference,
        computedAt: now
      }),
      await this.summaries.write({
        slot: featureSlot,
        value: features,
        confidence: summary.behavior.confidence,
        sampleSize,
        window: customerWindow(now),
        source: FACT_SOURCE.inference,
        computedAt: now
      })
    ];

    return {
      customerId,
      profile,
      features,
      writes,
      changed: writes.some((write) => write.outcome === "written"),
      gaps
    };
  }

  /**
   * The doc 23 customer feature vector.
   *
   * `birthdayProbability` is the Marketplace Brain's "who is likely planning a
   * birthday next month", and it is computed from the customer's **own
   * recorded birthday** — never inferred from behaviour. With no birthday on
   * file it is null, not a small number: "we do not know when your birthday is"
   * and "your birthday is probably not soon" are different statements, and a
   * campaign would act on them differently.
   */
  private featuresOf(observations: CustomerObservations, now: IsoDateTime): CustomerFeatures {
    const budget = computeBudgetPreference(observations);
    const radius = activityRadiusKm(observations);
    const cuisines = computeCuisineRanking(observations);
    const weekday = computeActivityPattern(observations);
    const weekend = computeActivityPattern(observations, true);
    const birthday = computeBirthdayProbability(observations, now);
    const confidence = observations.visits.length === 0 ? 0 : 0.7;

    return {
      customerId: observations.customerId,
      budgetPreference: budget
        ? { value: budget, confidence, computedAt: now, source: FACT_SOURCE.visit }
        : null,
      travelRadiusKm:
        radius === null
          ? null
          : { value: radius, confidence, computedAt: now, source: FACT_SOURCE.inference },
      cuisineRanking: cuisines
        ? { value: cuisines, confidence, computedAt: now, source: FACT_SOURCE.inference }
        : null,
      activityPattern: weekday
        ? { value: weekday, confidence, computedAt: now, source: FACT_SOURCE.visit }
        : null,
      weekendBehavior: weekend
        ? { value: weekend, confidence, computedAt: now, source: FACT_SOURCE.visit }
        : null,
      birthdayProbability:
        birthday === null
          ? null
          : {
              value: birthday,
              // A date somebody gave us, and a calendar. Nothing is inferred,
              // so the confidence is the confidence of the calendar.
              confidence: 1,
              computedAt: now,
              source: FACT_SOURCE.merchantInput
            },
      computedAt: now
    };
  }
}
