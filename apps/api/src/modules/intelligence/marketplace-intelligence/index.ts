// Query API — marketplace-wide generated facts (writes go through core/jobs)
export * from "./marketplace-intelligence.types";
// Query API — the honesty rule: evidence floors, typed outcomes, gaps (Epic 06)
export * from "./marketplace-intelligence.evidence";
// Query API — summary identity, freshness policy, arithmetic, projection — pure
export * from "./marketplace-intelligence.freshness";
export * from "./marketplace-intelligence.statistics";
// Slots and the relational projection are re-exported by name, not by `*`.
// Two helpers here are deliberate duplicates of `knowledge-graph`'s — Layer 2
// may not import Layer 3, so `toIso`, `normalizeServiceName`, `DecimalLike`
// and `NeighborhoodKey` exist in both modules over the same primitives. One
// name per concept is the rule (`core/domain-language.ts`), so the graph's
// copies remain the ones the platform barrel exports and these stay
// module-private. Epic 05 made the same call about `isValidConfidence`.
export {
  demandSubjectId,
  isSummaryKind,
  MARKETPLACE_ID_SEPARATOR,
  MARKETPLACE_SUBJECT_ID,
  neighborhoodId,
  parseDemandSubjectId,
  parseNeighborhoodId,
  parseServiceKeyId,
  serviceKeyId,
  summaryId,
  summarySlotKey,
  SUMMARY_KINDS
} from "./marketplace-intelligence.slots";
export type { SummaryKind, SummarySlot } from "./marketplace-intelligence.slots";
export {
  bookingLeadHours,
  bookingMinutes,
  customerIdentity,
  decimalOrNull,
  decimalToNumber,
  FACT_SOURCE,
  isCanceledBooking,
  isCompletedBooking,
  isPublishedReview,
  isTerminalBooking,
  localHourOf,
  neighborhoodOf,
  priceTierLevel,
  spendPerVisit
} from "./marketplace-intelligence.projection";
export type {
  BookingIntelligenceRow,
  BookingStatusName,
  BusinessEventRow,
  BusinessIntelligenceRow,
  CampaignRow,
  CampaignSendRow,
  CampaignSendStatusName,
  CustomerIntelligenceRow,
  ModerationStatusName,
  PackageIntelligenceRow,
  ReviewIntelligenceRow,
  SearchLogRow,
  VisitIntelligenceRow
} from "./marketplace-intelligence.projection";
// Query API — the intelligence models, as pure functions
export * from "./review-signals";
export * from "./business.model";
export * from "./customer.model";
export * from "./marketplace.model";
export * from "./campaign.model";
export * from "./workspace.model";
// Implementations (Epic 06) — bound by token via MARKETPLACE_INTELLIGENCE_PROVIDERS
export * from "./marketplace-intelligence.tokens";
export * from "./marketplace-intelligence.clock";
export * from "./intelligence-summary.store";
export * from "./intelligence-cache.service";
export * from "./marketplace-projection.repository";
export * from "./summary.repository";
// Command API — the seven summarizers (entered only through a job)
export * from "./business-summarizer.service";
export * from "./customer-summarizer.service";
export * from "./neighborhood-summarizer.service";
export * from "./service-summarizer.service";
export * from "./trend-summarizer.service";
export * from "./campaign-summarizer.service";
export * from "./workspace-summarizer.service";
// Query API — the four frozen providers this layer implements
export * from "./business-intelligence.service";
export * from "./customer-intelligence.service";
export * from "./feature-store.service";
export * from "./marketplace-intelligence.service";
// Command API — jobs and the event-triggered schedule (doc 23 §5)
export * from "./marketplace-intelligence.jobs";
export * from "./marketplace-intelligence.triggers";
export * from "./marketplace-intelligence.providers";
