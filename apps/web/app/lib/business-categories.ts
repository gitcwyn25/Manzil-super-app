import type { Locale } from "@manzil/shared";
import type { IconName } from "../components/vm/icons";

export type LocalizedCopy = Record<Locale, string>;

export type LeafDefinition = {
  id: string;
  slug: string;
  label: LocalizedCopy;
  icon?: IconName;
  color?: string;
};

const CATEGORY_ICONS: Partial<Record<string, IconName>> = {
  takeout: "utensils", delivery: "send", "hot-trendy": "trending_up", "new-restaurants": "sparkles",
  "breakfast-brunch": "coffee", lunch: "utensils", dinner: "utensils", "coffee-cafes": "coffee", pizza: "tag",
  chinese: "utensils", mexican: "utensils", bakeries: "coffee", italian: "utensils", "food-trucks": "storefront",
  "sports-bars-pubs": "users", "contractors-handymen": "wrench", plumbers: "settings", electricians: "settings",
  "heating-air-conditioning": "settings", "appliances-repair": "settings", roofing: "home", locksmiths: "lock",
  painters: "sparkles", landscaping: "globe", "nurseries-gardening": "globe", florists: "sparkles",
  "tree-services": "trending_up", "home-cleaning": "sparkles", "furniture-stores": "home", movers: "arrow_forward",
  "auto-repair": "wrench", "body-shops": "car", "oil-change": "settings", tires: "circle", towing: "car",
  "car-wash": "car", "auto-detailing": "sparkles", parking: "location", "car-dealers": "storefront", junkyards: "trash",
  dentists: "heart_pulse", doctors: "heart_pulse", chiropractors: "heart_pulse", optometrists: "search",
  dermatologists: "heart_pulse", podiatrists: "heart_pulse", massage: "sparkles", "hair-salons": "scissors",
  "nail-salons": "sparkles", barbers: "scissors", spas: "sparkles", "physical-therapy": "heart_pulse",
  "things-to-do": "compass", "kids-activities-camps": "users", "venues-events": "calendar", mosques: "home",
  "shopping-malls": "storefront", bookstores: "book_open", "mini-golf": "circle", bowling: "circle", hotels: "home",
  taxis: "car", "bike-rentals": "globe", campgrounds: "globe", beaches: "compass", "swimming-pools": "compass",
  "bars-nightlife": "users", "dry-cleaning": "sparkles", laundromats: "settings", "thrift-stores": "storefront",
  "tailors-alterations": "scissors", apartments: "home", "junk-removal": "trash", gyms: "trending_up",
  "yoga-pilates": "compass", "pet-groomers": "sparkles", veterinarians: "heart_pulse", "pet-services": "heart_pulse",
  "banks-credit-unions": "banknote", "real-estate-agents": "home", "language-learning": "book_open",
  catering: "utensils", "event-organizers": "calendar", "parking-more": "location"
};

export type GroupDefinition = {
  id: string;
  rootSlug: string;
  label: LocalizedCopy;
  description: LocalizedCopy;
  icon: IconName;
  accent: string;
  categories: LeafDefinition[];
};

const copy = (uz: string, ru: string, en: string): LocalizedCopy => ({ uz, ru, en });
const leaf = (slug: string, uz: string, ru: string, en: string): LeafDefinition => ({
  id: slug,
  slug,
  label: copy(uz, ru, en),
  icon: CATEGORY_ICONS[slug] ?? "circle"
});


