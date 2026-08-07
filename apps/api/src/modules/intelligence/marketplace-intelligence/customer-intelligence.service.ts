/**
 * Layer 2 — the `CustomerIntelligenceProvider`.
 *
 * Reads what the Customer summarizer stored. `snapshot()` is what Layer 4
 * loads into working memory, so it must be a lookup: a memory recall that
 * triggered a summarization would put a Postgres scan on the conversational
 * path, which is the exact latency doc 22 designed stored summaries to avoid.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type {
  CustomerIntelligenceProvider,
  CustomerSummary,
  MemorySnapshot
} from "../customer-intelligence";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import type { MarketplaceClock } from "./marketplace-intelligence.clock";
import { SummaryRepository, type StoredSummary } from "./summary.repository";
import type { StoredCustomerProfile } from "./customer-summarizer.service";
import type { CustomerHealth } from "./customer.model";
import type { IntelligenceGap } from "./marketplace-intelligence.evidence";

@Injectable()
export class CustomerIntelligenceService implements CustomerIntelligenceProvider {
  constructor(
    private readonly repository: SummaryRepository,
    @Inject(MARKETPLACE_INTELLIGENCE_CLOCK) private readonly clock: MarketplaceClock
  ) {}

  async summary(customerId: EntityId): Promise<CustomerSummary | null> {
    const stored = await this.profile(customerId);
    return stored?.value.summary ?? null;
  }

  async snapshot(customerId: EntityId): Promise<MemorySnapshot | null> {
    const stored = await this.profile(customerId);
    return stored?.value.snapshot ?? null;
  }

  /** Engagement and churn risk, or null when it could not be established. */
  async health(customerId: EntityId): Promise<CustomerHealth | null> {
    const stored = await this.profile(customerId);
    return stored?.value.health ?? null;
  }

  /** The whole stored profile, with freshness and gaps. */
  profile(customerId: EntityId): Promise<StoredSummary<StoredCustomerProfile> | null> {
    return this.repository.read<StoredCustomerProfile>(
      { kind: "customer", subjectId: customerId },
      this.clock.now()
    );
  }

  /** The models that refused for this customer, with their counts. */
  async gaps(customerId: EntityId): Promise<readonly IntelligenceGap[]> {
    const stored = await this.profile(customerId);
    return stored?.value.gaps ?? [];
  }
}
