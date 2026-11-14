import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return pageMetadata({
    locale,
    path: "/gurman",
    title:
      locale === "uz"
        ? "Gurman — Manzil tajribasi | Kutish ro'yxati"
        : locale === "ru"
          ? "Gurman — Новый опыт Manzil | Список ожидания"
          : "Gurman — Forthcoming Manzil Experience | Waitlist",
    description:
      locale === "uz"
        ? "Gurman — Manzilning yangi tajribasi. Shahardagi eng sara joylar va ta'mlarni topishda yangi bosqich. Kutish ro'yxatiga qo'shiling."
        : locale === "ru"
          ? "Gurman — новый опыт от Manzil для поиска лучших заведений и вкусов в городе. Присоединяйтесь к списку ожидания."
          : "Gurman is a forthcoming Manzil experience designed for local taste and place curation. Join the early access waitlist.",
    noIndex: false
  });
}

const COPY = {
  uz: {
    back: "Manzil bosh sahifasi",
    badge: "Tez kunda · Yangi tajriba",
    title1: "Shahar ta'mini kashf eting.",
    title2: "Gurman bilan.",
    subtitle:
      "Gurman — Manzil ekotizimidagi yangi tajriba. Shahar bo'ylab eng sara taomlar, qahvaxonalar va o'zgacha maskanlarni oson topish, tanlash va his qilish uchun mo'ljallanmoqda.",
    cta: "Kutish ro'yxatiga qo'shilish",
    ctaHint: "Ro'yxatdan o'tish Tally platformasi orqali xavfsiz amalga oshiriladi",
    highlightsTitle: "Kutilayotgan imkoniyatlar yo'nalishi",
    highlights: [
      {
        tag: "01",
        title: "Tanlangan ta'mlar yo'lko'rsatkichi",
        desc: "Faqat haqiqiy baholar va shahar ahli tanlagan oshxona va kafelar bo'yicha saralangan tavsiyalar."
      },
      {
        tag: "02",
        title: "Intellektual qidiruv va moslashuv",
        desc: "Kayfiyat, vaqt va shaxsiy afzalliklarga qarab eng mos gastronomik maskanlarni tezkor topish."
      },
      {
        tag: "03",
        title: "Erta kirish imtiyozi",
        desc: "Kutish ro'yxati a'zolari dastlabki yopiq sinov bosqichiga taklif etiladi va maxsus yangiliklardan birinchi bo'lib xabardor bo'ladi."
      }
    ],
    statusTitle: "Ishlab chiqish jarayoni",
    statusText:
      "Loyiha konsepsiyasi va arxitekturasi ustida ish olib borilmoqda. Biz sun'iy raqamlar yoki asossiz muddatlar e'lon qilmaymiz — tayyor bo'lishi bilan kutish ro'yxatidagi foydalanuvchilar birinchi bo'lib taklifnoma oladi."
  },
  ru: {
    back: "На главную Manzil",
    badge: "Скоро · Новый опыт",
    title1: "Откройте вкус города.",
    title2: "Вместе с Gurman.",
    subtitle:
      "Gurman — новый продукт в экосистеме Manzil. Мы создаем удобный инструмент для открытия лучших блюд, кофеен и атмосферных мест города.",
    cta: "Присоединиться к списку ожидания",
    ctaHint: "Регистрация безопасно проходит через платформу Tally",
    highlightsTitle: "Направления разработки",
    highlights: [
      {
        tag: "01",
        title: "Кураторский гид по заведениям",
        desc: "Отборные рекомендации на основе реальных отзывов и выбора жителей города."
      },
      {
        tag: "02",
        title: "Умный подбор под предпочтения",
        desc: "Быстрый поиск мест под настроение, повод и ваши гастрономические вкусы."
      },
      {
        tag: "03",
        title: "Ранний доступ",
        desc: "Участники списка ожидания первыми получат приглашение на закрытое тестирование."
      }
    ],
    statusTitle: "Статус проекта",
    statusText:
      "Продукт находится в стадии проектирования и разработки. Мы не называем искусственных дат запуска — участники листа ожидания получат доступ первыми сразу по готовности."
  },
  en: {
    back: "Back to Manzil Home",
    badge: "Coming Soon · Forthcoming Experience",
    title1: "Discover the taste of the city.",
    title2: "Introducing Gurman.",
    subtitle:
      "Gurman is a forthcoming experience within the Manzil ecosystem. It is being crafted to help you discover authentic eateries, coffee shops, and hidden culinary spots across the city.",
    cta: "Join the waitlist",
    ctaHint: "Waitlist responses are collected securely through Tally",
    highlightsTitle: "What to expect",
    highlights: [
      {
        tag: "01",
        title: "Curated Local Flavors",
        desc: "Filtered suggestions driven by authentic reviews and local community trust, without paid placement disguises."
      },
      {
        tag: "02",
        title: "Context-Aware Discovery",
        desc: "Find the exact setting for your occasion, timing, and personal taste profile with minimal friction."
      },
      {
        tag: "03",
        title: "Priority Early Access",
        desc: "Waitlist members receive first invitations to the private beta testing cohort and product progress updates."
      }
    ],
    statusTitle: "Development Status",
    statusText:
      "Gurman is actively in architecture and concept development. We do not publish fabricated launch dates or unverified metrics — waitlist members will be notified directly when early access opens."
  }
};

