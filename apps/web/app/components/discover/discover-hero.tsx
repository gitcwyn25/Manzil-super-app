"use client";

import type { Locale } from "@manzil/shared";
import { useState } from "react";

const HERO_COPY: Record<
  Locale,
  {
    headline: string;
    subtitle: string;
    searchPlaceholder: string;
    locationLabel: string;
    searchBtn: string;
    badge: string;
    signals: Array<{ title: string; detail: string }>;
  }
> = {
  uz: {
    headline: "Toshkentdagi sara maskanlarni kashf eting",
    subtitle: "Restoranlar, xizmatlar, go'zallik salonlari va unutilmas tajribalarni bir joydan qidiring.",
    searchPlaceholder: "Restoran, kafe, go'zallik saloni, avtoservis yoki xizmat qidiring…",
    locationLabel: "Toshkent shahri",
    searchBtn: "Qidirish",
    badge: "Toshkent local discovery",
    signals: [
      { title: "Shahar bo'ylab", detail: "Toshkentdagi maskanlar" },
      { title: "Bir joyda", detail: "Ovqat, xizmat va dam olish" },
      { title: "O'zingizga mosini toping", detail: "Qidiruv va kategoriyalar bilan" }
    ]
  },
  ru: {
    headline: "Найдите лучшее место в Ташкенте",
    subtitle: "Ищите рестораны, сервисы, салоны красоты и яркие впечатления в одном месте.",
    searchPlaceholder: "Поиск ресторанов, кафе, салонов красоты, автосервисов…",
    locationLabel: "Ташкент",
    searchBtn: "Найти",
    badge: "Локальные места Ташкента",
    signals: [
      { title: "По всему городу", detail: "Места в Ташкенте" },
      { title: "В одном месте", detail: "Еда, сервисы и отдых" },
      { title: "Выберите своё", detail: "Поиск и категории" }
    ]
  },
  en: {
    headline: "Find your next place in Tashkent",
    subtitle: "Search restaurants, services, salons, experiences, and local gems in one place.",
    searchPlaceholder: "Search restaurants, salons, repairs, events, cafes…",
    locationLabel: "Tashkent",
    searchBtn: "Search",
    badge: "Tashkent local discovery",
    signals: [
      { title: "Across the city", detail: "Places in Tashkent" },
      { title: "All in one place", detail: "Food, services, and leisure" },
      { title: "Find your fit", detail: "Search and browse by category" }
    ]
  }
};

export function DiscoverHero({
  locale,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}: {
  locale: Locale;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (query: string) => void;
}) {
  const t = HERO_COPY[locale] ?? HERO_COPY.en;
  const [localInput, setLocalInput] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localInput);
    onSearchSubmit(localInput);
  };

  return (
    <section className="discover-hero" aria-label="Marketplace Discovery Hero">
      <div className="discover-hero__inner container">
        {/* Eyebrow & Main Headings */}
        <div className="discover-hero__header">
          <div className="discover-hero__badge">
            <span className="discover-hero__badge-dot" />
            <span>{t.badge}</span>
          </div>
          <h1 className="discover-hero__title">{t.headline}</h1>
          <p className="discover-hero__subtitle">{t.subtitle}</p>
        </div>

        {/* Big Omni Search Bar with Location Selector */}
        <form className="discover-search-bar" onSubmit={handleSubmit} role="search">
          {/* Location Badge */}
          <div className="discover-search-bar__location">
            <svg
              className="discover-search-bar__loc-icon"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="discover-search-bar__loc-text">{t.locationLabel}</span>
          </div>

          <div className="discover-search-bar__divider" />

          {/* Search Input */}
          <div className="discover-search-bar__input-wrap">
            <svg
              className="discover-search-bar__search-icon"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              aria-label={t.searchPlaceholder}
              className="discover-search-bar__input"
              onChange={(e) => {
                setLocalInput(e.target.value);
                onSearchChange(e.target.value);
              }}
              placeholder={t.searchPlaceholder}
              type="text"
              value={localInput}
            />
            {localInput && (
              <button
                aria-label="Qidiruvni tozalash"
                className="discover-search-bar__clear"
                onClick={() => {
                  setLocalInput("");
                  onSearchChange("");
                }}
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Submit CTA */}
          <button className="discover-search-bar__submit" type="submit">
            <span>{t.searchBtn}</span>
          </button>
        </form>

        <div className="discover-hero__signals" aria-label={t.badge}>
          {t.signals.map((signal, index) => (
            <div className="discover-hero__signal" key={signal.title}>
              <span className="discover-hero__signal-index">0{index + 1}</span>
              <span className="discover-hero__signal-copy">
                <strong>{signal.title}</strong>
                <small>{signal.detail}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
