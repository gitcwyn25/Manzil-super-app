"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@manzil/shared";
import Link from "next/link";

const SAMPLE_AI_REPLIES: Record<Locale, { title: string; places: { name: string; type: string; district: string; rating: string; desc: string }[] }> = {
  uz: {
    title: "✨ Gurman AI tavsiyasi (Toshkent):",
    places: [
      {
        name: "Rayhon Milliy Taomlar Markazi",
        type: "Milliy Oshxona",
        district: "Mirobod tumani",
        rating: "⭐ 4.9 (1,240 sharh)",
        desc: "Katta oilaviy tadbirlar, to'y oshi va mehmondorchilik uchun eng sara maskan."
      },
      {
        name: "Breadly Bakery & Café",
        type: "Shinam Qahvaxona",
        district: "Shayxontohur tumani",
        rating: "⭐ 4.9 (890 sharh)",
        desc: "Maxsus desertlar, sokin uchrashuvlar va sifatli qahva."
      },
      {
        name: "Vanilla Lounge",
        type: "Lounge & Restoran",
        district: "Yunusobod tumani",
        rating: "⭐ 4.8 (640 sharh)",
        desc: "Kechki ovqat va do'stlar davrasi uchun ajoyib muhit."
      }
    ]
  },
  ru: {
    title: "✨ Рекомендации Gurman AI (Ташкент):",
    places: [
      {
        name: "Rayhon Milliy Taomlar",
        type: "Национальная кухня",
        district: "Мирабадский р-н",
        rating: "⭐ 4.9 (1,240 отзывов)",
        desc: "Идеально для семейных праздников, свадебного плова и гостей."
      },
      {
        name: "Breadly Bakery & Café",
        type: "Уютное кафе",
        district: "Шайхантахурский р-н",
        rating: "⭐ 4.9 (890 отзывов)",
        desc: "Свежая выпечка, тихая атмосфера и фирменный кофе."
      }
    ]
  },
  en: {
    title: "✨ Gurman AI Recommendations (Tashkent):",
    places: [
      {
        name: "Rayhon Milliy Taomlar",
        type: "National Cuisine",
        district: "Mirobod district",
        rating: "⭐ 4.9 (1,240 reviews)",
        desc: "Top venue for events, traditional plov, and family banquets."
      },
      {
        name: "Breadly Bakery & Café",
        type: "Specialty Café",
        district: "Shayxontohur district",
        rating: "⭐ 4.9 (890 reviews)",
        desc: "Artisan pastries, calm ambiance, and specialty coffee."
      }
    ]
  }
};

