"use client";

import type { Locale } from "@manzil/shared";
import { MARKETPLACE_CATEGORIES } from "./category-strip";

export const TASHKENT_DISTRICTS = [
  "Chilonzor",
  "Mirobod",
  "Yunusobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Uchtepa",
  "Sergeli",
  "Yashnobod",
  "Bektemir",
  "Yangihayot"
];

export interface FilterState {
  category: string;
  district: string;
  ratingMin: number;
  priceTier: string;
  verifiedOnly: boolean;
  openNowOnly: boolean;
  sortBy: string;
}

export function MarketplaceFilterSidebar({
  locale,
  filters,
  onFilterChange,
  onResetFilters,
  totalCount
}: {
  locale: Locale;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
}) {
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.district !== "all" ||
    filters.ratingMin > 0 ||
    filters.priceTier !== "all" ||
    filters.verifiedOnly ||
    filters.openNowOnly;

  return (
    <aside className="mp-sidebar" aria-label="Katalog filtrlari">
      {/* Sidebar Header */}
      <div className="mp-sidebar__header">
        <div className="mp-sidebar__title-row">
          <h3 className="mp-sidebar__title">
            <span>⚙️</span>
            <span>{locale === "uz" ? "Filtrlar" : locale === "ru" ? "Фильтры" : "Filters"}</span>
          </h3>
          {hasActiveFilters && (
            <button className="mp-sidebar__reset-btn" onClick={onResetFilters} type="button">
              {locale === "uz" ? "Tozalash" : locale === "ru" ? "Сбросить" : "Reset"}
            </button>
          )}
        </div>
        <div className="mp-sidebar__count-badge">
          {locale === "uz"
            ? `${totalCount} ta maskan topildi`
            : locale === "ru"
            ? `Найдено: ${totalCount}`
            : `${totalCount} places found`}
        </div>
      </div>

      {/* 1. Status Toggles (Verified Only / Open Now) */}
      <div className="mp-filter-group">
        <span className="mp-filter-group__label">
          {locale === "uz" ? "Holati & Status" : locale === "ru" ? "Статус" : "Status & Hours"}
        </span>
        <div className="mp-toggle-stack">
          <label className="mp-toggle-row">
            <span className="mp-toggle-row__label">
              <span className="mp-toggle-row__icon">🛡️</span>
              <span>{locale === "uz" ? "Egasi tasdiqlagan profillar" : locale === "ru" ? "Профили, подтверждённые владельцем" : "Claimed profiles only"}</span>
            </span>
            <input
              checked={filters.verifiedOnly}
              onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked })}
              type="checkbox"
            />
            <span className="mp-toggle-slider" />
          </label>

          <label className="mp-toggle-row">
            <span className="mp-toggle-row__label">
              <span className="mp-toggle-row__icon">🟢</span>
              <span>{locale === "uz" ? "Hozir ochiq" : locale === "ru" ? "Открыто сейчас" : "Open now"}</span>
            </span>
            <input
              checked={filters.openNowOnly}
              onChange={(e) => onFilterChange({ openNowOnly: e.target.checked })}
              type="checkbox"
            />
            <span className="mp-toggle-slider" />
          </label>
        </div>
      </div>

      {/* 2. Rating Filter */}
      <div className="mp-filter-group">
        <span className="mp-filter-group__label">
          {locale === "uz" ? "Mijozlar reytingi" : locale === "ru" ? "Рейтинг клиентов" : "Customer Rating"}
        </span>
        <div className="mp-rating-options">
          {[
            { val: 0, label: locale === "uz" ? "Barchasi" : locale === "ru" ? "Любой" : "Any" },
            { val: 4.5, label: "4.5+ ⭐" },
            { val: 4.0, label: "4.0+ ⭐" },
            { val: 3.5, label: "3.5+ ⭐" }
          ].map((r) => (
            <button
              key={r.val}
              className={`mp-rating-pill ${filters.ratingMin === r.val ? "is-active" : ""}`}
              onClick={() => onFilterChange({ ratingMin: r.val })}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Price Tier */}
      <div className="mp-filter-group">
        <span className="mp-filter-group__label">
          {locale === "uz" ? "Narx darajasi" : locale === "ru" ? "Уровень цен" : "Price Level"}
        </span>
        <div className="mp-price-options">
          {[
            { val: "all", label: locale === "uz" ? "Barchasi" : "All" },
            { val: "$", label: "$" },
            { val: "$$", label: "$$" },
            { val: "$$$", label: "$$$" }
          ].map((p) => (
            <button
              key={p.val}
              className={`mp-price-pill ${filters.priceTier === p.val ? "is-active" : ""}`}
              onClick={() => onFilterChange({ priceTier: p.val })}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Districts of Tashkent */}
      <div className="mp-filter-group">
        <span className="mp-filter-group__label">
          {locale === "uz" ? "Toshkent tumanlari" : locale === "ru" ? "Районы Ташкента" : "Tashkent District"}
        </span>
        <div className="mp-district-list">
          <button
            className={`mp-district-item ${filters.district === "all" ? "is-active" : ""}`}
            onClick={() => onFilterChange({ district: "all" })}
            type="button"
          >
            <span>{locale === "uz" ? "Barcha tumanlar" : locale === "ru" ? "Все районы" : "All districts"}</span>
          </button>
          {TASHKENT_DISTRICTS.map((d) => (
            <button
              key={d}
              className={`mp-district-item ${filters.district === d ? "is-active" : ""}`}
              onClick={() => onFilterChange({ district: d })}
              type="button"
            >
              <span>{d}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
