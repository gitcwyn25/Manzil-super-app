"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import { MarketplaceCard } from "./marketplace-card";

export function CuratedSections({
  locale,
  businesses
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
}) {
  // 1. Best of Tashkent: top rated >= 4.8
  const bestOfTashkent = businesses
    .filter((b) => (b.avgRating ?? 0) >= 4.7 || (b.reviewCount ?? 0) > 80)
    .slice(0, 4);

  // 2. Weekend Picks: leisure, cafes, dining
  const weekendPicks = businesses
    .filter(
      (b) =>
        b.categorySlug === "cafes" ||
        b.categorySlug === "restaurants" ||
        b.categorySlug === "entertainment" ||
        b.categorySlug === "resort"
    )
    .slice(0, 4);

  return (
    <div className="curated-sections container">
      {/* SECTION 1: Best of Tashkent */}
      {bestOfTashkent.length > 0 && (
        <section className="curated-band" aria-label="Toshkentning eng saralari">
          <div className="curated-band__header">
            <div>
              <div className="curated-band__eyebrow">
                <span>🏆</span>
                <span>{locale === "uz" ? "Eng yuqori baholangan" : locale === "ru" ? "Топ рейтинг" : "Top Rated"}</span>
              </div>
              <h2 className="curated-band__title">
                {locale === "uz"
                  ? "Toshkentning eng sara maskanlari"
                  : locale === "ru"
                  ? "Лучшие заведения Ташкента"
                  : "Best of Tashkent"}
              </h2>
            </div>
            <span className="curated-band__tagline">
              {locale === "uz"
                ? "4.8+ yulduzli haqiqiy mijozlar sharhlariga ko'ra"
                : locale === "ru"
                ? "На основе честных отзывов 4.8+ звёзд"
                : "Rated 4.8+ by verified locals"}
            </span>
          </div>

          <div className="curated-band__grid">
            {bestOfTashkent.map((biz) => (
              <MarketplaceCard key={`best-${biz.id || biz.slug}`} business={biz} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: Weekend Picks */}
      {weekendPicks.length > 0 && (
        <section className="curated-band" aria-label="Hafta oxiri tavsiyalari">
          <div className="curated-band__header">
            <div>
              <div className="curated-band__eyebrow">
                <span>✨</span>
                <span>{locale === "uz" ? "Dam olish kunlari uchun" : locale === "ru" ? "На выходные" : "Weekend Picks"}</span>
              </div>
              <h2 className="curated-band__title">
                {locale === "uz"
                  ? "Hafta oxiri rejalari"
                  : locale === "ru"
                  ? "Планы на уикенд"
                  : "Weekend Highlights"}
              </h2>
            </div>
            <span className="curated-band__tagline">
              {locale === "uz"
                ? "Shinam qahvaxonalar, dam olish zonalari va oilaviy tushlik"
                : locale === "ru"
                ? "Уютные кафе, зоны отдыха и семейные обеды"
                : "Cozy cafes, dining spots, and local retreats"}
            </span>
          </div>

          <div className="curated-band__grid">
            {weekendPicks.map((biz) => (
              <MarketplaceCard key={`weekend-${biz.id || biz.slug}`} business={biz} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
