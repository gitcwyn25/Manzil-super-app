"use client";

import type { Locale } from "@manzil/shared";

export interface CategoryItem {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  icon: string;
  color: string;
  bgGradient: string;
}

export const MARKETPLACE_CATEGORIES: CategoryItem[] = [
  {
    id: "restaurants",
    slug: "restaurants",
    name: {
      uz: "Restoranlar",
      ru: "Рестораны",
      en: "Restaurants"
    },
    icon: "🍽️",
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.03))"
  },
  {
    id: "cafes",
    slug: "cafes",
    name: {
      uz: "Qahvaxonalar",
      ru: "Кафе и кофейни",
      en: "Cafes & Bakeries"
    },
    icon: "☕",
    color: "#eab308",
    bgGradient: "linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.03))"
  },
  {
    id: "beauty",
    slug: "beauty",
    name: {
      uz: "Go'zallik & Spa",
      ru: "Красота и SPA",
      en: "Beauty & Spa"
    },
    icon: "✨",
    color: "#ec4899",
    bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.03))"
  },
  {
    id: "auto",
    slug: "auto",
    name: {
      uz: "Avtoservis & Moyka",
      ru: "Автосервис и мойка",
      en: "Auto Services"
    },
    icon: "🚗",
    color: "#3b82f6",
    bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.03))"
  },
  {
    id: "repairs",
    slug: "repairs",
    name: {
      uz: "Usta & Ta'mirlash",
      ru: "Ремонт и мастера",
      en: "Repairs & Home"
    },
    icon: "🔧",
    color: "#10b981",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.03))"
  },
  {
    id: "entertainment",
    slug: "entertainment",
    name: {
      uz: "Ko'ngilochar",
      ru: "Развлечения",
      en: "Things to Do"
    },
    icon: "🎯",
    color: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.03))"
  },
  {
    id: "events",
    slug: "events",
    name: {
      uz: "Tadbirlar & To'yxona",
      ru: "Банкеты и свадьбы",
      en: "Events & Venues"
    },
    icon: "🎉",
    color: "#00ffcb",
    bgGradient: "linear-gradient(135deg, rgba(0, 255, 203, 0.15), rgba(0, 255, 203, 0.03))"
  },
  {
    id: "resort",
    slug: "resort",
    name: {
      uz: "Mehmonxona & Dacha",
      ru: "Отели и зоны отдыха",
      en: "Hotels & Stays"
    },
    icon: "🏨",
    color: "#06b6d4",
    bgGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.03))"
  },
  {
    id: "shopping",
    slug: "shopping",
    name: {
      uz: "Savdo & Bozorlar",
      ru: "Шопинг и базары",
      en: "Shopping & Malls"
    },
    icon: "🛍️",
    color: "#f43f5e",
    bgGradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.03))"
  }
];

export function CategoryStrip({
  locale,
  selectedCategory,
  onSelectCategory
}: {
  locale: Locale;
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}) {
  return (
    <section className="category-strip-section" aria-label="Kategoriyalar">
      <div className="container">
        <div className="category-strip-grid">
          {/* All Categories Pill */}
          <button
            className={`category-tile ${selectedCategory === "all" ? "is-active" : ""}`}
            onClick={() => onSelectCategory("all")}
            type="button"
          >
            <div className="category-tile__icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
              <span className="category-tile__icon">🌐</span>
            </div>
            <span className="category-tile__title">
              {locale === "uz" ? "Barchasi" : locale === "ru" ? "Все" : "All"}
            </span>
          </button>

          {/* 9 Thematic Categories */}
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                className={`category-tile ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectCategory(cat.slug)}
                type="button"
              >
                <div
                  className="category-tile__icon-wrap"
                  style={{ background: cat.bgGradient, borderColor: isActive ? cat.color : "transparent" }}
                >
                  <span className="category-tile__icon">{cat.icon}</span>
                </div>
                <span className="category-tile__title">{cat.name[locale] ?? cat.name.en}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
