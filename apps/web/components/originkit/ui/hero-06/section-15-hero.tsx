// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";

const copy = {
  uz: { note: "Manzil katalogi · Toshkent", title: "Qayerga borishni ayting.", accent: "Qolganini Gurman topadi.", body: "Gurman AI sizning kayfiyatingiz, byudjetingiz va joylashuvingizni Manzil katalogidagi haqiqiy maskanlar hamda sharhlar bilan solishtiradi.", primary: "Tavsiya olish", secondary: "Katalogni ko‘rish", proof: "Faqat katalogdagi haqiqiy joylar tavsiya qilinadi.", nav: "Katalog" },
  ru: { note: "Каталог Manzil · Ташкент", title: "Расскажите, куда хотите пойти.", accent: "Остальное найдёт Gurman.", body: "Gurman AI сопоставляет ваши пожелания, бюджет и район с реальными местами и отзывами из каталога Manzil.", primary: "Получить рекомендацию", secondary: "Открыть каталог", proof: "Рекомендуем только места из каталога.", nav: "Каталог" },
  en: { note: "Manzil catalogue · Tashkent", title: "Tell us where you want to go.", accent: "Gurman finds the rest.", body: "Gurman AI matches your mood, budget, and location with real places and verified reviews from the Manzil catalogue.", primary: "Get recommendations", secondary: "Browse catalogue", proof: "Recommendations come only from listed places.", nav: "Catalogue" }
} as const;

/** OriginKit Hero 06, rebuilt for Gurman's real catalogue search. */
export function Section15Hero({ locale }: { locale: Locale }) {
  const text = copy[locale] ?? copy.uz;

  return (
    <section className="gurman-orbit-hero" aria-labelledby="gurman-orbit-title">
      <div className="gurman-orbit-hero__rings" aria-hidden="true">
        <span className="gurman-orbit-hero__ring gurman-orbit-hero__ring--outer" />
        <span className="gurman-orbit-hero__ring gurman-orbit-hero__ring--middle" />
        <span className="gurman-orbit-hero__ring gurman-orbit-hero__ring--inner" />
        <span className="gurman-orbit-hero__pin gurman-orbit-hero__pin--one" />
        <span className="gurman-orbit-hero__pin gurman-orbit-hero__pin--two" />
        <span className="gurman-orbit-hero__pin gurman-orbit-hero__pin--three" />
      </div>

      <header className="gurman-orbit-hero__nav">
        <Link className="gurman-orbit-hero__brand" href={`/${locale}`} aria-label="Manzil home">
          <span aria-hidden="true" className="gurman-orbit-hero__arch" />
          <span>Manzil</span>
        </Link>
        <Link className="gurman-orbit-hero__catalogue" href={`/${locale}/discover`}>
          {text.nav} <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <div className="gurman-orbit-hero__content">
        <p className="gurman-orbit-hero__note">{text.note}</p>
        <h1 id="gurman-orbit-title"><span>{text.title}</span><strong>{text.accent}</strong></h1>
        <p className="gurman-orbit-hero__body">{text.body}</p>
        <div className="gurman-orbit-hero__actions">
          <a className="gurman-orbit-hero__primary" href="#gurman-workstation">{text.primary} <span aria-hidden="true">↓</span></a>
          <Link className="gurman-orbit-hero__secondary" href={`/${locale}/discover`}>{text.secondary}</Link>
        </div>
        <p className="gurman-orbit-hero__proof"><span aria-hidden="true">●</span>{text.proof}</p>
      </div>
    </section>
  );
}