const GROUP_DEFINITIONS: GroupDefinition[] = [
  {
    id: "restaurants",
    rootSlug: "restaurants",
    label: copy("Restoranlar", "Рестораны", "Restaurants"),
    description: copy(
      "Ovqatlanishning barcha yo'nalishlari",
      "Все форматы питания",
      "Every way to eat and drink"
    ),
    icon: "utensils",
    accent: "#f97316",
    categories: [
      leaf("takeout", "Olib ketish", "На вынос", "Takeout"),
      leaf("delivery", "Yetkazib berish", "Доставка", "Delivery"),
      leaf("hot-trendy", "Mashhur va trenddagi", "Популярные и модные", "Hot & Trendy"),
      leaf("new-restaurants", "Yangi restoranlar", "Новые рестораны", "New Restaurants"),
      leaf("breakfast-brunch", "Nonushta va brunch", "Завтраки и бранчи", "Breakfast & Brunch"),
      leaf("lunch", "Tushlik", "Обеды", "Lunch"),
      leaf("dinner", "Kechki ovqat", "Ужин", "Dinner"),
      leaf("coffee-cafes", "Qahva va kafelar", "Кофе и кафе", "Coffee & Cafes"),
      leaf("pizza", "Pitsa", "Пицца", "Pizza"),
      leaf("chinese", "Xitoy taomlari", "Китайская кухня", "Chinese"),
      leaf("mexican", "Meksika taomlari", "Мексиканская кухня", "Mexican"),
      leaf("bakeries", "Nonvoyxonalar", "Пекарни", "Bakeries"),
      leaf("italian", "Italyan taomlari", "Итальянская кухня", "Italian"),
      leaf("food-trucks", "Ko'cha taomlari", "Фудтраки", "Food Trucks"),
      leaf("sports-bars-pubs", "Sport barlar va pablar", "Спорт-бары и пабы", "Sports Bars & Pubs")
    ]
  },
  {
    id: "home-garden",
    rootSlug: "home-garden",
    label: copy("Uy va bog'", "Дом и сад", "Home & Garden"),
    description: copy(
      "Uy, bog' va kundalik xizmatlar",
      "Дом, сад и бытовые услуги",
      "Home, garden, and everyday help"
    ),
    icon: "home",
    accent: "#10b981",
    categories: [
      leaf("contractors-handymen", "Quruvchilar va ustalar", "Подрядчики и мастера", "Contractors & Handymen"),
      leaf("plumbers", "Santexniklar", "Сантехники", "Plumbers"),
      leaf("electricians", "Elektriklar", "Электрики", "Electricians"),
      leaf("heating-air-conditioning", "Isitish va konditsioner", "Отопление и кондиционирование", "Heating & Air Conditioning"),
      leaf("appliances-repair", "Maishiy texnika va ta'mirlash", "Техника и ремонт", "Appliances and Repair"),
      leaf("roofing", "Tom yopish", "Кровельные работы", "Roofing"),
      leaf("locksmiths", "Qulf ustalari", "Слесари и замки", "Locksmiths"),
      leaf("painters", "Bo'yoqchilar", "Малярные работы", "Painters"),
      leaf("landscaping", "Obodonlashtirish", "Ландшафтный дизайн", "Landscaping"),
      leaf("nurseries-gardening", "Ko'chatlar va bog'dorchilik", "Питомники и садоводство", "Nurseries & Gardening"),
      leaf("florists", "Gul do'konlari", "Флористы", "Florists"),
      leaf("tree-services", "Daraxt xizmatlari", "Уход за деревьями", "Tree Services"),
      leaf("home-cleaning", "Uy tozalash", "Уборка дома", "Home Cleaning"),
      leaf("furniture-stores", "Mebel do'konlari", "Мебельные магазины", "Furniture Stores"),
      leaf("movers", "Ko'chirish xizmatlari", "Переезды", "Movers")
    ]
  },
  {
    id: "auto-services",
    rootSlug: "auto-services",
    label: copy("Avto va xizmatlar", "Авто и услуги", "Auto & Services"),
    description: copy(
      "Mashina va yo'l bo'yicha xizmatlar",
      "Автомобильные и дорожные услуги",
      "Cars, roads, and mobility services"
    ),
    icon: "car",
    accent: "#3b82f6",
    categories: [
      leaf("auto-repair", "Avto ta'mirlash", "Автосервис", "Auto Repair"),
      leaf("body-shops", "Kuzov ta'miri", "Кузовной ремонт", "Body Shops"),
      leaf("oil-change", "Moy almashtirish", "Замена масла", "Oil Change"),
      leaf("tires", "Shinalar", "Шины", "Tires"),
      leaf("towing", "Evakuator", "Эвакуатор", "Towing"),
      leaf("car-wash", "Avtomoyka", "Автомойка", "Car Wash"),
      leaf("auto-detailing", "Avtodeteyling", "Автодетейлинг", "Auto Detailing"),
      leaf("parking", "Avtoturargoh", "Парковки", "Parking"),
      leaf("car-dealers", "Avtosalonlar", "Автодилеры", "Car Dealers"),
      leaf("junkyards", "Avto razborkalar", "Авторазборки", "Junkyards")
    ]
  },
  {
    id: "health-beauty",
    rootSlug: "health-beauty",
    label: copy("Salomatlik va go'zallik", "Здоровье и красота", "Health & Beauty"),
    description: copy(
      "Sog'liq, parvarish va go'zallik",
      "Здоровье, уход и красота",
      "Health, care, and beauty"
    ),
    icon: "heart_pulse",
    accent: "#ec4899",
    categories: [
      leaf("dentists", "Stomatologlar", "Стоматологи", "Dentists"),
      leaf("doctors", "Shifokorlar", "Врачи", "Doctors"),
      leaf("chiropractors", "Chiropraktorlar", "Хиропрактики", "Chiropractors"),
      leaf("optometrists", "Optometristlar", "Оптометристы", "Optometrists"),
      leaf("dermatologists", "Dermatologlar", "Дерматологи", "Dermatologists"),
      leaf("podiatrists", "Oyoq shifokorlari", "Подологи", "Podiatrists"),
      leaf("massage", "Massaj", "Массаж", "Massage"),
      leaf("hair-salons", "Sartaroshxonalar", "Парикмахерские", "Hair Salons"),
      leaf("nail-salons", "Tirnoq salonlari", "Ногтевые салоны", "Nail Salons"),
      leaf("barbers", "Barberlar", "Барбершопы", "Barbers"),
      leaf("spas", "SPA", "SPA", "Spas"),
      leaf("physical-therapy", "Fizioterapiya", "Физиотерапия", "Physical Therapy")
    ]
  },
  {
    id: "travel-activities",
    rootSlug: "travel-activities",
    label: copy("Sayohat va faoliyat", "Путешествия и досуг", "Travel & Activities"),
    description: copy(
      "Sayohat, hordiq va ko'ngilochar",
      "Путешествия, отдых и впечатления",
      "Travel, leisure, and things to do"
    ),
    icon: "compass",
    accent: "#8b5cf6",
    categories: [
      leaf("things-to-do", "Qiziqarli mashg'ulotlar", "Чем заняться", "Things to Do"),
      leaf("kids-activities-camps", "Bolalar mashg'ulotlari va lagerlar", "Детские занятия и лагеря", "Kids Activities & Camps"),
      leaf("venues-events", "Tadbir joylari", "Площадки и мероприятия", "Venues & Events"),
      leaf("mosques", "Masjidlar", "Мечети", "Mosques"),
      leaf("shopping-malls", "Savdo markazlari", "Торговые центры", "Shopping Malls"),
      leaf("bookstores", "Kitob do'konlari", "Книжные магазины", "Bookstores"),
      leaf("mini-golf", "Mini golf", "Мини-гольф", "Mini Golf"),
      leaf("bowling", "Bouling", "Боулинг", "Bowling"),
      leaf("hotels", "Mehmonxonalar", "Отели", "Hotels"),
      leaf("taxis", "Taksi", "Такси", "Taxis"),
      leaf("bike-rentals", "Velosiped ijarasi", "Прокат велосипедов", "Bike Rentals"),
      leaf("campgrounds", "Kempinglar", "Кемпинги", "Campgrounds"),
      leaf("beaches", "Plyajlar", "Пляжи", "Beaches"),
      leaf("swimming-pools", "Basseynlar", "Бассейны", "Swimming Pools"),
      leaf("bars-nightlife", "Barlar va tungi hayot", "Бары и ночная жизнь", "Bars & Nightlife")
    ]
  },
  {
    id: "more",
    rootSlug: "more",
    label: copy("Ko'proq", "Ещё", "More"),
    description: copy(
      "Kundalik hayot va maxsus xizmatlar",
      "Повседневные и специальные услуги",
      "Everyday and specialist services"
    ),
    icon: "layers",
    accent: "#f43f5e",
    categories: [
      leaf("dry-cleaning", "Kimyoviy tozalash", "Химчистка", "Dry Cleaning"),
      leaf("laundromats", "Kir yuvish joylari", "Прачечные", "Laundromats"),
      leaf("thrift-stores", "Sekond-hand do'konlar", "Комиссионные магазины", "Thrift Stores"),
      leaf("tailors-alterations", "Tikuv va kiyim tuzatish", "Ателье и ремонт одежды", "Tailors & Alterations"),
      leaf("apartments", "Kvartiralar", "Квартиры", "Apartments"),
      leaf("junk-removal", "Chiqindi olib ketish", "Вывоз мусора", "Junk Removal"),
      leaf("gyms", "Fitnes zallari", "Спортзалы", "Gyms"),
      leaf("yoga-pilates", "Yoga va Pilates", "Йога и пилатес", "Yoga & Pilates"),
      leaf("pet-groomers", "Uy hayvonlari parvarishi", "Груминг", "Pet Groomers"),
      leaf("veterinarians", "Veterinariya", "Ветеринары", "Veterinarians"),
      leaf("pet-services", "Uy hayvonlari xizmatlari", "Услуги для животных", "Pet Services"),
      leaf("banks-credit-unions", "Banklar va kredit uyushmalari", "Банки и кредитные союзы", "Banks & Credit Unions"),
      leaf("real-estate-agents", "Ko'chmas mulk agentlari", "Агентства недвижимости", "Real Estate Agents"),
      leaf("language-learning", "Til o'rganish", "Языковые центры", "Language Learning"),
      leaf("catering", "Keytering", "Кейтеринг", "Catering"),
      leaf("event-organizers", "Tadbir tashkilotchilari", "Организаторы мероприятий", "Event Organizers"),
      leaf("parking-more", "Avtoturargoh", "Парковки", "Parking")
    ]
  }
];


