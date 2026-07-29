import { Injectable, Logger } from "@nestjs/common";
import type { AdminNotificationKind } from "@prisma/client";
import { PrismaService } from "../prisma.service";

export type AlertEvent = {
  kind:
    | "business_awaiting_approval"
    | "review_spam_spike"
    | "payment_failure"
    | "mfa_disabled_attempt";
  title: string;
  detail?: string;
  url?: string;
  /**
   * Subject business, if this event concerns one. Optional and additive —
   * existing call sites that don't pass it keep compiling unchanged; the
   * resulting AdminNotification just has no deep-link target.
   */
  businessId?: string;
};

/**
 * Only alert kinds that also mean something in the admin inbox get persisted.
 * Ops-only alerts (spam spikes, payment failures, MFA probes) still go to the
 * webhook above but have no corresponding AdminNotificationKind — they are
 * not queue items an operator acts on from the console.
 */
const NOTIFICATION_KIND_BY_ALERT_KIND: Partial<Record<AlertEvent["kind"], AdminNotificationKind>> = {
  business_awaiting_approval: "business_awaiting_approval"
};

/**
 * Operational alert dispatcher. Posts to a Slack- or Telegram-compatible
 * webhook (ALERT_WEBHOOK_URL). No-ops (logs only) when unconfigured, so the
 * wiring is present from day one without hard-failing on a missing secret.
 *
 * ALERT_WEBHOOK_KIND = "slack" | "telegram" | "raw" (default: raw JSON).
 * For telegram, also set ALERT_TELEGRAM_CHAT_ID.
 *
 * Also persists an `AdminNotification` for kinds the admin console inbox
 * tracks (see `NOTIFICATION_KIND_BY_ALERT_KIND`), so an operator has a durable
 * queue rather than only whatever the webhook happened to deliver.
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly url = process.env.ALERT_WEBHOOK_URL;
  private readonly kind = (process.env.ALERT_WEBHOOK_KIND ?? "raw").toLowerCase();
  private readonly chatId = process.env.ALERT_TELEGRAM_CHAT_ID;

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget; never throws into the caller's request path. */
  dispatch(event: AlertEvent): void {
    const line = `[${event.kind}] ${event.title}${event.detail ? " — " + event.detail : ""}`;

    if (!this.url) {
      this.logger.log(`ALERT (no webhook configured): ${line}`);
    } else {
      const body = this.format(event, line);
      void fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      }).catch((error) => this.logger.warn(`Alert dispatch failed: ${(error as Error).message}`));
    }

    void this.persist(event).catch((error) =>
      this.logger.warn(`Alert persistence failed: ${(error as Error).message}`)
    );
  }

  /**
   * Writes the AdminNotification row backing the console inbox. Deliberately
   * isolated from `dispatch`'s webhook path: a database hiccup here must never
   * surface to the caller, which for `business_awaiting_approval` is business
   * registration — the last thing that request should fail on is a
   * best-effort inbox row.
   */
  private async persist(event: AlertEvent): Promise<void> {
    const kind = NOTIFICATION_KIND_BY_ALERT_KIND[event.kind];
    if (!kind) return;

    await this.prisma.adminNotification.create({
      data: {
        kind,
        title: event.title,
        body: event.detail ?? null,
        businessId: event.businessId ?? null
      }
    });
  }

  private format(event: AlertEvent, line: string): Record<string, unknown> {
    if (this.kind === "slack") {
      return { text: `${line}${event.url ? `\n${event.url}` : ""}` };
    }
    if (this.kind === "telegram") {
      return { chat_id: this.chatId, text: `${line}${event.url ? `\n${event.url}` : ""}` };
    }
    return { ...event, line };
  }
}
