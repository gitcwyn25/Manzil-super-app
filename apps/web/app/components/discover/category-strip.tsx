"use client";

import type { Locale } from "@manzil/shared";
import { type IconName } from "../vm/icons";
import {
  ShiftingDropDown,
  type ShiftingDropDownCategory,
  type ShiftingDropDownGroup
} from "../../../components/ui/shifting-dropdown";

export interface CategoryItem {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  icon: IconName;
  color: string;
  bgGradient: string;
}

type LocalizedCopy = Record<Locale, string>;

type LeafDefinition = {
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
type GroupDefinition = {
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
      leaf("language-learning", "Til o'rganish markazlari", "Языковые центры", "Language Learning Centres"),
      leaf("catering", "Keytering", "Кейтеринг", "Catering"),
      leaf("event-organizers", "Tadbir tashkilotchilari", "Организаторы мероприятий", "Event Organizers"),
      leaf("parking-more", "Avtoturargoh", "Парковки", "Parking")
    ]
  }
];

function toCategoryItem(
  slug: string,
  label: LocalizedCopy,
  color: string,
  id = slug,
  icon: IconName = "circle"
): CategoryItem {
  return { id, slug, name: label, icon, color, bgGradient: "none" };
}

export const MARKETPLACE_CATEGORIES: CategoryItem[] = GROUP_DEFINITIONS.flatMap((group) => [
  toCategoryItem(group.rootSlug, group.label, group.accent, group.id, group.icon),
  ...group.categories.map((category) =>
    toCategoryItem(category.slug, category.label, category.color ?? group.accent, category.id, category.icon ?? "circle")
  )
]);

export const MARKETPLACE_CATEGORY_GROUPS: ShiftingDropDownGroup[] = GROUP_DEFINITIONS.map((group) => ({
  id: group.id,
  rootSlug: group.rootSlug,
  label: group.label,
  description: group.description,
  icon: group.icon,
  accent: group.accent,
  categories: group.categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    icon: category.icon ?? "circle",
    color: category.color ?? group.accent
  } satisfies ShiftingDropDownCategory))
}));

export const MARKETPLACE_PARENT_CATEGORY_SLUGS: Record<string, string[]> = {
  "home-garden": ["repairs"],
  "auto-services": ["auto"],
  "health-beauty": ["beauty"],
  "travel-activities": ["entertainment", "events", "resort", "shopping"],
  more: ["shopping"]
};

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
    <section
      aria-label={locale === "uz" ? "Biznes kategoriyalari" : locale === "ru" ? "Категории бизнеса" : "Business categories"}
      className="category-strip-section"
    >
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
