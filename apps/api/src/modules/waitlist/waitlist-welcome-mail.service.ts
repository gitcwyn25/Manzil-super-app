import { Injectable, Logger } from "@nestjs/common";

export type WaitlistWelcomeInput = {
  email: string;
  firstName: string | null;
  locale: string;
  position: number;
};

export type WaitlistWelcomeResult = {
  status: "sent" | "not_configured" | "failed";
  id?: string;
};

type WelcomeCopy = {
  subject: string;
  greeting: string;
  body: string;
  positionLabel: string;
  footer: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@", 2);
  if (!domain) return "redacted";
  return `${local.slice(0, 2)}***@${domain}`;
}

function copyFor(locale: string): WelcomeCopy {
  if (locale === "ru") {
    return {
      subject: "Вы в списке Gurman Mobile",
      greeting: "Добро пожаловать в ранний доступ Gurman Mobile.",
      body: "Мы сохранили вашу заявку и сообщим первыми, когда приложение будет готово.",
      positionLabel: "Ваше место в очереди",
      footer: "Это письмо отправлено, потому что вы присоединились к списку ожидания Gurman Mobile."
    };
  }

  if (locale === "en") {
    return {
      subject: "You’re on the Gurman Mobile waitlist",
      greeting: "Welcome to Gurman Mobile early access.",
      body: "We saved your request and will write first when the app is ready.",
      positionLabel: "Your place in line",
      footer: "You received this because you joined the Gurman Mobile waitlist."
    };
  }

  return {
    subject: "Gurman Mobile navbatiga xush kelibsiz",
    greeting: "Gurman Mobile erta kirish ro‘yxatiga xush kelibsiz.",
    body: "So‘rovingiz saqlandi. Ilova tayyor bo‘lganda sizga birinchi bo‘lib xabar beramiz.",
    positionLabel: "Navbatdagi o‘rningiz",
    footer: "Bu xat Gurman Mobile kutish ro‘yxatiga qo‘shilganingiz uchun yuborildi."
  };
}

@Injectable()
export class WaitlistWelcomeMailService {
  private readonly logger = new Logger(WaitlistWelcomeMailService.name);

  async send(input: WaitlistWelcomeInput): Promise<WaitlistWelcomeResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY is not configured; waitlist welcome email skipped");
      return { status: "not_configured" };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "no-reply@manzilgroup.uz";
    const fromName = process.env.RESEND_FROM_NAME?.trim() || "Manzil Group";
    const copy = copyFor(input.locale);
    const firstName = input.firstName?.trim() || "";
    const greeting = firstName ? `${firstName}, ${copy.greeting}` : copy.greeting;
    const safeGreeting = escapeHtml(greeting);
    const safeBody = escapeHtml(copy.body);
    const safePositionLabel = escapeHtml(copy.positionLabel);
    const safeFooter = escapeHtml(copy.footer);
    const subject = copy.subject;

    const html = `<!doctype html>
<html lang="${input.locale === "ru" ? "ru" : input.locale === "en" ? "en" : "uz"}">
  <body style="margin:0;background:#f7f3ea;color:#173d39;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
      <div style="background:#fffdf8;border:1px solid #eadfce;border-radius:20px;padding:36px;">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#e56b45;font-weight:700;">MANZIL GROUP · GURMAN MOBILE</div>
        <h1 style="font-size:30px;line-height:1.1;margin:22px 0 12px;color:#173d39;">${safeGreeting}</h1>
        <p style="font-size:16px;line-height:1.65;margin:0;color:#53635f;">${safeBody}</p>
        <div style="margin:28px 0;padding:20px;border-radius:16px;background:#173d39;color:#fffdf8;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.72;">${safePositionLabel}</div>
          <div style="font-size:42px;line-height:1;font-weight:700;margin-top:8px;">#${input.position}</div>
        </div>
        <p style="font-size:12px;line-height:1.6;margin:28px 0 0;color:#7b8782;">${safeFooter}</p>
      </div>
    </div>
  </body>
</html>`;
    const text = `${greeting}\n\n${copy.body}\n\n${copy.positionLabel}: #${input.position}\n\n${copy.footer}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [input.email],
          subject,
          html,
          text
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        this.logger.error(`Resend rejected a waitlist welcome email (${response.status})`);
        return { status: "failed" };
      }

      const payload = (await response.json().catch(() => ({}))) as { id?: unknown };
      return { status: "sent", ...(typeof payload.id === "string" ? { id: payload.id } : {}) };
    } catch (error) {
      this.logger.error(`Unable to send a waitlist welcome email to ${maskEmail(input.email)}`, error);
      return { status: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
