import type { Locale } from "@manzil/shared";
import type { IconName } from "../components/vm/icons";

export type LocalizedCopy = Record<Locale, string>;

export type TravelActivityCategory = {
  slug: string;
  label: LocalizedCopy;
  description: LocalizedCopy;
  icon: IconName;
  accent: string;
  /** Reserved for the future catalog taxonomy; pages do not depend on it. */
  apiCategory?: string;
};

const copy = (uz: string, ru: string, en: string): LocalizedCopy => ({ uz, ru, en });

export const TRAVEL_ACTIVITIES_ROOT: TravelActivityCategory = {
  slug: "travel-activities",
  label: copy("Sayohat va faoliyat", "Путешествия и досуг", "Travel & Activities"),
  description: copy(
    "Sayohat, hordiq va ko'ngilochar joylarni toping.",
    "Находите места для путешествий, отдыха и впечатлений.",
    "Find places for travel, leisure, and things to do in Tashkent."
  ),
  icon: "compass",
  accent: "#7c3aed"
};

export const TRAVEL_ACTIVITY_CATEGORIES: TravelActivityCategory[] = [
  {
    slug: "things-to-do",
    label: copy("Qiziqarli mashg'ulotlar", "Чем заняться", "Things to Do"),
    description: copy(
      "Toshkentda bugun yoki dam olish kunlari qiladigan ishlar.",
      "Идеи, чем заняться сегодня или на выходных в Ташкенте.",
      "Ideas for today, tonight, or the weekend in Tashkent."
    ),
    icon: "compass",
    accent: "#6d28d9",
    apiCategory: "entertainment"
  },
  {
    slug: "kids-activities-camps",
    label: copy("Bolalar mashg'ulotlari va lagerlar", "Детские занятия и лагеря", "Kids Activities & Camps"),
    description: copy(
      "Bolalar uchun mashg'ulotlar, to'garaklar va lagerlar.",
      "Занятия, кружки и лагеря для детей.",
      "Classes, camps, and activities for children."
    ),
    icon: "users",
    accent: "#db2777",
    apiCategory: "entertainment"
  },
  {
    slug: "venues-events",
    label: copy("Tadbir joylari", "Площадки и мероприятия", "Venues & Events"),
    description: copy(
      "Tadbir, uchrashuv va bayramlar uchun joylar.",
      "Площадки для мероприятий, встреч и праздников.",
      "Spaces for events, gatherings, and celebrations."
    ),
    icon: "calendar",
    accent: "#c026d3",
    apiCategory: "events"
  },
  {
    slug: "mosques",
    label: copy("Masjidlar", "Мечети", "Mosques"),
    description: copy(
      "Toshkentdagi masjidlar va ibodat joylari.",
      "Мечети и места для молитвы в Ташкенте.",
      "Mosques and places of worship in Tashkent."
    ),
    icon: "home",
    accent: "#15803d"
  },
  {
    slug: "shopping-malls",
    label: copy("Savdo markazlari", "Торговые центры", "Shopping Malls"),
    description: copy(
      "Xarid, ovqatlanish va hordiq uchun savdo markazlari.",
      "Торговые центры для покупок, еды и отдыха.",
      "Shopping centres for retail, food, and leisure."
    ),
    icon: "storefront",
    accent: "#2563eb",
    apiCategory: "shopping"
  },
  {
    slug: "bookstores",
    label: copy("Kitob do'konlari", "Книжные магазины", "Bookstores"),
    description: copy(
      "Kitob, o'qish va yangi g'oyalar uchun joylar.",
      "Книжные магазины для чтения и новых идей.",
      "Bookshops for readers, learners, and curious minds."
    ),
    icon: "book_open",
    accent: "#1d4ed8"
  },
  {
    slug: "mini-golf",
    label: copy("Mini golf", "Мини-гольф", "Mini Golf"),
    description: copy(
      "Do'stlar va oila bilan mini golf o'ynash joylari.",
      "Мини-гольф для друзей и всей семьи.",
      "Mini golf for friends, families, and casual play."
    ),
    icon: "circle",
    accent: "#16a34a"
  },
  {
    slug: "bowling",
    label: copy("Bouling", "Боулинг", "Bowling"),
    description: copy(
      "Guruh bilan o'ynash va dam olish uchun bouling joylari.",
      "Боулинг для компаний и активного отдыха.",
      "Bowling venues for groups and casual nights out."
    ),
    icon: "circle",
    accent: "#ea580c"
  },
  {
    slug: "hotels",
    label: copy("Mehmonxonalar", "Отели", "Hotels"),
    description: copy(
      "Toshkentda tunash va sayohatni rejalash uchun mehmonxonalar.",
      "Отели для проживания и планирования поездки по Ташкенту.",
      "Hotels for staying in and planning a Tashkent trip."
    ),
    icon: "home",
    accent: "#0f766e",
    apiCategory: "resort"
  },
  {
    slug: "taxis",
    label: copy("Taksi", "Такси", "Taxis"),
    description: copy(
      "Shahar bo'ylab harakatlanish uchun taksi xizmatlari.",
      "Такси для поездок по городу.",
      "Taxi services for getting around the city."
    ),
    icon: "car",
    accent: "#ca8a04"
  },
  {
    slug: "bike-rentals",
    label: copy("Velosiped ijarasi", "Прокат велосипедов", "Bike Rentals"),
    description: copy(
      "Velosipedda shaharni aylanib chiqish uchun ijara joylari.",
      "Прокат велосипедов для поездок по городу.",
      "Bike rentals for exploring the city on two wheels."
    ),
    icon: "globe",
    accent: "#0891b2"
  },
  {
    slug: "campgrounds",
    label: copy("Kempinglar", "Кемпинги", "Campgrounds"),
    description: copy(
      "Shahar tashqarisida tabiat qo'ynida tunash va dam olish.",
      "Отдых и ночёвки на природе за пределами города.",
      "Outdoor stays and nature escapes beyond the city."
    ),
    icon: "globe",
    accent: "#15803d",
    apiCategory: "resort"
  },
  {
    slug: "beaches",
    label: copy("Plyajlar", "Пляжи", "Beaches"),
    description: copy(
      "Suv bo'yida hordiq chiqarish va yozgi mashg'ulotlar.",
      "Отдых у воды и летние активности.",
      "Waterfront leisure and summer activities."
    ),
    icon: "compass",
    accent: "#0284c7",
    apiCategory: "resort"
  },
  {
    slug: "swimming-pools",
    label: copy("Basseynlar", "Бассейны", "Swimming Pools"),
    description: copy(
      "Suzish, sport va oilaviy dam olish uchun basseynlar.",
      "Бассейны для плавания, спорта и семейного отдыха.",
      "Pools for swimming, exercise, and family leisure."
    ),
    icon: "compass",
    accent: "#0ea5e9",
    apiCategory: "resort"
  },
  {
    slug: "bars-nightlife",
    label: copy("Barlar va tungi hayot", "Бары и ночная жизнь", "Bars & Nightlife"),
    description: copy(
      "Kechki uchrashuvlar, musiqa va tungi hordiq uchun joylar.",
      "Места для вечерних встреч, музыки и ночного отдыха.",
      "Places for evening meetups, music, and nightlife."
    ),
    icon: "users",
    accent: "#be123c",
    apiCategory: "entertainment"
  }
];

export const TRAVEL_ACTIVITY_ALL_SLUG = "places";

export function localizeTravel(copyValue: LocalizedCopy, locale: Locale): string {
  return copyValue[locale] ?? copyValue.en;
}

export function findTravelActivityCategory(slug: string): TravelActivityCategory | undefined {
  return TRAVEL_ACTIVITY_CATEGORIES.find((category) => category.slug === slug);
}