export default async function GurmanPage({
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
        padding: "48px 24px 96px"
      }}
    >
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        {/* Navigation back */}
        <div style={{ marginBottom: "40px" }}>
          <Link
            href={`/${locale}`}
            style={{
              color: "#A1A1AA",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none"
            }}
          >
            ← {t.back}
          </Link>
        </div>

        {/* Hero Section */}
        <section style={{ marginBottom: "64px" }}>
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                backgroundColor: "rgba(212, 255, 0, 0.12)",
                color: "#D4FF00",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "6px 12px",
                borderRadius: "9999px"
              }}
            >
              {t.badge}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              margin: "0 0 24px"
            }}
          >
            {t.title1}
            <br />
            <span style={{ color: "#D4FF00" }}>{t.title2}</span>
          </h1>

          <p
            style={{
              color: "#D4D4D8",
              fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
              lineHeight: 1.6,
              maxWidth: "680px",
              margin: "0 0 36px"
            }}
          >
            {t.subtitle}
          </p>

          {/* Primary CTA - Links to /gurman/waitlist (first-party redirect route) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
            <a
              href="/gurman/waitlist"
              style={{
                backgroundColor: "#D4FF00",
                color: "#080A09",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                padding: "16px 36px",
                borderRadius: "10px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                transition: "transform 0.15s, background-color 0.15s"
              }}
            >
              <span>{t.cta}</span>
              <span aria-hidden="true">→</span>
            </a>
            <span style={{ fontSize: "12px", color: "#71717A" }}>
              {t.ctaHint}
            </span>
          </div>
        </section>

        {/* Highlights Grid */}
        <section style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
              color: "#F7F6F2"
            }}
          >
            {t.highlightsTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px"
            }}
          >
            {t.highlights.map((item) => (
              <div
                key={item.tag}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "24px"
                }}
              >
                <div
                  style={{
                    color: "#D4FF00",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "12px"
                  }}
                >
                  {item.tag}
                </div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    margin: "0 0 8px",
                    color: "#F7F6F2"
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#A1A1AA",
                    lineHeight: 1.55,
                    margin: 0
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Honest Progress Note */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ color: "#D4FF00", fontSize: "14px", fontWeight: 700 }}>
            {t.statusTitle}
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#A1A1AA", lineHeight: 1.6 }}>
            {t.statusText}
          </p>
        </div>
      </div>
    </div>
  );
}
