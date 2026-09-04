import { businesses, findBusiness, getBusinessReviews, searchBusinesses } from "./demo-data";
import type {
  Achievement,
  BusinessBadge,
  BusinessPlatform,
  CommunityList,
  ConciergeReply,
  DiscoverableUser,
  FeedItem,
  Occasion,
  SocialActivity,
  SubscriptionPlan,
  UserProfile
} from "./platform-types";

const badge = (
  slug: BusinessBadge["slug"],
  emoji: string,
  uz: string,
  ru: string,
  en: string
): BusinessBadge => ({
  slug,
  emoji,
  label: { uz, ru, en }
});

const profileExtras: Record<string, Partial<BusinessPlatform>> = {
  "yunusobod-osh-markazi": {
    badges: [
      badge("family-friendly", "👨‍👩‍👧", "Oilaviy", "Для семьи", "Family Friendly"),
      badge("large-portions", "🍽", "Katta porsiya", "Большие порции", "Large Portions"),
      badge("best-value", "💰", "Arzon va to'ying", "Выгодно", "Best Value"),
      badge("halal", "🕌", "Halol", "Халяль", "Halal")
    ],
    liveStatus: {
      level: "busy",
      label: { uz: "Hozir band", ru: "Сейчас занято", en: "Busy now" },
      waitMinutes: 15,
      noiseLevel: "medium",
      parking: "limited",
      updatedAt: "2026-06-27T12:00:00.000Z"
    },
    qualityScore: {
      overall: 92,
      reviewQuality: 94,
      freshness: 88,
      popularity: 96,
      returnVisitors: 90,
      responseSpeed: 85,
      photoQuality: 91
    },
    insight: {
      aiSummary: {
        uz: "Osh va porsiyalar yuqori baholanadi. Dam olish kunlari xizmat sekinroq bo'lishi mumkin.",
        ru: "Плов и порции высоко оцениваются. По выходным обслуживание может быть медленнее.",
        en: "People love the plov and generous portions but often mention slower service on weekends."
      },
      monthlyViews: 12458,
      bookmarksToday: 45,
      trendingRank: 2
    },
    socialProof: { friendsVisited: 12, bookmarkedCount: 890, orderedToday: 180 }
  },
  "caravan-coffee": {
    badges: [
      badge("remote-work", "💻", "Masofaviy ish", "Для работы", "Remote Work"),
      badge("study-spot", "📚", "O'qish joyi", "Для учёбы", "Study Spot"),
      badge("eco-friendly", "🌱", "Eco", "Эко", "Eco Friendly"),
      badge("open-late", "🌙", "Kech ochiq", "До поздна", "Open Late")
    ],
    liveStatus: {
      level: "moderate",
      label: { uz: "O'rtacha band", ru: "Умеренно", en: "Moderately busy" },
      waitMinutes: 5,
      noiseLevel: "low",
      parking: "available",
      updatedAt: "2026-06-27T12:00:00.000Z"
    },
    qualityScore: {
      overall: 89,
      reviewQuality: 90,
      freshness: 92,
      popularity: 84,
      returnVisitors: 88,
      responseSpeed: 93,
      photoQuality: 87
    },
    insight: {
      aiSummary: {
        uz: "Sokin muhit va barista sifati yuqori. Wi-Fi barqaror, rozetkalar ko'p.",
        ru: "Тихая атмосфера и хороший барista. Стабильный Wi-Fi, много розеток.",
        en: "Quiet atmosphere and excellent coffee. Reliable Wi-Fi with plenty of outlets."
      },
      monthlyViews: 8230,
      bookmarksToday: 28,
      trendingRank: 5
    },
    socialProof: { friendsVisited: 8, bookmarkedCount: 412 }
  },
  "chilonzor-somsa-saroyi": {
    badges: [
      badge("best-value", "💰", "Eng arzon", "Самый выгодный", "Best Value"),
      badge("large-portions", "🍽", "Katta somsa", "Большая самса", "Large Portions"),
      badge("open-late", "🌙", "Kech ochiq", "До поздна", "Open Late")
    ],
    liveStatus: {
      level: "quiet",
      label: { uz: "Sokin", ru: "Спокойно", en: "Quiet" },
      waitMinutes: 0,
      noiseLevel: "low",
      parking: "available",
      updatedAt: "2026-06-27T12:00:00.000Z"
    },
    qualityScore: {
      overall: 86,
      reviewQuality: 82,
      freshness: 90,
      popularity: 88,
      returnVisitors: 85,
      responseSpeed: 91,
      photoQuality: 80
    },
    insight: {
      aiSummary: {
        uz: "Tandir somsa va tez xizmat — eng ko'p tilga olinadigan fikrlar.",
        ru: "Тандырная самса и быстрое обслуживание — главные плюсы.",
        en: "Tandir somsa and fast service are what reviewers mention most."
      },
      monthlyViews: 6100,
      bookmarksToday: 19,
      trendingRank: 8
    },
    socialProof: { friendsVisited: 5, bookmarkedCount: 230 }
  },
  "glow-beauty": {
    badges: [
      badge("accessible", "♿️", "Qulay kirish", "Доступно", "Accessible"),
      badge("child-friendly", "👶", "Bolalar bilan", "С детьми", "Child Friendly"),
      badge("easy-parking", "🚗", "Avtoturargoh", "Парковка", "Easy Parking")
    ],
    liveStatus: {
      level: "moderate",
      label: { uz: "Bronlar bor", ru: "Есть записи", en: "Bookings active" },
      waitMinutes: 20,
      noiseLevel: "low",
      parking: "available",
      updatedAt: "2026-06-27T12:00:00.000Z"
    },
    qualityScore: {
      overall: 88,
      reviewQuality: 91,
      freshness: 86,
      popularity: 79,
      returnVisitors: 92,
      responseSpeed: 88,
      photoQuality: 94
    },
    insight: {
      aiSummary: {
        uz: "Ustalar malakasi va toza salon yuqori baholanadi. Narxlari premium segmentda.",
        ru: "Мастера и чистота салона высоко оцениваются. Цены в премиум-сегменте.",
        en: "Skilled staff and clean salon get consistent praise. Prices reflect the premium tier."
      },
      monthlyViews: 3200,
      bookmarksToday: 11
    },
    socialProof: { friendsVisited: 3, bookmarkedCount: 156 }
  }
};

