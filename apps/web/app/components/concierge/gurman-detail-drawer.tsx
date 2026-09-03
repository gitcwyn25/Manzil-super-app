"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import { useEffect } from "react";
import { pickLocalized } from "../../lib/locale-text";

export function GurmanDetailDrawer({
  business,
  onClose,
  locale,
  isSaved,
  onToggleSave
}: {
  business: BusinessPlatform | null;
  onClose: () => void;
  locale: Locale;
  isSaved: boolean;
  onToggleSave: (slug: string) => void;
}) {
  useEffect(() => {
    if (business) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [business]);

  if (!business) return null;

  const isVerified = business.status === "claimed" || Boolean(business.foundingBusiness);
  const desc = pickLocalized(business.description, locale) || "";
  const coverUrl =
    business.coverPhotoUrl ||
    "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800";

  return (
    <div className="g-drawer-backdrop" onClick={onClose}>
      <div
        aria-label={`${business.name} ma'lumotlari`}
        aria-modal="true"
        className="g-drawer g-drawer--detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Cover Image Header */}
        <div className="g-detail-hero">
          <img alt={business.name} className="g-detail-hero__img" src={coverUrl} />
          <div className="g-detail-hero__overlay" />

          {/* Close & Save Buttons */}
          <button aria-label="Yopish" className="g-detail-hero__close" onClick={onClose} type="button">
            ✕
          </button>
          <button
            aria-label="Saqlash"
            className={`g-detail-hero__save ${isSaved ? "is-saved" : ""}`}
            onClick={() => onToggleSave(business.slug)}
            type="button"
          >
            <svg
              fill={isSaved ? "#00ffcb" : "none"}
              stroke={isSaved ? "#00ffcb" : "#ffffff"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </button>

          {/* Top Badges */}
          <div className="g-detail-hero__badges">
            {isVerified && (
              <span className="g-badge g-badge--verified">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Verified Business</span>
              </span>
            )}
            {business.district && <span className="g-badge g-badge--trust">📍 {business.district}</span>}
          </div>
        </div>

        {/* Content Body */}
        <div className="g-drawer__body g-detail-body">
          {/* Title & Rating */}
          <div className="g-detail-header">
            <h2 className="g-detail-title">{business.name}</h2>
            {business.avgRating != null && (
              <div className="g-detail-rating">
                <span className="g-detail-star">★</span>
                <span className="g-detail-rating-num">{business.avgRating.toFixed(1)}</span>
                {business.reviewCount != null && (
                  <span className="g-detail-reviews">
                    ({business.reviewCount} {locale === "uz" ? "ta sharh" : locale === "ru" ? "отзывов" : "reviews"})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Key Facts */}
          <div className="g-detail-facts">
            <div className="g-detail-fact">
              <span className="g-detail-fact__icon">📍</span>
              <div>
                <span className="g-detail-fact__label">{locale === "uz" ? "Manzil" : locale === "ru" ? "Адрес" : "Address"}</span>
                <span className="g-detail-fact__val">{business.address || business.district || "—"}</span>
              </div>
            </div>

            <div className="g-detail-fact">
              <span className="g-detail-fact__icon">🕒</span>
              <div>
                <span className="g-detail-fact__label">{locale === "uz" ? "Ish vaqti" : locale === "ru" ? "Часы работы" : "Hours"}</span>
                <span className="g-detail-fact__val">{business.hours || "—"}</span>
              </div>
            </div>

            <div className="g-detail-fact">
              <span className="g-detail-fact__icon">💰</span>
              <div>
                <span className="g-detail-fact__label">{locale === "uz" ? "Narx toifasi" : locale === "ru" ? "Уровень цен" : "Price Tier"}</span>
                <span className="g-detail-fact__val">{business.priceTier || "$$"}</span>
              </div>
            </div>

            {business.phone && (
              <div className="g-detail-fact">
                <span className="g-detail-fact__icon">📞</span>
                <div>
                  <span className="g-detail-fact__label">{locale === "uz" ? "Telefon" : locale === "ru" ? "Телефон" : "Phone"}</span>
                  <a className="g-detail-fact__val g-detail-fact__link" href={`tel:${business.phone}`}>
                    {business.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {desc && (
            <div className="g-detail-desc-box">
              <h4 className="g-detail-section-title">
                {locale === "uz" ? "Maskan haqida" : locale === "ru" ? "О заведении" : "About this place"}
              </h4>
              <p className="g-detail-desc">{desc}</p>
            </div>
          )}

          {/* Tags */}
          {business.tags && business.tags.length > 0 && (
            <div className="g-detail-tags">
              {business.tags.map((tag, idx) => (
                <span key={idx} className="g-detail-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="g-drawer__footer g-detail-footer">
          {business.phone && (
            <a className="g-btn g-btn--secondary" href={`tel:${business.phone}`}>
              <span>📞 {locale === "uz" ? "Qo'ng'iroq" : locale === "ru" ? "Позвонить" : "Call"}</span>
            </a>
          )}

          <a
            className="g-btn g-btn--secondary"
            href={`https://maps.google.com/?q=${encodeURIComponent(`${business.name} ${business.address || "Tashkent"}`)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>🧭 {locale === "uz" ? "Yo'nalish" : locale === "ru" ? "Маршрут" : "Directions"}</span>
          </a>

          <Link
            className="g-btn g-btn--primary"
            href={`/${locale}/businesses/${business.slug}`}
          >
            <span>{locale === "uz" ? "To'liq profil →" : locale === "ru" ? "Профиль →" : "Full Profile →"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
