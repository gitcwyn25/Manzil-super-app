"use client";

import type { Locale } from "@manzil/shared";
import { useState } from "react";

const SEARCH_COPY: Record<Locale, { placeholder: string; location: string; submit: string; clear: string }> = {
  uz: { placeholder: "Restoran, kafe, salon, avtoservis yoki xizmat qidiring…", location: "Toshkent shahri", submit: "Qidirish", clear: "Qidiruvni tozalash" },
  ru: { placeholder: "Ресторан, кафе, салон, автосервис или услуга…", location: "Ташкент", submit: "Найти", clear: "Очистить поиск" },
  en: { placeholder: "Search restaurants, salons, repairs, events, cafes…", location: "Tashkent", submit: "Search", clear: "Clear search" }
};

export function DiscoverHero({ locale, searchQuery, onSearchChange, onSearchSubmit }: { locale: Locale; searchQuery: string; onSearchChange: (q: string) => void; onSearchSubmit: (query: string) => void }) {
  const t = SEARCH_COPY[locale] ?? SEARCH_COPY.en;
  const [localInput, setLocalInput] = useState(searchQuery);
  const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); onSearchChange(localInput); onSearchSubmit(localInput); };

  return (
    <section className="discover-search-hero" aria-label={locale === "uz" ? "Maskanlarni qidiring" : locale === "ru" ? "Поиск мест" : "Search places"}>
      <div className="discover-search-hero__inner container">
        <form className="discover-search-bar" onSubmit={handleSubmit} role="search">
          <div className="discover-search-bar__location">
            <svg className="discover-search-bar__loc-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="discover-search-bar__loc-text">{t.location}</span>
          </div>
          <div className="discover-search-bar__divider" />
          <div className="discover-search-bar__input-wrap">
            <svg className="discover-search-bar__search-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input aria-label={t.placeholder} className="discover-search-bar__input" onChange={(event) => { setLocalInput(event.target.value); onSearchChange(event.target.value); }} placeholder={t.placeholder} type="search" value={localInput} />
            {localInput && <button aria-label={t.clear} className="discover-search-bar__clear" onClick={() => { setLocalInput(""); onSearchChange(""); }} type="button">×</button>}
          </div>
          <button className="discover-search-bar__submit" type="submit"><span>{t.submit}</span></button>
        </form>
      </div>
    </section>
  );
}