export const feedItems: FeedItem[] = [
  {
    id: "feed_trending",
    type: "trending",
    emoji: "🔥",
    title: { uz: "Bugun trendda", ru: "В тренде сегодня", en: "Trending today" },
    subtitle: { uz: "Toshkentda eng ko'p ko'rilgan joylar", ru: "Самые просматриваемые места", en: "Most viewed places in Tashkent" },
    businessSlugs: ["yunusobod-osh-markazi", "caravan-coffee", "chilonzor-somsa-saroyi"]
  },
  {
    id: "feed_social_ali",
    type: "social",
    emoji: "👤",
    title: { uz: "Ali tashrif buyurdi", ru: "Ali посетил", en: "Ali visited" },
    subtitle: { uz: "Yunusobod Osh Markazi — 5★", ru: "Yunusobod Osh Markazi — 5★", en: "Yunusobod Osh Markazi — 5★" },
    businessSlugs: ["yunusobod-osh-markazi"],
    actorName: "Ali Karimov"
  },
  {
    id: "feed_new_japanese",
    type: "new-opening",
    emoji: "🍣",
    title: { uz: "Yangi yapon restorani", ru: "Новый японский ресторан", en: "New Japanese restaurant" },
    subtitle: { uz: "Mirobodda ochilgan — tez orada", ru: "Открылся в Мирабаде", en: "Just opened in Mirobod" },
    businessSlugs: ["caravan-coffee"]
  },
  {
    id: "feed_eco",
    type: "badge-collection",
    emoji: "🌱",
    title: { uz: "Eco-friendly kafelar", ru: "Эко-кафе", en: "Eco-friendly cafés" },
    subtitle: { uz: "Barqaror va sokin joylar", ru: "Устойчивые и спокойные места", en: "Sustainable calm spots" },
    businessSlugs: ["caravan-coffee"]
  },
  {
    id: "feed_birthday",
    type: "occasion",
    emoji: "🎂",
    title: { uz: "Tug'ilgan kun g'oyalari", ru: "Идеи на день рождения", en: "Birthday ideas" },
    subtitle: { uz: "Restoran + tort + dekor — bitta reja", ru: "Ресторан + торт + декор", en: "Restaurant + cake + decor in one plan" },
    businessSlugs: ["yunusobod-osh-markazi", "glow-beauty"],
    occasionSlug: "birthday"
  },
  {
    id: "feed_remote",
    type: "badge-collection",
    emoji: "💻",
    title: { uz: "Ish uchun eng yaxshi kafelar", ru: "Лучшие кафе для работы", en: "Best work cafés" },
    subtitle: { uz: "Wi-Fi, rozetka, sokin muhit", ru: "Wi-Fi, розетки, тишина", en: "Wi-Fi, outlets, quiet vibe" },
    businessSlugs: ["caravan-coffee"]
  }
];