export function GurmanHeroComposer({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<typeof SAMPLE_AI_REPLIES["uz"] | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("anim");
    const t = setTimeout(() => {
      document.documentElement.classList.remove("anim");
    }, 2600);
    return () => clearTimeout(t);
  }, []);

  const handleAsk = (text?: string) => {
    const q = text || query;
    if (!q.trim()) return;
    setIsSubmitting(true);
    setResponse(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setResponse(SAMPLE_AI_REPLIES[locale] ?? SAMPLE_AI_REPLIES.uz);
    }, 850);
  };

  return (
    <div className="gurman-stage">
      {/* 1. Full-Bleed Live Tashkent Metro Station Background */}
      <div className="gurman-stage-bg">
        <img
          alt="Toshkent Metropoliteni Alisher Navoiy bekati"
          className="gurman-stage-img"
          src="/tashkent-metro.png"
        />
        <div className="gurman-stage-overlay" />
      </div>

      {/* 2. Scaled Frame (1560×1008 reference layout) */}
      <div className="gurman-frame">
        {/* Navigation Header */}
        <header className="gurman-nav">
          <Link className="gurman-brand" href={`/${locale}`} aria-label="Manzil Gurman home">
            <svg className="gurman-mark" viewBox="0 0 34 34" width="34" height="34">
              <circle cx="17" cy="17" r="17" fill="#9C86CE" />
              <circle cx="17" cy="17" r="8.6" fill="#FFFFFF" />
              <circle cx="17" cy="17" r="3.7" fill="#151519" />
            </svg>
            <span className="gurman-brand-name">Gurman AI</span>
          </Link>

          {/* Centered Nav Links */}
          <nav className="gurman-links" aria-label="Main menu">
            <Link href={`/${locale}/discover`}>Katalog</Link>
            <Link href={`/${locale}/occasions`}>Tadbirlar</Link>
            <Link href={`/${locale}/business`}>Biznes</Link>
            <Link href={`/${locale}/business/pricing`}>Tariflar</Link>
          </nav>

          {/* CTA Right */}
          <Link className="gurman-cta" href={`/${locale}/discover`}>
            <span>Boshlash</span>
          </Link>
        </header>

        {/* Hero Main Content */}
        <main className="gurman-hero">
          <h1 className="gurman-h1">
            Describe the event. We&apos;ll help to organize.
          </h1>

          {/* COMPOSER GLASS CARD (Exact 708×143u card with absolute toolbar on desktop) */}
          <div className="gurman-composer-wrapper">
            <form
              className="gurman-card"
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
            >
              {/* Input / Placeholder */}
              <input
                className="gurman-ph-input"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Toshkentda to'y, shinam kechki ovqat yoki do'stlar bilan uchrashuv rejalashtiring..."
                type="text"
                value={query}
              />

              {/* Toolbar Strip (.tools) */}
              <div className="gurman-tools">
                {/* Left Chips */}
                <div className="gurman-chips">
                  <button
                    className="gurman-chip"
                    onClick={() => handleAsk("Toshkentning eng sara to'y va marosim maskanlari")}
                    type="button"
                  >
                    <svg className="gurman-chip-icon" viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
                      <path d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 3h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/>
                    </svg>
                    <span>Attach Screens</span>
                  </button>

                  <button
                    className="gurman-chip"
                    onClick={() => handleAsk("Toshkentdagi yangi va sara qahvaxonalar")}
                    type="button"
                  >
                    <svg className="gurman-chip-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
                    </svg>
                    <span>Tadbirlar</span>
                  </button>

                  <button
                    className="gurman-chip"
                    onClick={() => handleAsk("Shanba oqshomi uchun sokin joy")}
                    type="button"
                  >
                    <svg className="gurman-chip-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 3.5v3.8l2.6 1.5-.7 1.3-3.4-2V4.5h1.5z"/>
                    </svg>
                    <span>Today&apos;s Theme</span>
                  </button>
                </div>

                {/* Right Cluster (.right) */}
                <div className="gurman-right">
                  {/* Model */}
                  <div className="gurman-model">
                    <span>Sonnet 4.5</span>
                    <svg className="gurman-chevron" viewBox="0 0 7 4" width="7" height="4" fill="none" stroke="currentColor">
                      <path d="M1 1l2.5 2L6 1" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Attach Paperclip */}
                  <button className="gurman-attach" type="button" aria-label="Attach file">
                    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
                      <path d="M14.5 6.5l-6.8 6.8a2.5 2.5 0 01-3.5-3.5l7-7a4 4 0 015.6 5.6l-7 7a5.5 5.5 0 01-7.8-7.8l6.8-6.8"/>
                    </svg>
                  </button>

                  {/* Send Circle Button */}
                  <button
                    className="gurman-send"
                    type="submit"
                    aria-label="Build it"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="gurman-send-spin" />
                    ) : (
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="#FFFFFF">
                        <path d="M7 1l5 5h-3.5v7h-3V6H2l5-5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* AI Results Dropdown Card */}
            {response && (
              <div className="gurman-results-panel">
                <div className="gurman-results-head">
                  <h4>{response.title}</h4>
                  <button
                    className="gurman-results-close"
                    onClick={() => setResponse(null)}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                <div className="gurman-results-list">
                  {response.places.map((p, idx) => (
                    <div className="gurman-place-item" key={idx}>
                      <div className="gurman-place-header">
                        <span className="gurman-place-name">{p.name}</span>
                        <span className="gurman-place-rating">{p.rating}</span>
                      </div>
                      <div className="gurman-place-type">
                        {p.type} · {p.district}
                      </div>
                      <p className="gurman-place-desc">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer Proof */}
        <footer className="gurman-proof">
          <p className="gurman-proof-caption">Built for Tashkent by Manzil</p>
          <div className="gurman-logos">
            <span className="gurman-logo-text">Google</span>
            <span className="gurman-logo-text">Cisco</span>
            <span className="gurman-logo-text">Adobe</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
