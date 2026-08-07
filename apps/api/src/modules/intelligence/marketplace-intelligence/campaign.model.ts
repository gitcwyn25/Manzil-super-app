/**
 * Layer 2 (Marketplace Intelligence) — the campaign summarizer's model.
 *
 * The CRM writes a `CampaignSend` row for **blocked** attempts as well as
 * successful ones ("the record that a message was withheld for lack of consent
 * is the evidence that matters under a personal-data regime"). That design
 * decision is what makes this summary worth having: an owner can see not just
 * how many messages landed, but how much of their audience the platform
 * *refused* to message, and why.
 *
 * No frozen Epic 03 contract exists for campaign intelligence, so the shape is
 * declared here, in the module that computes it, in the same fact language as
 * everything else in this layer.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type { EntityId, IsoDateTime, TimeWindow } from "../core";
import type { MarketplaceFact } from "./marketplace-intelligence.types";
import {
  computed,
  refuseWithoutEvidence,
  type IntelligenceOutcome
} from "./marketplace-intelligence.evidence";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import {
  FACT_SOURCE,
  type CampaignRow,
  type CampaignSendRow
} from "./marketplace-intelligence.projection";
import { derivedFact, restatedFact } from "./marketplace.model";
import { clamp01, roundTo, windowEndingAt, within } from "./marketplace-intelligence.statistics";

/** Per-trigger performance — which automation is actually earning its place. */
export interface CampaignTriggerPerformance {
  /** `welcome`, `win_back`, `birthday`, `review_request`. */
  readonly trigger: string;
  readonly sends: number;
  readonly delivered: number;
  /** Attempts the platform refused for want of consent or an address. */
  readonly withheld: number;
}

/** One business's campaign programme, as the marketplace observes it. */
export interface CampaignSummary {
  readonly businessId: EntityId;
  readonly window: TimeWindow;
  readonly campaignCount: number;
  readonly activeCampaignCount: number;
  readonly sends: MarketplaceFact<number>;
  /** Share of attempts that reached somebody, in [0, 1]. */
  readonly deliveryRate: MarketplaceFact<number>;
  /** Share withheld because consent was absent or withdrawn, in [0, 1]. */
  readonly withheldNoConsentRate: MarketplaceFact<number>;
  /** Share withheld because the customer had no address on that channel. */
  readonly withheldNoChannelRate: MarketplaceFact<number>;
  readonly failureRate: MarketplaceFact<number>;
  readonly byTrigger: readonly CampaignTriggerPerformance[];
  readonly generatedAt: IsoDateTime;
}

/** Everything one campaign summarization reads. */
export interface CampaignObservations {
  readonly businessId: EntityId;
  readonly campaigns: readonly CampaignRow[];
  readonly sends: readonly CampaignSendRow[];
}

/**
 * The campaign programme of one business.
 *
 * Rates only above ten sends, because "50% delivery" over two attempts is a
 * coin toss reported as a metric. Below the floor the model refuses and the
 * owner sees the counts through the raw CRM instead, which is the honest place
 * for a tally.
 */
export function computeCampaignSummary(
  observations: CampaignObservations,
  now: IsoDateTime
): IntelligenceOutcome<CampaignSummary> {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.campaign);
  const sends = observations.sends.filter((send) => within(window, send.createdAt));

  const base = {
    observations: sends.length,
    window,
    sources: [FACT_SOURCE.campaign],
    subjectId: observations.businessId,
    at: now,
    scopeKey: `campaign:${observations.businessId}`
  };

  const refusal = refuseWithoutEvidence<CampaignSummary>("campaign_performance", base);
  if (refusal) return refusal;

  const rateOf = (predicate: (send: CampaignSendRow) => boolean) =>
    roundTo(clamp01(sends.filter(predicate).length / sends.length));

  const byCampaign = new Map(observations.campaigns.map((campaign) => [campaign.id, campaign]));
  const triggers = new Map<string, CampaignTriggerPerformance>();

  for (const send of sends) {
    const trigger = byCampaign.get(send.campaignId)?.trigger ?? "unknown";
    const existing = triggers.get(trigger) ?? { trigger, sends: 0, delivered: 0, withheld: 0 };

    triggers.set(trigger, {
      trigger,
      sends: existing.sends + 1,
      delivered: existing.delivered + (send.status === "sent" ? 1 : 0),
      withheld: existing.withheld + (isWithheld(send) ? 1 : 0)
    });
  }

  const summary: CampaignSummary = {
    businessId: observations.businessId,
    window,
    campaignCount: observations.campaigns.length,
    activeCampaignCount: observations.campaigns.filter((campaign) => campaign.isActive).length,
    sends: restatedFact(sends.length, sends.length, window, now),
    deliveryRate: derivedFact(
      rateOf((send) => send.status === "sent"),
      sends.length,
      window,
      now,
      "campaign_performance"
    ),
    withheldNoConsentRate: derivedFact(
      rateOf((send) => send.status === "blocked_no_consent"),
      sends.length,
      window,
      now,
      "campaign_performance"
    ),
    withheldNoChannelRate: derivedFact(
      rateOf((send) => send.status === "blocked_no_channel"),
      sends.length,
      window,
      now,
      "campaign_performance"
    ),
    failureRate: derivedFact(
      rateOf((send) => send.status === "failed"),
      sends.length,
      window,
      now,
      "campaign_performance"
    ),
    byTrigger: [...triggers.values()].sort(
      (a, b) => b.sends - a.sends || a.trigger.localeCompare(b.trigger)
    ),
    generatedAt: now
  };

  return computed<CampaignSummary>("campaign_performance", summary, base);
}

/** True when the platform deliberately did not send — not a failure. */
export function isWithheld(send: CampaignSendRow): boolean {
  return send.status === "blocked_no_consent" || send.status === "blocked_no_channel";
}