export const occasions: Occasion[] = [
  {
    slug: "birthday",
    emoji: "🎂",
    name: { uz: "Tug'ilgan kun", ru: "День рождения", en: "Birthday" },
    description: {
      uz: "Restoran, tort, dekor va foto — bitta tayyor paket.",
      ru: "Ресторан, торт, декор и фото — готовый пакет.",
      en: "Restaurant, cake, decor, and photos in one package."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Tort do'koni", ru: "Кондитерская", en: "Cake shop" },
      { uz: "Dekoratsiya", ru: "Декор", en: "Decorations" },
      { uz: "Fotograf", ru: "Фотограф", en: "Photographer" },
      { uz: "Gullar", ru: "Цветы", en: "Flowers" },
      { uz: "Taxi", ru: "Такси", en: "Taxi" }
    ],
    businessSlugs: ["yunusobod-osh-markazi", "glow-beauty"]
  },
  {
    slug: "date-night",
    emoji: "❤️",
    name: { uz: "Date night", ru: "Свидание", en: "Date Night" },
    description: {
      uz: "Romantik atmosfera va yaxshi xizmat.",
      ru: "Романтическая атмосфера и хороший сервис.",
      en: "Romantic atmosphere and great service."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Gullar", ru: "Цветы", en: "Flowers" },
      { uz: "Taxi", ru: "Такси", en: "Taxi" }
    ],
    businessSlugs: ["caravan-coffee"]
  },
  {
    slug: "family-dinner",
    emoji: "👨‍👩‍👧",
    name: { uz: "Oilaviy kechki ovqat", ru: "Семейный ужин", en: "Family Dinner" },
    description: {
      uz: "Bolalar uchun qulay va katta stollar.",
      ru: "Удобно с детьми и большие столы.",
      en: "Kid-friendly with spacious seating."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Avtoturargoh", ru: "Парковка", en: "Parking" }
    ],
    businessSlugs: ["yunusobod-osh-markazi", "chilonzor-somsa-saroyi"]
  },
  {
    slug: "business-meeting",
    emoji: "☕️",
    name: { uz: "Biznes uchrashuv", ru: "Деловая встреча", en: "Business Meeting" },
    description: {
      uz: "Sokin joy, Wi-Fi va qulay stollar.",
      ru: "Тихое место, Wi-Fi и удобные столы.",
      en: "Quiet spot with Wi-Fi and comfortable tables."
    },
    packageItems: [
      { uz: "Kafe", ru: "Кафе", en: "Café" },
      { uz: "Konferens zal", ru: "Переговорная", en: "Meeting room" }
    ],
    businessSlugs: ["caravan-coffee"]
  },
  {
    slug: "team-building",
    emoji: "🥳",
    name: { uz: "Jamoa tadbir", ru: "Тимбилдинг", en: "Team Building" },
    description: {
      uz: "Katta guruhlar uchun joy va menyu.",
      ru: "Место и меню для больших групп.",
      en: "Space and menu for large groups."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Ko'ngilochar dastur", ru: "Развлечения", en: "Entertainment" }
    ],
    businessSlugs: ["yunusobod-osh-markazi"]
  },
  {
    slug: "kids-party",
    emoji: "👶",
    name: { uz: "Bolalar bazmi", ru: "Детский праздник", en: "Kids Party" },
    description: {
      uz: "Bolalar uchun xavfsiz va qiziqarli joylar.",
      ru: "Безопасные и весёлые места для детей.",
      en: "Safe fun places for children."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Animatsiya", ru: "Аниматор", en: "Entertainment" },
      { uz: "Tort", ru: "Торт", en: "Cake" }
    ],
    businessSlugs: ["yunusobod-osh-markazi"]
  },
  {
    slug: "graduation",
    emoji: "🎓",
    name: { uz: "Bitiruv", ru: "Выпускной", en: "Graduation" },
    description: {
      uz: "Guruh uchun bayram kechasi.",
      ru: "Праздничный вечер для группы.",
      en: "Celebration dinner for your group."
    },
    packageItems: [
      { uz: "Restoran", ru: "Ресторан", en: "Restaurant" },
      { uz: "Fotograf", ru: "Фотограф", en: "Photographer" }
    ],
    businessSlugs: ["yunusobod-osh-markazi", "caravan-coffee"]
  }
];

