"use client";

import { useState } from "react";
import type { BusinessPlatform, Category, Locale, Occasion } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";
import { Icon } from "../vm/icons";

const DISTRICTS = [
  "Barchasi",
  "Chilonzor",
  "Mirobod",
  "Yunusobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Uchtepa",
  "Sergeli"
];

const OCCASION_IMAGES: Record<string, string> = {
  "birthday": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
  "date-night": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "family-dinner": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "business-lunch": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
  "default": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80"
};

const CATEGORY_COVERS: Record<string, string> = {
  "restaurants": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "cafes": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
  "auto": "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80",
  "beauty": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  "repairs": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "resort": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
};

function getBusinessCover(b: BusinessPlatform): string {
  if (b.coverPhotoUrl) return b.coverPhotoUrl;
  const nameLower = b.name.toLowerCase();
  if (nameLower.includes("dam olish") || nameLower.includes("resort") || nameLower.includes("oromgoh")) {
    return CATEGORY_COVERS.resort;
  }
  if (nameLower.includes("moyka") || nameLower.includes("wash") || nameLower.includes("avto") || b.categorySlug === "auto") {
    return CATEGORY_COVERS.auto;
  }
  if (nameLower.includes("kafe") || nameLower.includes("cafe") || nameLower.includes("coffee") || nameLower.includes("bread") || b.categorySlug === "cafes") {
    return CATEGORY_COVERS.cafes;
  }
  if (nameLower.includes("osh") || nameLower.includes("milliy") || nameLower.includes("plov") || nameLower.includes("taom") || b.categorySlug === "restaurants") {
    return CATEGORY_COVERS.restaurants;
  }
  return CATEGORY_COVERS[b.categorySlug ?? ""] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
}

export function TashkentCatalogSection({
  locale,
  businesses,
  occasions,
  categories
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  occasions: Occasion[];
  categories: Category[];
}) {
  const [selectedDistrict, setSelectedDistrict] = useState("Barchasi");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinesses = businesses.filter((b) => {
    const matchesDistrict = selectedDistrict === "Barchasi" || b.district === selectedDistrict;
    const matchesCategory = selectedCategory === "all" || b.categorySlug === selectedCategory;
    const descText = pickLocalized(b.description, locale) || "";
    const matchesQuery =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesCategory && matchesQuery;
  });

  return (
    <section className="tashkent-catalog-section" id="catalog">
      <div className="container">
        
        {/* MERGED TADBIRLAR & MAROSIMLAR SHOWCASE */}
        {occasions.length > 0 && (
          <div className="tashkent-events-band">
            <div className="tashkent-events-band__header">
              <div>
                <span className="tashkent-events-band__kicker">
                  🎉 Tadbirlar & Marosimlar
                </span>
                <h3 className="tashkent-events-band__title">
                  Toshkent bayramlari va maxsus kunlar
                </h3>
              </div>
              <Link
                className="tashkent-events-band__link"
                href={`/${locale}/occasions`}
              >
                <span>Barcha tadbirlar</span>
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>

            <div className="tashkent-events-grid">
              {occasions.slice(0, 4).map((occ) => {
                const bgImg = OCCASION_IMAGES[occ.slug] || OCCASION_IMAGES.default;
                return (
                  <Link
                    key={occ.slug}
                    className="tashkent-event-card"
                    href={`/${locale}/occasions/${occ.slug}`}
                  >
                    <img
                      alt={pickLocalized(occ.name, locale)}
                      className="tashkent-event-card__bg"
                      src={bgImg}
                    />
                    <div className="tashkent-event-card__overlay" />
                    <div className="tashkent-event-card__body">
                      <span className="tashkent-event-card__emoji">{occ.emoji}</span>
                      <h4 className="tashkent-event-card__title">
                        {pickLocalized(occ.name, locale)}
                      </h4>
                      <p className="tashkent-event-card__sub">
                        Mos maskanlar va to&apos;plamlar
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="tashkent-filter-bar">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#00ffcb] uppercase tracking-wider block mb-1">
                📍 Maskanlar Katalogi
              </span>
              <h2 className="text-3xl font-extrabold text-white m-0">
                Toshkentdagi tasdiqlangan joylar
              </h2>
            </div>

            {/* Search input */}
            <div className="tashkent-search-wrapper">
              <Icon name="search" size={18} className="tashkent-search-icon" />
              <input
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Joy nomi, xizmat yoki tuman qidirish..."
                type="search"
                value={searchQuery}
              />
            </div>
          </div>

          {/* District Pills Scroll */}
          <div className="tashkent-pill-scroll">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                className={`tashkent-filter-chip ${selectedDistrict === d ? "tashkent-filter-chip--active" : ""}`}
                onClick={() => setSelectedDistrict(d)}
                type="button"
              >
                {d === "Barchasi" ? "Barcha tumanlar" : `${d} tumani`}
              </button>
            ))}
          </div>

          {/* Category Chips Scroll */}
          <div className="tashkent-pill-scroll">
            <button
              className={`tashkent-filter-chip ${selectedCategory === "all" ? "tashkent-filter-chip--cat-active" : ""}`}
              onClick={() => setSelectedCategory("all")}
              type="button"
            >
              Barcha kategoriyalar
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`tashkent-filter-chip ${selectedCategory === c.slug ? "tashkent-filter-chip--cat-active" : ""}`}
                onClick={() => setSelectedCategory(c.slug)}
                type="button"
              >
                {c.name[locale] ?? c.name.uz}
              </button>
            ))}
          </div>
        </div>

        {/* BUSINESS RESULTS GRID */}
        {filteredBusinesses.length > 0 ? (
          <div className="tashkent-biz-grid">
            {filteredBusinesses.map((b) => {
              const desc = pickLocalized(b.description, locale);
              const coverImg = getBusinessCover(b);
              const rating = b.avgRating ?? (b as any).ratingAverage ?? 4.8;
              const reviews = b.reviewCount ?? 1;

              return (
                <Link
                  key={b.slug}
                  className="tashkent-biz-card"
                  href={`/${locale}/businesses/${b.slug}`}
                >
                  <div className="tashkent-biz-card__cover">
                    <img
                      alt={b.name}
                      className="tashkent-biz-card__cover-img"
                      src={coverImg}
                    />
                    <div className="tashkent-biz-card__badge-verified">
                      <span>✓</span>
                      <span>Tasdiqlangan</span>
                    </div>
                    <div className="tashkent-biz-card__badge-rating">
                      <span>★ {rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="tashkent-biz-card__body">
                    <div>
                      <div className="tashkent-biz-card__district">
                        📍 {b.district} tumani
                      </div>
                      <h3 className="tashkent-biz-card__name">
                        {b.name}
                      </h3>
                      <p className="tashkent-biz-card__desc">
                        {desc || "Toshkent shahrida joylashgan tasdiqlangan va sara xizmat ko'rsatish maskani."}
                      </p>
                    </div>

                    <div className="tashkent-biz-card__footer">
                      <span className="tashkent-biz-card__reviews">
                        💬 {reviews} ta sharhlar
                      </span>
                      <span className="tashkent-biz-card__cta">
                        Batafsil ko&apos;rish →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="tashkent-empty-state">
            <span className="tashkent-empty-state__icon">🔍</span>
            <h3 className="tashkent-empty-state__title">Mos maskanlar topilmadi</h3>
            <p className="tashkent-empty-state__sub">Filtrlarni o&apos;zgartirib ko&apos;ring yoki boshqa tuman tanlang.</p>
          </div>
        )}
      </div>
    </section>
  );
}
