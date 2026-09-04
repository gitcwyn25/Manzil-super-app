"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import { useState } from "react";
import { pickLocalized } from "../../lib/locale-text";
import { LiveStatusPill } from "../live-status-pill";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  restaurants: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
  cafes: "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800",
  auto: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  beauty: "https://images.pexels.com/photos/3738368/pexels-photo-3738368.jpeg?auto=compress&cs=tinysrgb&w=800",
  repairs: "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=800",
  resort: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800",
  events: "https://images.pexels.com/photos/1036983/pexels-photo-1036983.jpeg?auto=compress&cs=tinysrgb&w=800",
  entertainment: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=800",
  shopping: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800"
};

function resolveCoverPhoto(business: BusinessPlatform): string {
  if (business.coverPhotoUrl && business.coverPhotoUrl.trim() !== "") {
    return business.coverPhotoUrl;
  }
  const nameLower = business.name.toLowerCase();
  if (nameLower.includes("dacha") || nameLower.includes("resort") || nameLower.includes("oromgoh")) {
    return CATEGORY_FALLBACK_IMAGES.resort;
  }
  if (nameLower.includes("moyka") || nameLower.includes("avto") || nameLower.includes("wash")) {
    return CATEGORY_FALLBACK_IMAGES.auto;
  }
  if (nameLower.includes("kafe") || nameLower.includes("cafe") || nameLower.includes("coffee") || nameLower.includes("bread")) {
    return CATEGORY_FALLBACK_IMAGES.cafes;
  }
  if (nameLower.includes("osh") || nameLower.includes("chorsu") || nameLower.includes("restoran") || nameLower.includes("taom")) {
    return CATEGORY_FALLBACK_IMAGES.restaurants;
  }
  return CATEGORY_FALLBACK_IMAGES[business.categorySlug ?? ""] || CATEGORY_FALLBACK_IMAGES.restaurants;
}

export function MarketplaceCard({
  business,
  locale,
  viewMode = "grid"
}: {
  business: BusinessPlatform;
  locale: Locale;
  viewMode?: "grid" | "list";
}) {
  const [isSaved, setIsSaved] = useState(false);
  const coverUrl = resolveCoverPhoto(business);
  const desc = pickLocalized(business.description, locale) || "";
  const hasReviews = (business.reviewCount ?? 0) > 0 && (business.avgRating ?? 0) > 0;
  const isClaimed = business.status === "claimed";
  const isFounding = Boolean(business.foundingBusiness);
  const isPopular = hasReviews && ((business.avgRating ?? 0) >= 4.8 || (business.reviewCount ?? 0) > 100);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <article className={`mp-card mp-card--${viewMode}`}>
      <Link
        aria-label={`${business.name} batafsil ma'lumot`}
        className="mp-card__link"
        href={`/${locale}/businesses/${business.slug}`}
      >
        {/* Cover Image & Badges */}
        <div className="mp-card__media">
          <img
            alt={business.name}
            className="mp-card__img"
            loading="lazy"
            src={coverUrl}
          />
          <div className="mp-card__media-overlay" />

          {/* Top Badges */}
          <div className="mp-card__badges-top">
            {(isClaimed || isFounding) && (
              <span
                className="mp-badge mp-badge--verified"
                title={isClaimed ? "Biznes egasi tomonidan da'vo qilingan profil" : "Manzil asoschisi biznesi"}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>{isClaimed ? (locale === "uz" ? "Claimed" : locale === "ru" ? "Заявлен" : "Claimed") : (locale === "uz" ? "Asoschi" : locale === "ru" ? "Основатель" : "Founding")}</span>
              </span>
            )}

            {isPopular && (
              <span className="mp-badge mp-badge--popular">
                <span>🔥 Popular</span>
              </span>
            )}
          </div>

          {/* Save / Favorite Floating Button */}
          <button
            aria-label={isSaved ? "Saqlanganlardan o'chirish" : "Saqlash"}
            className={`mp-card__save-btn ${isSaved ? "is-saved" : ""}`}
            onClick={handleSave}
            type="button"
          >
            <svg
              fill={isSaved ? "#ef4444" : "none"}
              stroke={isSaved ? "#ef4444" : "#ffffff"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>

          {/* Bottom live status: omitted when the catalogue has no live-status evidence. */}
          {business.liveStatus ? (
            <div className="mp-card__status-bottom">
              <LiveStatusPill compact locale={locale} status={business.liveStatus} />
            </div>
          ) : null}
        </div>

        {/* Card Body */}
        <div className="mp-card__body">
          {/* Category & District Header */}
          <div className="mp-card__meta-top">
            {business.district ? <span className="mp-card__district">📍 {business.district}</span> : null}
            {business.priceTier ? <span className="mp-card__price-tier">{business.priceTier}</span> : null}
          </div>

          {/* Business Name */}
          <h3 className="mp-card__name">{business.name}</h3>

          {/* Rating & Reviews */}
          <div className="mp-card__rating-row">
            {hasReviews ? (
              <>
                <div className="mp-card__stars">
                  <span className="mp-card__star-icon">★</span>
                  <span className="mp-card__rating-val">{business.avgRating.toFixed(1)}</span>
                </div>
                <span className="mp-card__reviews-count">
                  ({business.reviewCount} {locale === "uz" ? "sharh" : locale === "ru" ? "отзывов" : "reviews"})
                </span>
              </>
            ) : (
              <span className="mp-card__reviews-count">
                {locale === "uz" ? "Yangi profil" : locale === "ru" ? "Новый профиль" : "New profile"}
              </span>
            )}
          </div>

          {/* One-Line Description */}
          {desc && <p className="mp-card__desc">{desc}</p>}

          {/* Footer Info */}
          <div className="mp-card__footer">
            {business.tags?.[0] ? <span className="mp-card__tag">{business.tags[0]}</span> : null}
            <span className="mp-card__action-hint">
              {locale === "uz" ? "Ko'rish →" : locale === "ru" ? "Подробнее →" : "View →"}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