export const BUSINESS_CATEGORY_GROUPS: GroupDefinition[] = GROUP_DEFINITIONS;

export const BUSINESS_CATEGORY_BY_GROUP_SLUG = Object.fromEntries(
  BUSINESS_CATEGORY_GROUPS.map((group) => [group.rootSlug, group])
) as Record<string, GroupDefinition | undefined>;

export const BUSINESS_CATEGORY_PARENT_BY_SLUG = Object.fromEntries(
  BUSINESS_CATEGORY_GROUPS.flatMap((group) => [
    [group.rootSlug, group.rootSlug] as const,
    ...group.categories.map((category) => [category.slug, group.rootSlug] as const)
  ])
) as Record<string, string | undefined>;

export const MARKETPLACE_PARENT_CATEGORY_SLUGS: Record<string, string[]> = {
  restaurants: ["restaurants", "cafes"],
  "home-garden": ["repairs"],
  "auto-services": ["auto"],
  "health-beauty": ["beauty"],
  "travel-activities": ["entertainment", "events", "resort", "shopping"]
};

export const MARKETPLACE_CATEGORY_SLUGS: Record<string, string[]> = {
  "coffee-cafes": ["cafes"],
  "auto-repair": ["auto"],
  "body-shops": ["auto"],
  "oil-change": ["auto"],
  tires: ["auto"],
  towing: ["auto"],
  "car-wash": ["auto"],
  "auto-detailing": ["auto"],
  parking: ["auto"],
  "car-dealers": ["auto"],
  junkyards: ["auto"],
  "contractors-handymen": ["repairs"],
  plumbers: ["repairs"],
  electricians: ["repairs"],
  "heating-air-conditioning": ["repairs"],
  "appliances-repair": ["repairs"],
  roofing: ["repairs"],
  locksmiths: ["repairs"],
  painters: ["repairs"],
  landscaping: ["repairs"],
  "tree-services": ["repairs"],
  "home-cleaning": ["repairs"],
  "furniture-stores": ["shopping"],
  movers: ["repairs"],
  dentists: ["beauty"],
  doctors: ["beauty"],
  chiropractors: ["beauty"],
  optometrists: ["beauty"],
  dermatologists: ["beauty"],
  podiatrists: ["beauty"],
  massage: ["beauty"],
  "hair-salons": ["beauty"],
  "nail-salons": ["beauty"],
  barbers: ["beauty"],
  spas: ["beauty"],
  "physical-therapy": ["beauty"]
};

export const MARKETPLACE_CATEGORY_GROUPS = BUSINESS_CATEGORY_GROUPS;

export function localizeBusinessCategory(copy: LocalizedCopy, locale: Locale): string {
  return copy[locale] ?? copy.en;
}

export function findBusinessCategoryGroup(slug: string): GroupDefinition | undefined {
  return BUSINESS_CATEGORY_BY_GROUP_SLUG[slug];
}

export function findBusinessCategory(slug: string): { group: GroupDefinition; category: LeafDefinition } | undefined {
  const rootSlug = BUSINESS_CATEGORY_PARENT_BY_SLUG[slug];
  const group = rootSlug ? BUSINESS_CATEGORY_BY_GROUP_SLUG[rootSlug] : undefined;
  const category = group?.categories.find((item) => item.slug === slug);
  return group && category ? { group, category } : undefined;
}
