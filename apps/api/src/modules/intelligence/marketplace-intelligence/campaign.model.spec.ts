import { computeCampaignSummary, isWithheld, type CampaignObservations } from "./campaign.model";
import { valueOrNull } from "./marketplace-intelligence.evidence";
import type { CampaignRow, CampaignSendRow } from "./marketplace-intelligence.projection";

const NOW = "2026-08-07T09:00:00.000Z";

const campaign: CampaignRow = {
  id: "cmp_1",
  businessId: "biz_1",
  trigger: "win_back",
  channel: "telegram",
  isActive: true
};

function send(over: Partial<CampaignSendRow> = {}): CampaignSendRow {
  return {
    campaignId: "cmp_1",
    customerId: "cus_1",
    status: "sent",
    channel: "telegram",
    consentAtSend: true,
    createdAt: new Date("2026-07-20T10:00:00.000Z"),
    sentAt: new Date("2026-07-20T10:00:01.000Z"),
    ...over
  };
}

function observations(sends: readonly CampaignSendRow[]): CampaignObservations {
  return { businessId: "biz_1", campaigns: [campaign], sends };
}

describe("CampaignSummary", () => {
  it("refuses below ten sends — a rate over two attempts is a coin toss", () => {
    const outcome = computeCampaignSummary(observations([send(), send()]), NOW);

    expect(outcome.status).toBe("insufficient_data");
    if (outcome.status !== "insufficient_data") throw new Error("unreachable");
    expect(outcome.failure.error).toMatchObject({
      kind: "marketplace_sparse",
      scopeKey: "campaign:biz_1",
      sampleSize: 2
    });
  });

  it("reports delivery, failure and both refusal reasons separately", () => {
    const sends = [
      ...Array.from({ length: 5 }, () => send()),
      ...Array.from({ length: 2 }, () => send({ status: "blocked_no_consent", consentAtSend: false })),
      ...Array.from({ length: 2 }, () => send({ status: "blocked_no_channel" })),
      send({ status: "failed" })
    ];

    const summary = valueOrNull(computeCampaignSummary(observations(sends), NOW));

    expect(summary?.sends.value).toBe(10);
    expect(summary?.deliveryRate.value).toBe(0.5);
    // Withholding for want of consent is the system working, not failing.
    expect(summary?.withheldNoConsentRate.value).toBe(0.2);
    expect(summary?.withheldNoChannelRate.value).toBe(0.2);
    expect(summary?.failureRate.value).toBe(0.1);
  });

  it("counts the send tally as a restatement and the rates as readings", () => {
    const sends = Array.from({ length: 10 }, () => send());
    const summary = valueOrNull(computeCampaignSummary(observations(sends), NOW));

    expect(summary?.sends.confidence).toBe(1);
    expect(summary?.deliveryRate.confidence).toBeLessThan(1);
  });

  it("breaks performance down per trigger, busiest first", () => {
    const second: CampaignRow = { ...campaign, id: "cmp_2", trigger: "birthday" };
    const sends = [
      ...Array.from({ length: 7 }, () => send()),
      ...Array.from({ length: 3 }, () => send({ campaignId: "cmp_2", status: "blocked_no_consent" }))
    ];

    const outcome = computeCampaignSummary(
      { businessId: "biz_1", campaigns: [campaign, second], sends },
      NOW
    );

    const summary = valueOrNull(outcome);
    expect(summary?.byTrigger[0]).toEqual({
      trigger: "win_back",
      sends: 7,
      delivered: 7,
      withheld: 0
    });
    expect(summary?.byTrigger[1]).toEqual({
      trigger: "birthday",
      sends: 3,
      delivered: 0,
      withheld: 3
    });
    expect(summary?.campaignCount).toBe(2);
    expect(summary?.activeCampaignCount).toBe(2);
  });

  it("ignores sends outside the observation window", () => {
    const old = Array.from({ length: 10 }, () =>
      send({ createdAt: new Date("2025-01-01T00:00:00.000Z") })
    );

    expect(computeCampaignSummary(observations(old), NOW).status).toBe("insufficient_data");
  });
});

describe("withheld sends", () => {
  it("treats both blocked statuses as withheld, not as failures", () => {
    expect(isWithheld(send({ status: "blocked_no_consent" }))).toBe(true);
    expect(isWithheld(send({ status: "blocked_no_channel" }))).toBe(true);
    expect(isWithheld(send({ status: "failed" }))).toBe(false);
    expect(isWithheld(send())).toBe(false);
  });
});