export const communityLists: CommunityList[] = [
  {
    slug: "best-burgers-tashkent",
    title: { uz: "Toshkentdagi eng yaxshi burgerlar", ru: "Лучшие бургеры Ташкента", en: "Best burgers in Tashkent" },
    description: {
      uz: "Mahalliy burger ixlosmandlari tomonidan tanlangan.",
      ru: "Выбор местных любителей бургеров.",
      en: "Curated by local burger fans."
    },
    authorName: "Sara N.",
    followerCount: 2340,
    businessSlugs: ["yunusobod-osh-markazi"],
    tags: ["Burger", "Trend"]
  },
  {
    slug: "hidden-cafes",
    title: { uz: "Yashirin kafelar", ru: "Скрытые кафе", en: "Hidden cafés" },
    description: {
      uz: "Kam odam biladigan sokin joylar.",
      ru: "Тихие места, о которых мало кто знает.",
      en: "Quiet spots most people miss."
    },
    authorName: "John K.",
    followerCount: 1890,
    businessSlugs: ["caravan-coffee"],
    tags: ["Coffee", "Hidden gem"]
  },
  {
    slug: "cheap-lunches",
    title: { uz: "Arzon tushliklar", ru: "Дешёвые обеды", en: "Cheap lunches" },
    description: {
      uz: "40,000 so'mdan kam tushlik joylari.",
      ru: "Обеды до 40 000 сум.",
      en: "Lunch spots under 40,000 UZS."
    },
    authorName: "Dilnoza M.",
    followerCount: 4120,
    businessSlugs: ["chilonzor-somsa-saroyi", "yunusobod-osh-markazi"],
    tags: ["Budget", "Lunch"]
  },
  {
    slug: "date-night-spots",
    title: { uz: "Date night joylari", ru: "Места для свиданий", en: "Date night spots" },
    description: {
      uz: "Romantik kechalar uchun eng yaxshi tanlovlar.",
      ru: "Лучшие места для романтического вечера.",
      en: "Top picks for romantic evenings."
    },
    authorName: "Malika T.",
    followerCount: 1560,
    businessSlugs: ["caravan-coffee"],
    tags: ["Romantic", "Date"]
  }
];

export const socialActivities: SocialActivity[] = [
  {
    id: "act_1",
    actorName: "Ali Karimov",
    action: { uz: "tashrif buyurdi va 5★ berdi", ru: "посетил и поставил 5★", en: "visited and rated 5★" },
    businessSlug: "yunusobod-osh-markazi",
    rating: 5,
    createdAt: "2026-06-27T09:00:00.000Z"
  },
  {
    id: "act_2",
    actorName: "Sara N.",
    action: { uz: "tavsiya qildi", ru: "рекомендует", en: "recommends" },
    businessSlug: "caravan-coffee",
    createdAt: "2026-06-27T08:30:00.000Z"
  },
  {
    id: "act_3",
    actorName: "Dilnoza M.",
    action: { uz: "Top 10 kafelar ro'yxatiga qo'shdi", ru: "добавила в Top 10 кафе", en: "added to Top 10 cafés list" },
    businessSlug: "caravan-coffee",
    createdAt: "2026-06-26T18:00:00.000Z"
  }
];

