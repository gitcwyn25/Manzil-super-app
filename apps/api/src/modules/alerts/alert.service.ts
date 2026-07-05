import { Injectable, Logger } from "@nestjs/common";

export type AlertEvent = {
  kind:
    | "business_awaiting_approval"
    | "review_spam_spike"
    | "payment_failure"
    | "mfa_disabled_attempt";
  title: string;
  detail?: string;
  url?: string;
};

/**
 * Operational alert dispatcher. Posts to a Slack- or Telegram-compatible
 * webhook (ALERT_WEBHOOK_URL). No-ops (logs only) when unconfigured, so the
 * wiring is present from day one without hard-failing on a missing secret.
 *
 * ALERT_WEBHOOK_KIND = "slack" | "telegram" | "raw" (default: raw JSON).
 * For telegram, also set ALERT_TELEGRAM_CHAT_ID.
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly url = process.env.ALERT_WEBHOOK_URL;
  private readonly kind = (process.env.ALERT_WEBHOOK_KIND ?? "raw").toLowerCase();
  private readonly chatId = process.env.ALERT_TELEGRAM_CHAT_ID;

  /** Fire-and-forget; never throws into the caller's request path. */
  dispatch(event: AlertEvent): void {
    const line = `[${event.kind}] ${event.title}${event.detail ? " — " + event.detail : ""}`;

    if (!this.url) {
      this.logger.log(`ALERT (no webhook configured): ${line}`);
      return;
    }

    const body = this.format(event, line);
    void fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000)
    }).catch((error) => this.logger.warn(`Alert dispatch failed: ${(error as Error).message}`));
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
