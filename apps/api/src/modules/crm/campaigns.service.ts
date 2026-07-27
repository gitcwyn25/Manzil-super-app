import { Injectable, Logger } from "@nestjs/common";
import type { Campaign, CampaignChannel, CampaignSendStatus, Customer } from "@prisma/client";
import { PrismaService } from "../prisma.service";

/**
 * Outcome of evaluating one customer against one campaign.
 *
 * `blocked_no_consent` is a first-class result, not an error: withholding a
 * message is the system working correctly, and it has to be recorded as such.
 */
type SendDecision = {
  status: CampaignSendStatus;
  body?: string;
  error?: string;
};

/**
 * Campaign delivery.
 *
 * ## Consent (CRM milestone M5)
 *
 * Uzbekistan's personal data protection law (No. ZRU-547, 2019, as amended)
 * governs the processing of personal data including phone numbers, which is
 * exactly what a marketing send does. Two rules are enforced here in code
 * rather than left to the caller:
 *
 *   1. `consentMarketing` must be true at send time — re-read per send, never
 *      cached from when the campaign was created.
 *   2. Consent is never inferred from a booking, a visit, or an existing
 *      relationship. `Customer.consentMarketing` defaults to false and is only
 *      set by an explicit act.
 *
 * TODO: LEGAL REVIEW — the specific opt-out wording, the retention period for
 * CampaignSend records, and whether a separate consent is required per channel
 * (SMS vs Telegram) have not been verified against current Uzbek law or the
 * telecom operators' own rules. Do not send to real customers until a
 * qualified reviewer has confirmed these. The code below is deliberately
 * fail-closed so that an unreviewed deployment sends nothing rather than
 * sending something non-compliant.
 *
 * ## Delivery
 *
 * There is no customer-messaging provider configured. `AlertService` posts
 * operational alerts to a single admin webhook and cannot address individual
 * customers. Until a provider is wired, `deliver()` logs and reports failure,
 * following the same "present from day one, no-ops without credentials"
 * convention AlertService already uses.
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  private readonly telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly smsEndpoint = process.env.SMS_API_URL;
  private readonly smsToken = process.env.SMS_API_TOKEN;

  constructor(private readonly prisma: PrismaService) {}

  /** True when a real provider is configured for the channel. */
  isChannelConfigured(channel: CampaignChannel): boolean {
    return channel === "telegram"
      ? Boolean(this.telegramToken)
      : Boolean(this.smsEndpoint && this.smsToken);
  }

  /**
   * Decides whether this customer may receive this campaign, and renders the
   * message if so. Pure — performs no I/O and sends nothing — so the consent
   * rules can be tested directly.
   */
  evaluate(campaign: Campaign, customer: Customer, businessName: string): SendDecision {
    // M5 gate. Checked first so that no message is even rendered for a
    // customer who has not consented.
    if (!customer.consentMarketing) {
      return { status: "blocked_no_consent" };
    }

    const address =
      campaign.channel === "telegram" ? customer.telegramChatId : customer.phone;

    if (!address) {
      return { status: "blocked_no_channel" };
    }

    return {
      status: "pending",
      body: renderTemplate(campaign.template, {
        name: customer.name ?? "mijoz",
        business: businessName
      })
    };
  }

  /**
   * Runs one campaign across a set of candidate customers.
   *
   * Every candidate produces a CampaignSend row — including blocked ones. A
   * table of successes alone cannot demonstrate that a message was correctly
   * withheld, which is the record that matters if consent is ever questioned.
   *
   * The unique (campaignId, customerId) constraint means a re-run cannot
   * re-message anyone: `skipDuplicates` turns a repeated scheduler tick into a
   * no-op rather than a second send.
   */
  async run(campaign: Campaign, customers: Customer[], businessName: string) {
    const results = { sent: 0, blockedNoConsent: 0, blockedNoChannel: 0, failed: 0, skipped: 0 };

    for (const customer of customers) {
      const existing = await this.prisma.campaignSend.findUnique({
        where: { campaignId_customerId: { campaignId: campaign.id, customerId: customer.id } }
      });

      if (existing) {
        results.skipped += 1;
        continue;
      }

      const decision = this.evaluate(campaign, customer, businessName);

      if (decision.status !== "pending") {
        await this.prisma.campaignSend.create({
          data: {
            campaignId: campaign.id,
            customerId: customer.id,
            channel: campaign.channel,
            status: decision.status,
            consentAtSend: customer.consentMarketing
          }
        });

        if (decision.status === "blocked_no_consent") results.blockedNoConsent += 1;
        else results.blockedNoChannel += 1;
        continue;
      }

      const delivered = await this.deliver(campaign.channel, customer, decision.body!);

      await this.prisma.campaignSend.create({
        data: {
          campaignId: campaign.id,
          customerId: customer.id,
          channel: campaign.channel,
          status: delivered.ok ? "sent" : "failed",
          // Frozen as actually sent — the template may be edited later.
          body: decision.body,
          error: delivered.error,
          consentAtSend: customer.consentMarketing,
          sentAt: delivered.ok ? new Date() : null
        }
      });

      if (delivered.ok) results.sent += 1;
      else results.failed += 1;
    }

    return results;
  }

  /**
   * Sends one message.
   *
   * Reports failure rather than pretending success when no provider is
   * configured: a CampaignSend row marked `sent` for a message that never left
   * the building would be a lie in the one table meant to prove what happened.
   */
  private async deliver(
    channel: CampaignChannel,
    customer: Customer,
    body: string
  ): Promise<{ ok: boolean; error?: string }> {
    if (!this.isChannelConfigured(channel)) {
      this.logger.warn(
        `Campaign send skipped — no ${channel} provider configured. Would have sent to customer ${customer.id}.`
      );
      return { ok: false, error: `${channel} provider not configured` };
    }

    try {
      if (channel === "telegram") {
        const response = await fetch(
          `https://api.telegram.org/bot${this.telegramToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: customer.telegramChatId, text: body }),
            signal: AbortSignal.timeout(8000)
          }
        );

        return response.ok
          ? { ok: true }
          : { ok: false, error: `telegram responded ${response.status}` };
      }

      const response = await fetch(this.smsEndpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.smsToken}`
        },
        body: JSON.stringify({ to: customer.phone, message: body }),
        signal: AbortSignal.timeout(8000)
      });

      return response.ok ? { ok: true } : { ok: false, error: `sms responded ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

/** Substitutes {{placeholders}}; unknown ones are left visible rather than blanked. */
function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}