export const achievements: Achievement[] = [
  {
    slug: "food-explorer",
    emoji: "🍽",
    name: { uz: "Taom kashfiyochisi", ru: "Исследователь еды", en: "Food Explorer" },
    description: { uz: "10 ta restoran sharhladi", ru: "10 ресторанов", en: "Reviewed 10 restaurants" }
  },
  {
    slug: "coffee-expert",
    emoji: "☕",
    name: { uz: "Qahva mutaxassisi", ru: "Кофейный эксперт", en: "Coffee Expert" },
    description: { uz: "5 ta kafe sharhladi", ru: "5 кофеен", en: "Reviewed 5 cafés" }
  },
  {
    slug: "top-photographer",
    emoji: "📸",
    name: { uz: "Top fotograf", ru: "Топ фотограф", en: "Top Photographer" },
    description: { uz: "50 ta rasm yukladi", ru: "50 фото", en: "Uploaded 50 photos" }
  },
  {
    slug: "local-guide",
    emoji: "🗺",
    name: { uz: "Mahalliy gid", ru: "Местный гид", en: "Local Guide" },
    description: { uz: "3 ta ro'yxat yaratdi", ru: "3 списка", en: "Created 3 lists" }
  }
];

export function enrichBusiness(business: (typeof businesses)[number]): BusinessPlatform {
  return { ...business, ...profileExtras[business.slug] };
}

export function getPlatformBusinesses(): BusinessPlatform[] {
  return businesses.map(enrichBusiness);
}

export function getPlatformBusiness(slug: string) {
  const business = findBusiness(slug);
  if (!business) {
    return undefined;
  }

  return {
    business: enrichBusiness(business),
    reviews: getBusinessReviews(slug)
  };
}

export function searchPlatformBusinesses(query = "", category = "all") {
  return searchBusinesses(query, category).map(enrichBusiness);
}

export function getFeedItems() {
  return feedItems;
}

export function getOccasions() {
  return occasions;
}

export function getOccasion(slug: string) {
  return occasions.find((occasion) => occasion.slug === slug);
}

export function getCommunityLists() {
  return communityLists;
}

export function getCommunityList(slug: string) {
  return communityLists.find((list) => list.slug === slug);
}

export function getSocialActivities() {
  return socialActivities;
}

export function getAchievements() {
  return achievements;
}

export const discoverableUsers: DiscoverableUser[] = [
  {
    id: "user_sara",
    displayName: "Sara N.",
    handle: "sara_eats",
    bio: {
      uz: "Toshkent burger va kafe ixlosmandi.",
      ru: "Любитель бургеров и кафе Ташкента.",
      en: "Tashkent burger and café enthusiast."
    },
    followerCount: 2340,
    reviewCount: 86,
    listCount: 12,
    topCategory: { uz: "Restoranlar", ru: "Рестораны", en: "Restaurants" }
  },
  {
    id: "user_john",
    displayName: "John K.",
    handle: "hidden_gems_uz",
    bio: {
      uz: "Yashirin kafelar va ish joylari haqida yozadi.",
      ru: "Пишет о скрытых кафе и местах для работы.",
      en: "Writes about hidden cafés and work spots."
    },
    followerCount: 1890,
    reviewCount: 54,
    listCount: 8,
    topCategory: { uz: "Qahvaxonalar", ru: "Кофейни", en: "Cafés" }
  },
  {
    id: "user_dilnoza",
    displayName: "Dilnoza M.",
    handle: "budget_lunch",
    bio: {
      uz: "Arzon va mazali tushliklar qidiruvchi.",
      ru: "Ищет недорогие и вкусные обеды.",
      en: "Hunts for cheap delicious lunches."
    },
    followerCount: 4120,
    reviewCount: 120,
    listCount: 15,
    topCategory: { uz: "Arzon ovqat", ru: "Бюджетная еда", en: "Budget food" }
  }
];

