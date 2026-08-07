/**
 * Layer 2 — the `MarketplaceIntelligenceProvider`.
 *
 * The marketplace-wide read surface: business and customer facts,
 * neighborhoods, services, demand, trends, and the relationship facts this
 * layer owns. Every method is a stored read.
 *
 * `relationships()` returns **substitution only**, and that is a deliberate
 * division of labour rather than an omission. Co-visit, co-booking and
 * sequential-visit patterns are *edges*, and edges belong to Layer 3 —
 * Epic 04's `InferRelationshipsJob` already derives them from the same rows
 * and stores them as `recommended_with` / `booked_together`. Recomputing them
 * here would give the platform two answers to one question, and the isolation
 * invariant forbids importing the graph to borrow its answer.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type {
  BusinessFactSummary,
  CustomerFactSummary,
  DemandSummary,
  MarketplaceIntelligenceProvider,
  NeighborhoodSummary,
  RelationshipFactSummary,
  ServiceSummary,
  TrendSummary
} from "./marketplace-intelligence.types";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { SummaryRepository } from "./summary.repository";
import type { StoredBusinessProfile } from "./business-summarizer.service";
import type { StoredCustomerProfile } from "./customer-summarizer.service";
import type { CampaignSummary } from "./campaign.model";
import type { DemandPrediction } from "./marketplace.model";
import { demandSubjectId } from "./marketplace-intelligence.slots";
import { TRACKED_TREND_METRICS, trendSubjectId } from "./trend-summarizer.service";

/** What the layer can honestly promise about persistence right now. */
export interface MarketplacePersistenceStatus {
  /** `memory` until M1 applies the `IntelligenceSummary` migration. */
  readonly backend: "memory" | "prisma";
  /** False while stored summaries live in process only. */
  readonly durable: boolean;
}

@Injectable()
export class MarketplaceIntelligenceService implements MarketplaceIntelligenceProvider {
  constructor(
    private readonly repository: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async businessFacts(businessId: EntityId): Promise<BusinessFactSummary | null> {
    const stored = await this.repository.read<StoredBusinessProfile>(
      { kind: "business", subjectId: businessId },
      this.clock.now()
    );

    return stored?.value.facts ?? null;
  }

  async customerFacts(customerId: EntityId): Promise<CustomerFactSummary | null> {
    const stored = await this.repository.read<StoredCustomerProfile>(
      { kind: "customer", subjectId: customerId },
      this.clock.now()
    );

    return stored?.value.facts ?? null;
  }

  async demand(
    serviceOrCategoryId: EntityId,
    neighborhoodId: EntityId | null
  ): Promise<DemandSummary | null> {
    const stored = await this.repository.read<DemandSummary>(
      { kind: "demand", subjectId: demandSubjectId(serviceOrCategoryId, neighborhoodId) },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  /**
   * The stored forecast, or null.
   *
   * Null is the answer in production today and the honest one: the model needs
   * eight weeks of history and forty observations, and refuses below that
   * rather than extrapolating. Callers wanting the reason read the
   * neighborhood profile's gaps.
   */
  async demandPrediction(
    serviceOrCategoryId: EntityId,
    neighborhoodId: EntityId | null
  ): Promise<DemandPrediction | null> {
    const stored = await this.repository.read<DemandPrediction>(
      {
        kind: "demand_prediction",
        subjectId: demandSubjectId(serviceOrCategoryId, neighborhoodId)
      },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  async neighborhood(neighborhoodId: EntityId): Promise<NeighborhoodSummary | null> {
    const stored = await this.repository.read<NeighborhoodSummary>(
      { kind: "neighborhood", subjectId: neighborhoodId },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  async service(serviceId: EntityId): Promise<ServiceSummary | null> {
    const stored = await this.repository.read<ServiceSummary>(
      { kind: "service", subjectId: serviceId },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  /** Every tracked metric of every named subject, in one store read. */
  async trends(subjectEntityIds: readonly EntityId[]): Promise<readonly TrendSummary[]> {
    const slots = subjectEntityIds.flatMap((entityId) =>
      TRACKED_TREND_METRICS.map((metric) => ({
        kind: "trend" as const,
        subjectId: trendSubjectId(metric, entityId)
      }))
    );

    const stored = await this.repository.readMany<TrendSummary>(slots, this.clock.now());
    return stored.map((record) => record.value);
  }

  async relationships(entityId: EntityId): Promise<readonly RelationshipFactSummary[]> {
    const stored = await this.repository.read<StoredBusinessProfile>(
      { kind: "business", subjectId: entityId },
      this.clock.now()
    );

    return stored?.value.relationships ?? [];
  }

  /** One business's campaign programme (owner voice, doc 23 §13). */
  async campaign(businessId: EntityId): Promise<CampaignSummary | null> {
    const stored = await this.repository.read<CampaignSummary>(
      { kind: "campaign", subjectId: businessId },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  /**
   * Whether a summary written here survives a restart.
   *
   * Exposed because it changes what an absence means: while `durable` is
   * false, a missing business profile may mean "this deployment restarted",
   * not "this business has never been summarized" — and a health check that
   * cannot say so is a health check that lies.
   */
  get persistence(): MarketplacePersistenceStatus {
    return { backend: this.repository.backend, durable: this.repository.durable };
  }
}
