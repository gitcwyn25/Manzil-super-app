/**
 * Layer 2 — the `BusinessIntelligenceProvider`.
 *
 * Reads what the Business summarizer stored. Nothing here computes: doc 22's
 * rule is that a question at plan time is a *lookup*, and a provider that
 * recomputed on a miss would quietly restore the per-query generation the
 * architecture exists to prevent.
 *
 * `summary()` returns null when the stored profile has no health block, which
 * is the frozen contract's own way of saying "we do not know this business
 * well enough yet". Callers that want the partial knowledge — the strengths a
 * business does have, and the typed reasons the rest is missing — read
 * `profile()`.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type {
  AlternativeBusiness,
  BusinessHealth,
  BusinessIntelligenceProvider,
  BusinessSummary
} from "../business-intelligence";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { SummaryRepository, type StoredSummary } from "./summary.repository";
import {
  assembleBusinessSummary,
  type StoredBusinessProfile
} from "./business-summarizer.service";
import type { IntelligenceGap } from "./marketplace-intelligence.evidence";

@Injectable()
export class BusinessIntelligenceService implements BusinessIntelligenceProvider {
  constructor(
    private readonly repository: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  /** The frozen profile, or null when health could not be established. */
  async summary(businessId: EntityId): Promise<BusinessSummary | null> {
    const stored = await this.profile(businessId);
    return stored ? assembleBusinessSummary(stored.value) : null;
  }

  /** Several profiles in one store read; businesses without one are absent. */
  async summaries(
    businessIds: readonly EntityId[]
  ): Promise<ReadonlyMap<EntityId, BusinessSummary>> {
    const stored = await this.repository.readMany<StoredBusinessProfile>(
      businessIds.map((subjectId) => ({ kind: "business" as const, subjectId })),
      this.clock.now()
    );

    const found = new Map<EntityId, BusinessSummary>();

    for (const record of stored) {
      const assembled = assembleBusinessSummary(record.value);
      if (assembled) found.set(record.subjectId, assembled);
    }

    return found;
  }

  async health(businessId: EntityId): Promise<BusinessHealth | null> {
    const stored = await this.profile(businessId);
    return stored?.value.health ?? null;
  }

  async alternatives(businessId: EntityId): Promise<readonly AlternativeBusiness[]> {
    const stored = await this.profile(businessId);
    return stored?.value.alternatives ?? [];
  }

  /**
   * The whole stored profile, with freshness and gaps.
   *
   * This is what the owner voice (doc 23 §13 — one intelligence, two voices)
   * reads: the same derived facts the consumer path uses, plus the explicit
   * record of what the platform could not establish and why.
   */
  profile(businessId: EntityId): Promise<StoredSummary<StoredBusinessProfile> | null> {
    return this.repository.read<StoredBusinessProfile>(
      { kind: "business", subjectId: businessId },
      this.clock.now()
    );
  }

  /** The models that refused for this business, with their counts. */
  async gaps(businessId: EntityId): Promise<readonly IntelligenceGap[]> {
    const stored = await this.profile(businessId);
    return stored?.value.gaps ?? [];
  }
}
