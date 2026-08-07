/**
 * Layer 2 — the `FeatureStoreProvider`.
 *
 * Doc 23's first-class component: derived facts **computed once and reused
 * everywhere** — search ranking, recommendations, Gurman, dashboards,
 * targeting, analytics all read the same features instead of each recomputing
 * its own.
 *
 * The frozen contract has deliberately **no `set`**, and this implementation
 * honours that: it is read-only. Feature vectors are written by the
 * summarizers, which are only ever entered through an AI Job — so a service
 * cannot sneak a feature in without the pipeline's provenance discipline, and
 * no method here would let it.
 *
 * Features share the summary store rather than owning a table. A feature
 * vector *is* a summary of a different kind: same `(kind, subject)` slot, same
 * provenance quartet, same freshness policy, same job-only write path. A
 * second table would duplicate the lifecycle without adding a distinction any
 * code makes.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type {
  BusinessFeatures,
  CustomerFeatures,
  FeatureStoreProvider,
  NeighborhoodFeatures
} from "../feature-store";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { SummaryRepository, type StoredSummary } from "./summary.repository";

@Injectable()
export class FeatureStoreService implements FeatureStoreProvider {
  constructor(
    private readonly repository: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async businessFeatures(businessId: EntityId): Promise<BusinessFeatures | null> {
    return (await this.storedBusinessFeatures(businessId))?.value ?? null;
  }

  async customerFeatures(customerId: EntityId): Promise<CustomerFeatures | null> {
    const stored = await this.repository.read<CustomerFeatures>(
      { kind: "customer_features", subjectId: customerId },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  async neighborhoodFeatures(neighborhoodId: EntityId): Promise<NeighborhoodFeatures | null> {
    const stored = await this.repository.read<NeighborhoodFeatures>(
      { kind: "neighborhood_features", subjectId: neighborhoodId },
      this.clock.now()
    );

    return stored?.value ?? null;
  }

  /**
   * The business vector with its freshness envelope.
   *
   * Exposed beside the frozen accessor because a ranking pass legitimately
   * wants to know that every feature it is weighing was computed six days ago
   * — and the frozen signature has nowhere to say so.
   */
  storedBusinessFeatures(
    businessId: EntityId
  ): Promise<StoredSummary<BusinessFeatures> | null> {
    return this.repository.read<BusinessFeatures>(
      { kind: "business_features", subjectId: businessId },
      this.clock.now()
    );
  }

  /** Several business vectors in one store read. */
  async businessFeaturesMany(
    businessIds: readonly EntityId[]
  ): Promise<ReadonlyMap<EntityId, BusinessFeatures>> {
    const stored = await this.repository.readMany<BusinessFeatures>(
      businessIds.map((subjectId) => ({ kind: "business_features" as const, subjectId })),
      this.clock.now()
    );

    return new Map(stored.map((record) => [record.subjectId, record.value]));
  }
}
