import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../lib/seo";
import { docs } from "../../../lib/docs";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return pageMetadata({
    locale,
    path: "/docs",
    title:
      locale === "uz"
        ? "Hujjatlar — Manzil"
        : locale === "ru"
          ? "Документация — Manzil"
          : "Documentation — Manzil",
    description:
      locale === "uz"
        ? "Manzil platformasi, arxitekturasi va integratsiya bo'yicha hujjatlar tayyorlanmoqda."
        : locale === "ru"
          ? "Документация по платформе Manzil, архитектуре и интеграции готовится к публикации."
          : "Manzil platform documentation, architecture overviews, and integration guides are being prepared.",
    noIndex: true
  });
}

const COPY = {
  uz: {
    back: "Bosh sahifaga qaytish",
    badge: "Tayyorlanmoqda",
    title: "Manzil Hujjatlari",
    subtitle:
      "Tizimli texnik hujjatlar, arxitektura tavsiflari va dasturchilar uchun qo'llanmalar tayyorlanmoqda. Hozircha mavjud rasmiy qoidalar va rejalashtirilgan bo'limlar bilan tanishishingiz mumkin.",
    notice:
      "Ushbu bo'lim faol tayyorgarlik bosqichida. To'liq API spetsifikatsiyalari va integratsiya yo'riqnomalari nashr qilinish arafasida.",
    sectionsTitle: "Rejalashtirilgan hujjatlar tuzilmasi",
    sections: [
      {
        tag: "01",
        title: "Platforma va arxitektura",
        description: "Manzil super-ilovasi tuzilishi: kashfiyot (Discover), rejalashtirish (Plan) va mahalliy tajriba ekotizimi.",
        status: "Loyiha bosqichida"
      },
      {
        tag: "02",
        title: "Biznes platformasi va verifikatsiya",
        description: "Listingni tasdiqlash, profilni boshqarish, sharhlarga rasmiy javob berish va analitika kabineti qo'llanmasi.",
        status: "Loyiha bosqichida"
      },
      {
        tag: "03",
        title: "Ishonch, xavfsizlik va axloqiy me'yorlar",
        description: "Haqiqiy sharhlar mezonlari, spamdan himoya, ma'lumotlar xavfsizligi va Gurman AI shaffoflik siyosati.",
        status: "Mavjud"
      },
      {
        tag: "04",
        title: "API va integratsiya (Dasturchilar uchun)",
        description: "Hamkorlar uchun ochiq katalog API'lari, webhook'lar va ma'lumotlar sinxronizatsiyasi.",
        status: "Kutilmoqda"
      }
    ],
    verifiedTitle: "Mavjud rasmiy ma'lumotnomalar",
    businessCtaTitle: "Biznesingiz bormi?",
    businessCtaText: "Manzil Business platformasida o'z joyingizni tasdiqlang va boshqaring.",
    businessCtaBtn: "Business portaliga o'tish"
  },
  ru: {
    back: "Вернуться на главную",
    badge: "В подготовке",
    title: "Документация Manzil",
    subtitle:
      "Подробная техническая документация, описания архитектуры и руководства для разработчиков готовятся к публикации. Ниже представлены запланированные разделы и текущие официальные материалы.",
    notice:
      "Этот раздел находится в стадии активной подготовки. Полные спецификации API и руководства по интеграции будут опубликованы в ближайшее время.",
    sectionsTitle: "Структура планируемой документации",
    sections: [
      {
        tag: "01",
        title: "Платформа и архитектура",
        description: "Структура супер-приложения Manzil: поиск (Discover), планирование (Plan) и городская экосистема.",
        status: "В разработке"
      },
      {
        tag: "02",
        title: "Бизнес-платформа и верификация",
        description: "Подтверждение прав на карточку, управление профилем, официальные ответы на отзывы и аналитика.",
        status: "В разработке"
      },
      {
        tag: "03",
        title: "Доверие, безопасность и этические стандарты",
        description: "Правила достоверных отзывов, защита от накруток, безопасность данных и прозрачность Gurman AI.",
        status: "Опубликовано"
      },
      {
        tag: "04",
        title: "API и интеграции (Для разработчиков)",
        description: "Каталог API для партнеров, вебхуки и синхронизация актуальных данных о заведениях.",
        status: "Запланировано"
      }
    ],
    verifiedTitle: "Официальные документы",
    businessCtaTitle: "У вас есть бизнес?",
    businessCtaText: "Подтвердите права на заведение и управляйте им на платформе Manzil Business.",
    businessCtaBtn: "Перейти в Business"
  },
  en: {
    back: "Back to Home",
    badge: "Under preparation",
    title: "Manzil Documentation",
    subtitle:
      "Detailed technical documentation, architectural specifications, and integration guides are currently being prepared. Review planned sections and existing published reference documents below.",
    notice:
      "This section is actively being authored. Full API specifications and developer integration walkthroughs will be released shortly.",
    sectionsTitle: "Planned Documentation Structure",
    sections: [
      {
        tag: "01",
        title: "Platform Architecture & Core Model",
        description: "Super-app architecture: Discover, Plan, and Experience layers powering local business intelligence.",
        status: "Drafting"
      },
      {
        tag: "02",
        title: "Business Platform & Verification",
        description: "Listing claim workflow, verification safeguards, owner response tools, and analytics dashboard guide.",
        status: "Drafting"
      },
      {
        tag: "03",
        title: "Trust, Moderation & AI Ethics",
        description: "Authentic review standards, anti-spam mechanisms, user privacy protection, and Gurman AI transparency.",
        status: "Published"
      },
      {
        tag: "04",
        title: "API & Partner Integrations",
        description: "Catalog discovery endpoints, webhooks, and place data synchronization for ecosystem partners.",
        status: "Upcoming"
      }
    ],
    verifiedTitle: "Published Reference Materials",
    businessCtaTitle: "Own a local business?",
    businessCtaText: "Claim your listing and manage your brand presence on the Manzil Business platform.",
    businessCtaBtn: "Go to Business Platform"
  }
};

