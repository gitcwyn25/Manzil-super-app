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
  "birthday": "https://images.pexels.com/photos/1036983/pexels-photo-1036983.jpeg?auto=compress&cs=tinysrgb&w=800",
  "date-night": "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=800",
  "family-dinner": "https://images.pexels.com/photos/3769999/pexels-photo-3769999.jpeg?auto=compress&cs=tinysrgb&w=800",
  "business-lunch": "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
  "default": "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800"
};

const CATEGORY_COVERS: Record<string, string> = {
  "restaurants": "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
  "cafes": "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800",
  "auto": "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  "beauty": "https://images.pexels.com/photos/3738368/pexels-photo-3738368.jpeg?auto=compress&cs=tinysrgb&w=800",
  "repairs": "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=800",
  "resort": "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800"
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
  return CATEGORY_COVERS[b.categorySlug ?? ""] || "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800";
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
