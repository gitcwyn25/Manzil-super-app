"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";

export interface GurmanRecommendation {
  business: BusinessPlatform;
  matchScore: number;
  reason: Record<Locale, string>;
  highlights: Record<Locale, string[]>;
}

export function GurmanRecommendationCard({
  rec,
  locale,
  isSaved,
  onToggleSave,
  onOpenDetails
}: {
  rec: GurmanRecommendation;
  locale: Locale;
  isSaved: boolean;
  onToggleSave: (slug: string) => void;
  onOpenDetails: (business: BusinessPlatform) => void;
}) {
  const { business } = rec;
  const isVerified = business.status === "claimed" || Boolean(business.foundingBusiness);
  const reasonText = rec.reason[locale] ?? rec.reason.uz;
  const desc = pickLocalized(business.description, locale) || "";

  // Fallback image based on category
  const coverUrl =
    business.coverPhotoUrl && business.coverPhotoUrl.trim() !== ""
      ? business.coverPhotoUrl
      : business.categorySlug === "cafes"
      ? "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800"
      : business.categorySlug === "auto"
      ? "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
      : "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800";

  return (
    <article className="g-rec-card">
      <div className="g-rec-card__media" onClick={() => onOpenDetails(business)}>
        <img alt={business.name} className="g-rec-card__img" loading="lazy" src={coverUrl} />
        <div className="g-rec-card__overlay" />

        {/* Top Badges */}
        <div className="g-rec-card__badges">
          {isVerified && (
            <span className="g-badge g-badge--verified" title="Tasdiqlangan biznes">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span>Verified</span>
            </span>
          )}
          <span className="g-badge g-badge--trust">
            {locale === "uz" ? "Manzil katalogidan" : locale === "ru" ? "Из каталога Manzil" : "Manzil Verified"}
          </span>
        </div>

        {/* Save Bookmark Button */}
        <button
          aria-label={isSaved ? "Saqlanganlardan o'chirish" : "Saqlash"}
          className={`g-rec-card__save-btn ${isSaved ? "is-saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(business.slug);
          }}
          type="button"
        >
          <svg
            fill={isSaved ? "#00ffcb" : "none"}
            stroke={isSaved ? "#00ffcb" : "#ffffff"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </button>

        {/* Bottom District & Price */}
        <div className="g-rec-card__status-bottom">
          <span className="g-meta-chip">📍 {business.district || "Toshkent"}</span>
          <span className="g-meta-chip g-meta-chip--price">{business.priceTier || "$$"}</span>
        </div>
      </div>

      <div className="g-rec-card__body">
        {/* Name & Rating */}
        <div className="g-rec-card__header">
          <h3 className="g-rec-card__name" onClick={() => onOpenDetails(business)}>
            {business.name}
          </h3>
          <div className="g-rec-card__rating">
            <span className="g-rec-card__star">★</span>
            <span className="g-rec-card__rating-val">{(business.avgRating || 4.8).toFixed(1)}</span>
            <span className="g-rec-card__reviews-count">({business.reviewCount || 42})</span>
          </div>
        </div>

        {/* Description snippet */}
        {desc && <p className="g-rec-card__desc">{desc}</p>}

        {/* EXPLICIT RECOMMENDATION REASON */}
        <div className="g-rec-card__reason-box">
          <span className="g-rec-card__reason-icon">✨</span>
          <div className="g-rec-card__reason-text">
            <span className="g-rec-card__reason-label">
              {locale === "uz"
                ? "Nega bu joy tavsiya qilindi?"
                : locale === "ru"
                ? "Почему это заведение?"
                : "Why recommended?"}
            </span>
            <p className="g-rec-card__reason-val">{reasonText}</p>
          </div>
        </div>

        {/* Card Actions */}
        <div className="g-rec-card__actions">
          <button
            className="g-btn g-btn--primary"
            onClick={() => onOpenDetails(business)}
            type="button"
          >
            <span>{locale === "uz" ? "Batafsil" : locale === "ru" ? "Подробнее" : "Details"}</span>
          </button>

          <Link
            className="g-btn g-btn--secondary"
            href={`/${locale}/businesses/${business.slug}`}
          >
            <span>{locale === "uz" ? "Profilga o'tish →" : locale === "ru" ? "В профиль →" : "View profile →"}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
