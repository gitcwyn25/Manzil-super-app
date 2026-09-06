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
    title1: "Biznesingizni yangi bosqichga olib chiqing,",
    title2: "Manzil bilan.",
    subtitle:
      "Mijozlar Manzil katalogida biznesingizni topishi uchun profil yarating. Ma'lumotlarni yangilang, sharhlarga javob bering va obro'ingizni bitta qulay kabinetdan boshqaring.",
    ctaPrimary: "Biznesni bepul ro'yxatdan o'tkazish",
    ctaSecondary: "Kabinetga kirish",
    annotationText: "Kredit karta talab etilmaydi · 100% bepul boshlash",
    proofTitle: "Bugun biznes egalari uchun mavjud",
    proofItems: ["Listingni tasdiqlash", "Ma'lumotlarni yangilash", "Sharhlarga javob berish"]
  },
  ru: {
    title1: "Выведите ваш бизнес на новый уровень,",
    title2: "вместе с Manzil.",
    subtitle:
      "Создайте профиль в каталоге Manzil, чтобы местные клиенты могли вас найти. Обновляйте данные, отвечайте на отзывы и управляйте репутацией в одном кабинете.",
    ctaPrimary: "Зарегистрировать бизнес бесплатно",
    ctaSecondary: "Войти в кабинет",
    annotationText: "Без кредитной карты · 100% бесплатный старт",
    proofTitle: "Доступно владельцам бизнеса уже сегодня",
    proofItems: ["Подтверждение профиля", "Обновление данных", "Ответы на отзывы"]
  },
  en: {
    title1: "Scale your local business to new heights,",
    title2: "with Manzil.",
    subtitle:
      "Create a Manzil catalogue profile so local customers can find you. Keep details current, reply to reviews, and manage your reputation in one workspace.",
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
          <div className="bz-hero-01__showcase">
            <div aria-hidden="true" className="bz-hero-01__companion bz-hero-01__companion--left-top">
              <video autoPlay loop muted playsInline preload="metadata" src="/media/business/wonder-transparent.webm" />
            </div>
            <div aria-hidden="true" className="bz-hero-01__companion bz-hero-01__companion--left-bottom">
              <video autoPlay loop muted playsInline preload="metadata" src="/media/business/read-transparent.webm" />
            </div>
            <div aria-hidden="true" className="bz-hero-01__companion bz-hero-01__companion--right-top">
              <video autoPlay loop muted playsInline preload="metadata" src="/media/business/think-transparent.webm" />
            </div>
            <div aria-hidden="true" className="bz-hero-01__companion bz-hero-01__companion--right-bottom">
              <video autoPlay loop muted playsInline preload="metadata" src="/media/business/tired-transparent.webm" />
            </div>
            <div className="bz-hero-01__browser-mockup">
            <div className="bz-hero-01__browser-header">
              <div className="bz-hero-01__browser-dots">
                <span className="bz-hero-01__dot bz-hero-01__dot--red" />
                <span className="bz-hero-01__dot bz-hero-01__dot--yellow" />
                <span className="bz-hero-01__dot bz-hero-01__dot--green" />
              </div>
              <div className="bz-hero-01__browser-address">
                <span>🔒 business.manzilgroup.uz/dashboard</span>
              </div>
              <span className="bz-hero-01__browser-badge">Example workspace</span>
            </div>

            <div aria-label="Manzil Business live product demo" className="bz-hero-01__demo">
              <video autoPlay loop muted playsInline preload="auto" src="/media/business/mockup-demo.mp4" />
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
