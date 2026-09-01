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
    chips: { key: string; label: string; icon: string }[];
  }
> = {
  uz: {
    headline: "Toshkentdagi sara maskanlarni kashf eting",
    subtitle: "Tasdiqlangan restoranlar, sifatli xizmatlar, go'zallik salonlari va unutilmas tajribalar.",
    searchPlaceholder: "Restoran, kafe, go'zallik saloni, avtoservis yoki xizmat qidiring…",
    locationLabel: "Toshkent shahri",
    searchBtn: "Qidirish",
    chips: [
      { key: "top_rated", label: "Yuqori baholangan", icon: "⭐" },
      { key: "open_now", label: "Hozir ochiq", icon: "🟢" },
      { key: "verified", label: "Tasdiqlangan", icon: "🛡️" },
      { key: "deals", label: "Aksiyalar & Takliflar", icon: "⚡" },
      { key: "new", label: "Yangi maskanlar", icon: "✨" }
    ]
  },
  ru: {
    headline: "Найдите лучшее место в Ташкенте",
    subtitle: "Проверенные рестораны, надежные сервисы, салоны красоты и яркие впечатления.",
    searchPlaceholder: "Поиск ресторанов, кафе, салонов красоты, автосервисов…",
    locationLabel: "Ташкент",
    searchBtn: "Найти",
    chips: [
      { key: "top_rated", label: "Высокий рейтинг", icon: "⭐" },
      { key: "open_now", label: "Открыто сейчас", icon: "🟢" },
      { key: "verified", label: "Проверенные", icon: "🛡️" },
      { key: "deals", label: "Спецпредложения", icon: "⚡" },
      { key: "new", label: "Новые места", icon: "✨" }
    ]
  },
  en: {
    headline: "Find your next place in Tashkent",
    subtitle: "Verified restaurants, services, salons, experiences, and local gems.",
    searchPlaceholder: "Search restaurants, salons, repairs, events, cafes…",
    locationLabel: "Tashkent",
    searchBtn: "Search",
    chips: [
      { key: "top_rated", label: "Top Rated", icon: "⭐" },
      { key: "open_now", label: "Open Now", icon: "🟢" },
      { key: "verified", label: "Verified Only", icon: "🛡️" },
      { key: "deals", label: "Deals & Offers", icon: "⚡" },
      { key: "new", label: "New Places", icon: "✨" }
    ]
  }
};

export function DiscoverHero({
  locale,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeQuickChip,
  onQuickChipToggle
}: {
  locale: Locale;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  activeQuickChip: string | null;
  onQuickChipToggle: (chipKey: string) => void;
}) {
  const t = HERO_COPY[locale] ?? HERO_COPY.en;
  const [localInput, setLocalInput] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localInput);
    onSearchSubmit();
  };

  return (
    <section className="discover-hero" aria-label="Marketplace Discovery Hero">
      <div className="discover-hero__inner container">
        {/* Eyebrow & Main Headings */}
        <div className="discover-hero__header">
          <div className="discover-hero__badge">
            <span className="discover-hero__badge-dot" />
            <span>Manzil Verified Local Commerce</span>
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

        {/* Quick Filter Chips */}
        <div className="discover-quick-chips" aria-label="Tezkor filtrlar">
          {t.chips.map((chip) => {
            const isActive = activeQuickChip === chip.key;
            return (
              <button
                key={chip.key}
                className={`discover-quick-chip ${isActive ? "is-active" : ""}`}
                onClick={() => onQuickChipToggle(chip.key)}
                type="button"
              >
                <span className="discover-quick-chip__icon">{chip.icon}</span>
                <span className="discover-quick-chip__label">{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
