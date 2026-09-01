"use client";

import type { Locale } from "@manzil/shared";
import { useEffect } from "react";
import type { FilterState } from "./marketplace-filter-sidebar";
import { TASHKENT_DISTRICTS } from "./marketplace-filter-sidebar";

export function MarketplaceMobileFilterDrawer({
  isOpen,
  onClose,
  locale,
  filters,
  onFilterChange,
  onResetFilters,
  totalCount
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mp-drawer-overlay" onClick={onClose}>
      <div
        aria-label="Mobil filtrlar"
        aria-modal="true"
        className="mp-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Drawer Handle */}
        <div className="mp-drawer__handle" />

        {/* Header */}
        <div className="mp-drawer__header">
          <div>
            <h3 className="mp-drawer__title">
              {locale === "uz" ? "Katalog filtrlari" : locale === "ru" ? "Фильтры каталога" : "Filters"}
            </h3>
            <span className="mp-drawer__subtitle">
              {locale === "uz"
                ? `${totalCount} ta maskan mavjud`
                : locale === "ru"
                ? `Найдено: ${totalCount}`
                : `${totalCount} places available`}
            </span>
          </div>
          <button aria-label="Yopish" className="mp-drawer__close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mp-drawer__body">
          {/* Status Toggles */}
          <div className="mp-drawer__section">
            <h4 className="mp-drawer__section-title">
              {locale === "uz" ? "Holati" : locale === "ru" ? "Статус" : "Status"}
            </h4>
            <div className="mp-toggle-stack">
              <label className="mp-toggle-row">
                <span className="mp-toggle-row__label">
                  <span>🛡️</span>
                  <span>{locale === "uz" ? "Faqat tasdiqlanganlar" : locale === "ru" ? "Только проверенные" : "Verified only"}</span>
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
                  <span>🟢</span>
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

          {/* Ratings */}
          <div className="mp-drawer__section">
            <h4 className="mp-drawer__section-title">
              {locale === "uz" ? "Mijozlar bahosi" : locale === "ru" ? "Оценка клиентов" : "Minimum Rating"}
            </h4>
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

          {/* Price Tier */}
          <div className="mp-drawer__section">
            <h4 className="mp-drawer__section-title">
              {locale === "uz" ? "Narx toifasi" : locale === "ru" ? "Уровень цен" : "Price Tier"}
            </h4>
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

          {/* Districts */}
          <div className="mp-drawer__section">
            <h4 className="mp-drawer__section-title">
              {locale === "uz" ? "Toshkent tumani" : locale === "ru" ? "Район" : "District"}
            </h4>
            <div className="mp-district-chips">
              <button
                className={`mp-district-chip ${filters.district === "all" ? "is-active" : ""}`}
                onClick={() => onFilterChange({ district: "all" })}
                type="button"
              >
                {locale === "uz" ? "Barchasi" : "All"}
              </button>
              {TASHKENT_DISTRICTS.map((d) => (
                <button
                  key={d}
                  className={`mp-district-chip ${filters.district === d ? "is-active" : ""}`}
                  onClick={() => onFilterChange({ district: d })}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mp-drawer__footer">
          <button className="mp-drawer__reset-btn" onClick={onResetFilters} type="button">
            {locale === "uz" ? "Tozalash" : locale === "ru" ? "Сбросить" : "Reset"}
          </button>
          <button className="mp-drawer__apply-btn" onClick={onClose} type="button">
            {locale === "uz"
              ? `Natijalarni ko'rish (${totalCount})`
              : locale === "ru"
              ? `Показать (${totalCount})`
              : `Show Results (${totalCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