export default async function DocsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = COPY[locale] ?? COPY.en;

  const publishedDocs = [
    docs.about,
    docs.founders,
    docs.contact,
    docs.trust,
    docs.terms,
    docs.privacy,
    docs.reviews,
    docs["ai-transparency"]
  ].filter(Boolean);

  return (
    <div
      style={{
        backgroundColor: "#080A09",
        color: "#F7F6F2",
        minHeight: "100vh",
        padding: "48px 24px 96px"
      }}
    >
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        {/* Navigation back */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href={`/${locale}`}
            style={{
              color: "#A1A1AA",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              transition: "color 0.2s"
            }}
          >
            ← {t.back}
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: "48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span
              style={{
                backgroundColor: "rgba(212, 255, 0, 0.12)",
                color: "#D4FF00",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: "9999px"
              }}
            >
              {t.badge}
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 16px"
            }}
          >
            {t.title}
          </h1>
          <p
            style={{
              color: "#D4D4D8",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              maxWidth: "680px",
              margin: 0
            }}
          >
            {t.subtitle}
          </p>
        </header>

        {/* Preparation Notice */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "56px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px"
          }}
        >
          <span style={{ color: "#D4FF00", fontSize: "20px", lineHeight: 1 }}>ℹ</span>
          <p style={{ margin: 0, fontSize: "14px", color: "#A1A1AA", lineHeight: 1.6 }}>
            {t.notice}
          </p>
        </div>

        {/* Planned Documentation Structure */}
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
            {t.sectionsTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px"
            }}
          >
            {t.sections.map((sec) => (
              <div
                key={sec.tag}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px"
                    }}
                  >
                    <span style={{ color: "#D4FF00", fontFamily: "monospace", fontSize: "13px", fontWeight: 700 }}>
                      {sec.tag}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: sec.status === "Published" || sec.status === "Mavjud" || sec.status === "Опубликовано" ? "#D4FF00" : "#71717A",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      {sec.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 8px", color: "#F7F6F2" }}>
                    {sec.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#A1A1AA", lineHeight: 1.5, margin: 0 }}>
                    {sec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Published Reference Links */}
        <section style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
              color: "#F7F6F2"
            }}
          >
            {t.verifiedTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px"
            }}
          >
            {publishedDocs.map((doc) => (
              <Link
                key={doc.path}
                href={`/${locale}${doc.path}`}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "border-color 0.2s"
                }}
              >
                <div style={{ color: "#F7F6F2", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                  {doc.title[locale]} ↗
                </div>
                <div style={{ color: "#71717A", fontSize: "12px", lineHeight: 1.4 }}>
                  {doc.description[locale]}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Business CTA Banner */}
        <div
          style={{
            backgroundColor: "rgba(212, 255, 0, 0.03)",
            border: "1px solid rgba(212, 255, 0, 0.15)",
            borderRadius: "16px",
            padding: "32px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px"
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "#F7F6F2" }}>
              {t.businessCtaTitle}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#A1A1AA" }}>
              {t.businessCtaText}
            </p>
          </div>
          <a
            href="https://business.manzilgroup.uz"
            style={{
              backgroundColor: "#D4FF00",
              color: "#080A09",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {t.businessCtaBtn} →
          </a>
        </div>
      </div>
    </div>
  );
}
