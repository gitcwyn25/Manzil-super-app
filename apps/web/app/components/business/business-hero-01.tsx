"use client";

import type { Locale } from "@manzil/shared";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

const H = "/originkit/hero-01";

const HERO_COPY: Record<
  Locale,
  {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    annotationText: string;
    proofTitle: string;
    proofItems: string[];
  }
> = {
  uz: {
    badge: "Manzil Biznes Portali",
    title1: "Biznesingizni yangi bosqichga olib chiqing,",
    title2: "Manzil bilan.",
    subtitle:
      "Toshkentdagi minglab mijozlar biznesingizni Manzil ilovasida topishadi. Listingni tasdiqlang, sharhlarga javob bering va obro'ingizni bitta qulay kabinetdan boshqaring.",
    ctaPrimary: "Biznesni bepul ro'yxatdan o'tkazish",
    ctaSecondary: "Kabinetga kirish",
    annotationText: "Kredit karta talab etilmaydi · 100% bepul boshlash",
    proofTitle: "Bugun biznes egalari uchun mavjud",
    proofItems: ["Listingni tasdiqlash", "Ma'lumotlarni yangilash", "Sharhlarga javob berish"]
  },
  ru: {
    badge: "Бизнес-портал Manzil",
    title1: "Выведите ваш бизнес на новый уровень,",
    title2: "вместе с Manzil.",
    subtitle:
      "Тысячи клиентов в Ташкенте находят заведения через приложение Manzil. Подтвердите профиль, отвечайте на отзывы и управляйте репутацией в удобном кабинете.",
    ctaPrimary: "Зарегистрировать бизнес бесплатно",
    ctaSecondary: "Войти в кабинет",
    annotationText: "Без кредитной карты · 100% бесплатный старт",
    proofTitle: "Доступно владельцам бизнеса уже сегодня",
    proofItems: ["Подтверждение профиля", "Обновление данных", "Ответы на отзывы"]
  },
  en: {
    badge: "Manzil Business Portal",
    title1: "Scale your local business to new heights,",
    title2: "with Manzil.",
    subtitle:
      "Thousands of customers discover local venues on Manzil. Claim your listing, reply to customer reviews, and manage your reputation in one powerful workspace.",
    ctaPrimary: "Register Your Business Free",
    ctaSecondary: "Open Dashboard",
    annotationText: "No credit card required · 100% free start",
    proofTitle: "Available to business owners today",
    proofItems: ["Claim your listing", "Keep details current", "Reply to reviews"]
  }
};