export const demoUserProfile: UserProfile = {
  id: "user_azizbek",
  displayName: "Azizbek Rahimov",
  handle: "azizbek_tashkent",
  memberSince: "2026-03-01",
  locale: "uz",
  bio: {
    uz: "Toshkentda yangi joylarni sinab ko'rishni yaxshi ko'raman.",
    ru: "Люблю пробовать новые места в Ташкенте.",
    en: "Love trying new places around Tashkent."
  },
  stats: {
    reviews: 18,
    saved: 2,
    photos: 34,
    lists: 1,
    followers: 128,
    following: 2
  },
  earnedAchievementSlugs: ["food-explorer", "coffee-expert"],
  followingUserIds: ["user_sara", "user_john"],
  defaultSavedSlugs: ["caravan-coffee", "yunusobod-osh-markazi"],
  defaultFollowedListSlugs: ["hidden-cafes"]
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    slug: "free",
    name: { uz: "Free", ru: "Free", en: "Free" },
    priceLabel: { uz: "Bepul", ru: "Бесплатно", en: "Free" },
    description: {
      uz: "Asosiy biznes profili va sharhlar.",
      ru: "Базовый профиль и отзывы.",
      en: "Basic business profile and reviews."
    },
    features: [
      { label: { uz: "Biznes profili", ru: "Профиль", en: "Business profile" }, included: true },
      { label: { uz: "Rasmlar", ru: "Фото", en: "Photos" }, included: true },
      { label: { uz: "Sharhlar", ru: "Отзывы", en: "Reviews" }, included: true },
      { label: { uz: "Manzil va ish vaqti", ru: "Адрес и часы", en: "Address & hours" }, included: true },
      { label: { uz: "Analytics", ru: "Аналитика", en: "Analytics" }, included: false },
      { label: { uz: "AI javoblar", ru: "AI-ответы", en: "AI replies" }, included: false }
    ]
  },
  {
    slug: "pro",
    name: { uz: "Pro", ru: "Pro", en: "Pro" },
    priceLabel: { uz: "Tez orada", ru: "Скоро", en: "Coming soon" },
    description: {
      uz: "Kafelar, restoranlar va salonlar uchun.",
      ru: "Для кафе, ресторанов и салонов.",
      en: "For cafés, restaurants, and salons."
    },
    highlight: true,
    features: [
      { label: { uz: "Free'dagi hamma narsa", ru: "Всё из Free", en: "Everything in Free" }, included: true },
      { label: { uz: "Ko'proq rasmlar", ru: "Больше фото", en: "More photos" }, included: true },
      { label: { uz: "Analytics", ru: "Аналитика", en: "Analytics" }, included: true },
      { label: { uz: "Aksiyalar", ru: "Акции", en: "Promotions" }, included: true },
      { label: { uz: "AI sharh javoblari", ru: "AI-ответы на отзывы", en: "AI review replies" }, included: true },
      { label: { uz: "Menyu boshqaruvi", ru: "Управление меню", en: "Menu management" }, included: true },
      { label: { uz: "Sponsored joylash", ru: "Спонсорство", en: "Sponsored placement" }, included: false }
    ]
  },
  {
    slug: "max",
    name: { uz: "Max", ru: "Max", en: "Max" },
    priceLabel: { uz: "Tez orada", ru: "Скоро", en: "Coming soon" },
    description: {
      uz: "O'rnatilgan bizneslar va zanjirlar uchun.",
      ru: "Для устоявшихся бизнесов и сетей.",
      en: "For established businesses and chains."
    },
    features: [
      { label: { uz: "Pro'dagi hamma narsa", ru: "Всё из Pro", en: "Everything in Pro" }, included: true },
      { label: { uz: "Sponsored placement", ru: "Спонсорское размещение", en: "Sponsored placement" }, included: true },
      { label: { uz: "Advanced analytics", ru: "Расширенная аналитика", en: "Advanced analytics" }, included: true },
      { label: { uz: "Mijoz segmentatsiyasi", ru: "Сегментация клиентов", en: "Customer segmentation" }, included: true },
      { label: { uz: "AI marketing assistant", ru: "AI-маркетинг", en: "AI marketing assistant" }, included: true },
      { label: { uz: "Booking tools", ru: "Бронирование", en: "Booking tools" }, included: true }
    ]
  }
];

