"use client";

import type { Locale } from "@manzil/shared";
import {
  CalendarDays,
  Car,
  Coffee,
  Gamepad2,
  Hotel,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wrench
} from "lucide-react";
import type { ReactNode } from "react";
import { ShiftingDropDown, type ShiftingDropDownCategory, type ShiftingDropDownGroup } from "../../../components/ui/shifting-dropdown";

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

const CATEGORY_ICONS: Record<string, ReactNode> = {
  restaurants: <Utensils aria-hidden="true" size={17} strokeWidth={1.8} />,
  cafes: <Coffee aria-hidden="true" size={17} strokeWidth={1.8} />,
  beauty: <Sparkles aria-hidden="true" size={17} strokeWidth={1.8} />,
  auto: <Car aria-hidden="true" size={17} strokeWidth={1.8} />,
  repairs: <Wrench aria-hidden="true" size={17} strokeWidth={1.8} />,
  entertainment: <Gamepad2 aria-hidden="true" size={17} strokeWidth={1.8} />,
  events: <PartyPopper aria-hidden="true" size={17} strokeWidth={1.8} />,
  resort: <Hotel aria-hidden="true" size={17} strokeWidth={1.8} />,
  shopping: <ShoppingBag aria-hidden="true" size={17} strokeWidth={1.8} />
};

const CATEGORY_DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  restaurants: {
    uz: "Milliy va zamonaviy taomlar",
    ru: "Национальная и современная кухня",
    en: "Local and modern dining"
  },
  cafes: {
    uz: "Qahva, nonushta va shirinliklar",
    ru: "Кофе, завтраки и десерты",
    en: "Coffee, breakfast, and treats"
  },
  beauty: {
    uz: "Salonlar, spa va parvarish",
    ru: "Салоны, SPA и уход",
    en: "Salons, spas, and care"
  },
  auto: {
    uz: "Avtoservis, shina va moyka",
    ru: "Автосервис, шины и мойка",
    en: "Service, tyres, and car wash"
  },
  repairs: {
    uz: "Uy uchun ustalar va ta'mirlash",
    ru: "Мастера и ремонт для дома",
    en: "Home services and repairs"
  },
  entertainment: {
    uz: "Dam olish va qiziqarli tajribalar",
    ru: "Отдых и яркие впечатления",
    en: "Leisure and experiences"
  },
  events: {
    uz: "Tadbirlar, to'yxonalar va zallar",
    ru: "Мероприятия, банкетные залы и площадки",
    en: "Events, venues, and celebrations"
  },
  resort: {
    uz: "Mehmonxonalar va dam olish maskanlari",
    ru: "Отели и зоны отдыха",
    en: "Hotels and weekend stays"
  },
  shopping: {
    uz: "Do'konlar, bozorlar va savdo markazlari",
    ru: "Магазины, рынки и торговые центры",
    en: "Shops, markets, and malls"
  }
};

function toDropdownCategory(slug: string): ShiftingDropDownCategory {
  const category = MARKETPLACE_CATEGORIES.find((item) => item.slug === slug);
  if (!category) {
    throw new Error(`Unknown marketplace category: ${slug}`);
  }

  return {
    id: category.id,
    slug: category.slug,
    label: category.name,
    icon: CATEGORY_ICONS[slug] ?? category.icon,
    color: category.color,
    description: CATEGORY_DESCRIPTIONS[slug]
  };
}

function createGroup(
  id: string,
  label: Record<Locale, string>,
  description: Record<Locale, string>,
  icon: ReactNode,
  accent: string,
  categorySlugs: string[]
): ShiftingDropDownGroup {
  return {
    id,
    label,
    description,
    icon,
    accent,
    categories: categorySlugs.map(toDropdownCategory)
  };
}

export const MARKETPLACE_CATEGORY_GROUPS: ShiftingDropDownGroup[] = [
  createGroup(
    "eat-drink",
    { uz: "Ovqatlanish", ru: "Еда и напитки", en: "Eat & drink" },
    {
      uz: "Toshkentdagi mazali manzillarni toping",
      ru: "Найдите вкусные места в Ташкенте",
      en: "Find your next Tashkent favourite"
    },
    <Utensils aria-hidden="true" size={18} strokeWidth={1.8} />,
    "#f97316",
    ["restaurants", "cafes"]
  ),
  createGroup(
    "care-services",
    { uz: "Xizmatlar", ru: "Сервисы", en: "Care & services" },
    {
      uz: "Kundalik ishlar uchun ishonchli ustalar",
      ru: "Надёжные специалисты на каждый день",
      en: "Trusted help for everyday needs"
    },
    <Wrench aria-hidden="true" size={18} strokeWidth={1.8} />,
    "#ec4899",
    ["beauty", "auto", "repairs"]
  ),
  createGroup(
    "go-out",
    { uz: "Dam olish", ru: "Отдых", en: "Go out" },
    {
      uz: "Shaharni yangi taassurotlar bilan kashf eting",
      ru: "Откройте город с новыми впечатлениями",
      en: "Discover new ways to spend the day"
    },
    <CalendarDays aria-hidden="true" size={18} strokeWidth={1.8} />,
    "#8b5cf6",
    ["entertainment", "events", "resort"]
  ),
  createGroup(
    "shopping",
    { uz: "Savdo", ru: "Шопинг", en: "Shopping" },
    {
      uz: "Yaqin atrofdagi savdo joylarini ko'ring",
      ru: "Магазины и рынки рядом с вами",
      en: "Browse shops and markets nearby"
    },
    <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.8} />,
    "#f43f5e",
    ["shopping"]
  )
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
        <div className="category-strip-heading">
          <span className="category-strip-eyebrow">
            {locale === "uz" ? "Biznes kategoriyalari" : locale === "ru" ? "Категории бизнеса" : "Business categories"}
          </span>
          <span className="category-strip-hint">
            {locale === "uz" ? "Yo'nalishni tanlang" : locale === "ru" ? "Выберите направление" : "Choose a direction"}
          </span>
        </div>
        <ShiftingDropDown
          groups={MARKETPLACE_CATEGORY_GROUPS}
          locale={locale}
          onSelectCategory={onSelectCategory}
          selectedCategory={selectedCategory}
        />
      </div>
    </section>
  );
}