export function BusinessHero01({ locale }: { locale: Locale }) {
  const copy = HERO_COPY[locale] ?? HERO_COPY.uz;

  return (
    <section className="bz-hero-01" id="hero">
      {/* Ambient Mesh Gradient Backdrop */}
      <div className="bz-hero-01__mesh-bg" aria-hidden="true">
        <Image
          src={`${H}/mesh-gradient.png`}
          alt=""
          fill
          priority
          className="bz-hero-01__mesh-img"
        />
        <div className="bz-hero-01__spotlight" />
      </div>

      <div className="container bz-hero-01__container">
        {/* Eyebrow Live Badge */}
        <Reveal as="div" variant="fade-up">
          <div className="bz-hero-01__pill-wrapper">
            <span className="bz-hero-01__pill">
              <span className="bz-hero-01__live-dot" />
              <span>{copy.badge}</span>
            </span>
          </div>
        </Reveal>

        {/* Main Title */}
        <Reveal as="div" delay={80} variant="fade-up">
          <h1 className="bz-hero-01__title">
            <span>{copy.title1}</span>
            <span className="bz-hero-01__title-accent">{copy.title2}</span>
          </h1>
        </Reveal>

        {/* Subtitle */}
        <Reveal as="div" delay={160} variant="fade-up">
          <p className="bz-hero-01__subtitle">{copy.subtitle}</p>
        </Reveal>

        {/* Actions with Hand-annotated Arrow */}
        <Reveal as="div" delay={240} variant="fade-up">
          <div className="bz-hero-01__actions-wrapper">
            {/* Annotation Arrow & Text */}
            <div className="bz-hero-01__annotation" aria-hidden="true">
              <div className="bz-hero-01__annotation-arrow">
                <Image
                  src={`${H}/annotation-arrow.svg`}
                  alt=""
                  width={24}
                  height={68}
                  className="bz-hero-01__arrow-svg"
                />
              </div>
              <span className="bz-hero-01__annotation-text">{copy.annotationText}</span>
            </div>

            <div className="bz-hero-01__actions">
              <Link
                className="clever-btn clever-btn--primary"
                href={`/${locale}/business/register`}
              >
                <Icon name="storefront" size={18} />
                <span>{copy.ctaPrimary}</span>
                <Icon name="arrow_forward" size={16} />
              </Link>
              <Link
                className="clever-btn clever-btn--glass"
                href={`/${locale}/dashboard`}
              >
                <Icon name="chart" size={18} />
                <span>{copy.ctaSecondary}</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Capability strip — factual product actions, not unverified metrics. */}
        <Reveal as="div" delay={320} variant="fade-up">
          <div className="bz-hero-01__stats-grid">
            {copy.proofItems.map((item, i) => (
              <div className="bz-hero-01__stat-box" key={i}>
                <div className="bz-hero-01__stat-val">{String(i + 1).padStart(2, "0")}</div>
                <div className="bz-hero-01__stat-lbl">{item}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Interactive Dashboard Browser Showcase */}
        <Reveal as="div" delay={400} variant="fade-up">
          <div className="bz-hero-01__browser-mockup">
            <div className="bz-hero-01__browser-header">
              <div className="bz-hero-01__browser-dots">
                <span className="bz-hero-01__dot bz-hero-01__dot--red" />
                <span className="bz-hero-01__dot bz-hero-01__dot--yellow" />
                <span className="bz-hero-01__dot bz-hero-01__dot--green" />
              </div>
              <div className="bz-hero-01__browser-address">
                <span>🔒 business.manzil.uz/dashboard</span>
              </div>
              <span className="bz-hero-01__browser-badge">Example workspace</span>
            </div>

            <div className="bz-hero-01__dashboard-inner">
              <p className="bz-mock-disclaimer">Illustrative preview — your dashboard shows your verified activity.</p>
              {/* Dashboard Top Stats */}
              <div className="bz-mock-stats-row">
                <div className="bz-mock-stat-tile">
                  <div className="bz-mock-stat-tile__head">
                    <span>Oylik Ko'rishlar</span>
                    <Icon name="trending_up" size={16} className="text-success" />
                  </div>
                  <div className="bz-mock-stat-tile__val">24,850</div>
                  <div className="bz-mock-stat-tile__growth">+18.4% o'tgan oyga nisbatan</div>
                </div>

                <div className="bz-mock-stat-tile">
                  <div className="bz-mock-stat-tile__head">
                    <span>Manzil katalogi</span>
                    <Icon name="sparkles" size={16} className="text-primary" />
                  </div>
                  <div className="bz-mock-stat-tile__val">1,420</div>
                  <div className="bz-mock-stat-tile__growth">+32% yangi mijozlar</div>
                </div>

                <div className="bz-mock-stat-tile">
                  <div className="bz-mock-stat-tile__head">
                    <span>O'rtacha Reyting</span>
                    <Icon name="star" size={16} className="text-warning" />
                  </div>
                  <div className="bz-mock-stat-tile__val">—</div>
                  <div className="bz-mock-stat-tile__growth">Sizning haqiqiy sharhlaringiz</div>
                </div>
              </div>

              {/* Dashboard Chart & Review Management Row */}
              <div className="bz-mock-content-row">
                <div className="bz-mock-chart-card">
                  <div className="bz-mock-card-head">
                    <span className="bz-mock-card-title">Mijozlar faolligi grafigi</span>
                    <span className="bz-mock-card-tag">Haftalik</span>
                  </div>
                  <div className="bz-mock-bars">
                    {[45, 60, 52, 78, 90, 85, 95].map((h, idx) => (
                      <div className="bz-mock-bar-col" key={idx}>
                        <div
                          className="bz-mock-bar-fill"
                          style={{ height: `${h}%` }}
                        />
                        <span className="bz-mock-bar-day">
                          {["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bz-mock-reviews-card">
                  <div className="bz-mock-card-head">
                    <span className="bz-mock-card-title">So'nggi sharhlar va javoblar</span>
                    <span className="bz-mock-badge-verified">Verified</span>
                  </div>
                  <div className="bz-mock-review-item">
                    <div className="bz-mock-review-user">
                      <div className="bz-mock-user-avatar">SR</div>
                      <div className="bz-mock-user-info">
                        <strong>Sardor R.</strong>
                        <span>⭐⭐⭐⭐⭐ · Kecha</span>
                      </div>
                    </div>
                    <p className="bz-mock-review-text">
                      &ldquo;Manzil orqali topib keldik. Qahva va xizmat sifati ajoyib!&rdquo;
                    </p>
                    <div className="bz-mock-reply-box">
                      <strong>Egasining javobi:</strong>
                      <span>&ldquo;Tashrifingiz uchun rahmat! Sizni yana kutib qolamiz.&rdquo;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Launch proof strip — no invented customer logos or adoption claims. */}
        <Reveal as="div" delay={480} variant="fade-up">
          <div className="bz-hero-01__trusted">
            <p className="bz-hero-01__trusted-label">{copy.proofTitle}</p>
            <div className="bz-hero-01__brands-row">
              {copy.proofItems.map((item) => (
                <div className="bz-hero-01__brand-pill" key={item}>
                  <Icon name="verified" size={14} className="text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
