import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../../lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return pageMetadata({
    locale,
    path: "/gurman/thanks",
    title:
      locale === "uz"
        ? "Rahmat — Gurman"
        : locale === "ru"
          ? "Спасибо — Gurman"
          : "Thank You — Gurman",
    description:
      locale === "uz"
        ? "Gurman kutish ro'yxatiga yozilganingiz uchun tashakkur."
        : locale === "ru"
          ? "Спасибо за регистрацию в списке ожидания Gurman."
          : "Thank you for joining the Gurman early access waitlist.",
    noIndex: true
  });
}

const COPY = {
  uz: {
    back: "Bosh sahifaga qaytish",
    badge: "Muvaffaqiyatli",
    title: "Tashakkur! Siz kutish ro'yxatidasiz.",
    desc: "Arizangiz qabul qilindi. Gurman yopiq sinov bosqichi boshlanganda ko'rsatilgan aloqa kanalingiz orqali xabar beramiz.",
    btn: "Bosh sahifaga o'tish"
  },
  ru: {
    back: "Вернуться на главную",
    badge: "Успешно",
    title: "Спасибо! Вы в списке ожидания.",
    desc: "Ваша заявка принята. Когда начнется закрытое тестирование Gurman, мы сообщим вам по указанным контактам.",
    btn: "Перейти на главную"
  },
  en: {
    back: "Back to Home",
    badge: "Confirmed",
    title: "Thank you! You're on the waitlist.",
    desc: "Your response has been recorded. When Gurman early access opens, we will reach out via your provided contact details.",
    btn: "Go to Home"
  }
};

export default async function GurmanThanksPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = COPY[locale] ?? COPY.en;

  return (
    <div
      style={{
        backgroundColor: "#080A09",
        color: "#F7F6F2",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px"
      }}
    >
      <div
        style={{
          maxWidth: "540px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "48px 32px"
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <span
            style={{
              backgroundColor: "rgba(212, 255, 0, 0.12)",
              color: "#D4FF00",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: "9999px"
            }}
          >
            {t.badge}
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 16px",
            color: "#F7F6F2"
          }}
        >
          {t.title}
        </h1>

        <p
          style={{
            color: "#A1A1AA",
            fontSize: "1rem",
            lineHeight: 1.6,
            margin: "0 0 32px"
          }}
        >
          {t.desc}
        </p>

        <Link
          href={`/${locale}`}
          style={{
            backgroundColor: "#D4FF00",
            color: "#080A09",
            fontWeight: 700,
            fontSize: "15px",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          {t.btn}
        </Link>
      </div>
    </div>
  );
}