export const conciergePrompts = [
  {
    uz: "5 soat ishlaydigan sokin kafe toping",
    ru: "Найди тихое кафе для работы 5 часов",
    en: "Find a quiet café to work for 5 hours"
  },
  {
    uz: "4 kishi uchun 300,000 so'm budget",
    ru: "Бюджет 300 000 сум на 4 человека",
    en: "300,000 UZS budget for 4 people"
  },
  {
    uz: "Tug'ilgan kun uchun oilaviy joy",
    ru: "Семейное место на день рождения",
    en: "Family-friendly birthday spot"
  }
];

export function getDiscoverableUsers() {
  return discoverableUsers;
}

export function getDiscoverableUser(id: string) {
  return discoverableUsers.find((user) => user.id === id);
}

export function getUserProfile() {
  return demoUserProfile;
}

export function getSubscriptionPlans() {
  return subscriptionPlans;
}

export function getConciergePrompts() {
  return conciergePrompts;
}

export function getConciergeReply(input: string): ConciergeReply {
  const normalized = input.toLowerCase();

  if (normalized.includes("sokin") || normalized.includes("quiet") || normalized.includes("ish") || normalized.includes("work")) {
    return {
      text: {
        uz: "Caravan Coffee sokin muhit, barqaror Wi-Fi va ko'p rozetka bilan eng mos tanlov.",
        ru: "Caravan Coffee — лучший выбор с тихой атмосферой, Wi-Fi и розетками.",
        en: "Caravan Coffee is your best match — quiet vibe, reliable Wi-Fi, and plenty of outlets."
      },
      suggestions: [
        {
          businessSlug: "caravan-coffee",
          reason: { uz: "💻 Remote Work badge", ru: "💻 Remote Work", en: "💻 Remote Work badge" }
        }
      ]
    };
  }

  if (normalized.includes("300") || normalized.includes("arzon") || normalized.includes("budget") || normalized.includes("cheap")) {
    return {
      text: {
        uz: "Chilonzor Somsa Saroyi 4 kishi uchun arzon va to'ying ovqat bilan mos keladi.",
        ru: "Chilonzor Somsa Saroyi подойдёт для 4 человек с бюджетным сытным обедом.",
        en: "Chilonzor Somsa Saroyi fits 4 people with affordable, filling local food."
      },
      suggestions: [
        {
          businessSlug: "chilonzor-somsa-saroyi",
          reason: { uz: "💰 Best Value", ru: "💰 Best Value", en: "💰 Best Value" }
        },
        {
          businessSlug: "yunusobod-osh-markazi",
          reason: { uz: "🍽 Katta porsiya", ru: "🍽 Большие порции", en: "🍽 Large portions" }
        }
      ]
    };
  }

  if (normalized.includes("birthday") || normalized.includes("tug'ilgan") || normalized.includes("oilaviy") || normalized.includes("family")) {
    return {
      text: {
        uz: "Yunusobod Osh Markazi oilaviy kechalar va katta guruhlar uchun yaxshi tanlov.",
        ru: "Yunusobod Osh Markazi хорош для семейных вечеров и больших компаний.",
        en: "Yunusobod Osh Markazi works well for family dinners and group celebrations."
      },
      suggestions: [
        {
          businessSlug: "yunusobod-osh-markazi",
          reason: { uz: "👨‍👩‍👧 Family Friendly", ru: "👨‍👩‍👧 Для семьи", en: "👨‍👩‍👧 Family Friendly" }
        }
      ]
    };
  }

  return {
    text: {
      uz: "Hozircha trenddagi joylarni tavsiya qilaman. Aniqroq budget, muhit yoki voqea ayting.",
      ru: "Пока рекомендую трендовые места. Уточните бюджет, атмосферу или повод.",
      en: "For now I'd suggest trending spots. Tell me your budget, vibe, or occasion for sharper picks."
    },
    suggestions: [
      {
        businessSlug: "yunusobod-osh-markazi",
        reason: { uz: "🔥 Trendda", ru: "🔥 В тренде", en: "🔥 Trending" }
      },
      {
        businessSlug: "caravan-coffee",
        reason: { uz: "☕️ Mashhur kafe", ru: "☕️ Популярное кафе", en: "☕️ Popular café" }
      }
    ]
  };
}
