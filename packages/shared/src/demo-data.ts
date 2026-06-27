import type { Business, Category, Review } from "./types";

export const categories: Category[] = [
  {
    id: "cat_restaurants",
    slug: "restaurants",
    name: { uz: "Restoranlar", ru: "Рестораны", en: "Restaurants" }
  },
  {
    id: "cat_cafes",
    slug: "cafes",
    name: { uz: "Qahvaxonalar", ru: "Кофейни", en: "Cafes" }
  },
  {
    id: "cat_beauty",
    slug: "beauty",
    name: { uz: "Go'zallik", ru: "Красота", en: "Beauty" }
  },
  {
    id: "cat_auto",
    slug: "auto",
    name: { uz: "Avtoservis", ru: "Автосервис", en: "Auto service" }
  },
  {
    id: "cat_repairs",
    slug: "repairs",
    name: { uz: "Ta'mirlash", ru: "Ремонт", en: "Repairs" }
  }
];

export const businesses: Business[] = [
  {
    id: "biz_yunusobod_osh",
    slug: "yunusobod-osh-markazi",
    name: "Yunusobod Osh Markazi",
    categorySlug: "restaurants",
    description: {
      uz: "Oilaviy osh markazi, tushlik payti tez xizmat va katta porsiyalari bilan mashhur.",
      ru: "Семейный центр плова с быстрым обслуживанием и большими порциями.",
      en: "Family plov restaurant known for fast lunch service and generous portions."
    },
    address: "Bog'ishamol ko'chasi, Toshkent",
    district: "Yunusobod",
    city: "Tashkent",
    phone: "+998 90 000 00 01",
    lat: 41.3567,
    lng: 69.2846,
    hours: "10:00 - 22:00",
    priceTier: "$$",
    status: "unclaimed",
    avgRating: 4.8,
    reviewCount: 1240,
    photo: "plov",
    tags: ["Ochiq", "Milliy taomlar", "Oilaviy"],
    foundingBusiness: true
  },
  {
    id: "biz_caravan_coffee",
    slug: "caravan-coffee",
    name: "Caravan Coffee",
    categorySlug: "cafes",
    description: {
      uz: "Ishlash va uchrashuvlar uchun sokin qahvaxona.",
      ru: "Спокойная кофейня для работы и встреч.",
      en: "Calm coffee shop for work and meetings."
    },
    address: "Shahrisabz ko'chasi, Toshkent",
    district: "Mirobod",
    city: "Tashkent",
    phone: "+998 90 000 00 02",
    lat: 41.3031,
    lng: 69.2797,
    hours: "08:00 - 23:00",
    priceTier: "$$$",
    status: "claimed",
    avgRating: 4.7,
    reviewCount: 328,
    photo: "coffee",
    tags: ["Wi-Fi", "Ochiq", "Qahva"],
    foundingBusiness: true
  },
  {
    id: "biz_chilonzor_somsa",
    slug: "chilonzor-somsa-saroyi",
    name: "Chilonzor Somsa Saroyi",
    categorySlug: "restaurants",
    description: {
      uz: "Tandir somsa va milliy pishiriqlar.",
      ru: "Тандырная самса и национальная выпечка.",
      en: "Tandir somsa and local pastries."
    },
    address: "Bunyodkor shoh ko'chasi, Toshkent",
    district: "Chilonzor",
    city: "Tashkent",
    phone: "+998 90 000 00 03",
    lat: 41.2854,
    lng: 69.2032,
    hours: "09:00 - 21:00",
    priceTier: "$",
    status: "unclaimed",
    avgRating: 4.6,
    reviewCount: 850,
    photo: "somsa",
    tags: ["Ochiq", "Somsa", "Tez xizmat"]
  },
  {
    id: "biz_glow_beauty",
    slug: "glow-beauty",
    name: "Glow Beauty",
    categorySlug: "beauty",
    description: {
      uz: "Chilonzorda premium go'zallik saloni.",
      ru: "Премиальный салон красоты в Чиланзаре.",
      en: "Premium beauty salon in Chilonzor."
    },
    address: "Chilonzor 3-mavze, Toshkent",
    district: "Chilonzor",
    city: "Tashkent",
    phone: "+998 90 000 00 04",
    hours: "10:00 - 20:00",
    priceTier: "$$$",
    status: "pending_claim",
    avgRating: 4.7,
    reviewCount: 214,
    photo: "beauty",
    tags: ["Go'zallik", "Bron qilishsiz", "Premium"]
  }
];

export const reviews: Review[] = [
  {
    id: "rev_azizbek",
    businessSlug: "yunusobod-osh-markazi",
    authorName: "Azizbek Rahimov",
    authorBadge: "Ta'sischi sharhlovchi",
    rating: 5,
    text: "Osh juda mazali, xizmat tez. Narx va joylashuvni oldindan ko'rib borganim qulay bo'ldi.",
    locale: "uz",
    createdAt: "2026-06-20T10:00:00.000Z",
    helpfulCount: 18
  },
  {
    id: "rev_dilnoza",
    businessSlug: "yunusobod-osh-markazi",
    authorName: "Dilnoza Nurmatova",
    authorBadge: "18 ta sharh",
    rating: 4.7,
    text: "Kartadagi masofa va ish vaqti to'g'ri chiqdi. Rasmlar ham tanlashda yordam berdi.",
    locale: "uz",
    createdAt: "2026-06-21T10:00:00.000Z",
    helpfulCount: 9
  }
];

export function searchBusinesses(query = "", category = "all"): Business[] {
  const normalizedQuery = query.trim().toLowerCase();

  return businesses.filter((business) => {
    const categoryMatches = category === "all" || business.categorySlug === category;
    const queryMatches =
      normalizedQuery.length === 0 ||
      `${business.name} ${business.district} ${business.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);

    return categoryMatches && queryMatches;
  });
}

export function findBusiness(slug: string): Business | undefined {
  return businesses.find((business) => business.slug === slug);
}

export function getBusinessReviews(slug: string): Review[] {
  return reviews.filter((review) => review.businessSlug === slug);
}
