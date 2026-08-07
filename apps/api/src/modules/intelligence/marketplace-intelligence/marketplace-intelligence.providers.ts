/**
 * Layer 2 (Marketplace Intelligence) — DI wiring, as a provider array.
 *
 * A `Provider[]` rather than a Nest module, following `KNOWLEDGE_GRAPH_PROVIDERS`
 * and `MEMORY_ENGINE_PROVIDERS` before it, for the same structural reason:
 * this layer needs `PrismaService` and `CacheService`, which AppModule provides
 * directly and no module exports. A `MarketplaceIntelligenceModule` would have
 * to provide its own `PrismaService` — a second client and a second connection
 * pool — or import a `PrismaModule` that does not exist.
 *
 * `IntelligenceModule` stays provider-empty and safe to import, exactly as
 * `ARCHITECTURE.md` promises; nothing here is wired until a consumer needs
 * marketplace intelligence, at which point it is one line:
 *
 * ```ts
 * providers: [ …, ...MARKETPLACE_INTELLIGENCE_PROVIDERS ]
 * ```
 *
 * Four frozen tokens are bound here, and that is the point of the layer: a
 * consumer injects `INTELLIGENCE_BUSINESS` and receives stored knowledge,
 * never learning that a projection repository, a store, seven summarizers,
 * eight jobs and twenty pure models sit behind it.
 */
import type { Provider } from "@nestjs/common";
import {
  INTELLIGENCE_BUSINESS,
  INTELLIGENCE_CUSTOMER,
  INTELLIGENCE_FEATURE_STORE,
  INTELLIGENCE_MARKETPLACE
} from "../orchestrator-contracts/orchestrator.tokens";
import { SystemMarketplaceClock } from "./marketplace-intelligence.clock";
import { MARKETPLACE_INTELLIGENCE_CLOCK } from "./marketplace-intelligence.tokens";
import { INTELLIGENCE_SUMMARY_STORE_PROVIDER } from "./intelligence-summary.store";
import { IntelligenceCacheService } from "./intelligence-cache.service";
import { MarketplaceProjectionRepository } from "./marketplace-projection.repository";
import { SummaryRepository } from "./summary.repository";
import { BusinessSummarizerService } from "./business-summarizer.service";
import { CustomerSummarizerService } from "./customer-summarizer.service";
import { NeighborhoodSummarizerService } from "./neighborhood-summarizer.service";
import { ServiceSummarizerService } from "./service-summarizer.service";
import { TrendSummarizerService } from "./trend-summarizer.service";
import { CampaignSummarizerService } from "./campaign-summarizer.service";
import { WorkspaceSummarizerService } from "./workspace-summarizer.service";
import { BusinessIntelligenceService } from "./business-intelligence.service";
import { CustomerIntelligenceService } from "./customer-intelligence.service";
import { FeatureStoreService } from "./feature-store.service";
import { MarketplaceIntelligenceService } from "./marketplace-intelligence.service";
import { MarketplaceIntelligenceJobs } from "./marketplace-intelligence.jobs";
import { MarketplaceIntelligenceTriggers } from "./marketplace-intelligence.triggers";

export const MARKETPLACE_INTELLIGENCE_PROVIDERS: readonly Provider[] = [
  IntelligenceCacheService,
  MarketplaceProjectionRepository,
  SummaryRepository,
  // The seven summarizers the epic names.
  BusinessSummarizerService,
  CustomerSummarizerService,
  NeighborhoodSummarizerService,
  ServiceSummarizerService,
  TrendSummarizerService,
  CampaignSummarizerService,
  WorkspaceSummarizerService,
  // The read side.
  BusinessIntelligenceService,
  CustomerIntelligenceService,
  FeatureStoreService,
  MarketplaceIntelligenceService,
  // The only ways this layer's knowledge changes (doc 23 §5).
  MarketplaceIntelligenceJobs,
  MarketplaceIntelligenceTriggers,
  { provide: MARKETPLACE_INTELLIGENCE_CLOCK, useClass: SystemMarketplaceClock },
  // In-process until M1 applies the IntelligenceSummary migration; the factory
  // picks the Prisma-backed store the moment the delegate exists *and* the
  // deployment opts in.
  INTELLIGENCE_SUMMARY_STORE_PROVIDER,
  // Contract tokens: consumers inject the interface, never the class.
  { provide: INTELLIGENCE_MARKETPLACE, useExisting: MarketplaceIntelligenceService },
  { provide: INTELLIGENCE_BUSINESS, useExisting: BusinessIntelligenceService },
  { provide: INTELLIGENCE_CUSTOMER, useExisting: CustomerIntelligenceService },
  { provide: INTELLIGENCE_FEATURE_STORE, useExisting: FeatureStoreService }
];
