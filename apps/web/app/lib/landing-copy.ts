import type { Locale } from "@manzil/shared";
import type { AudienceContent } from "../components/audience-features";

export type LandingCopy = {
  badge: string;
  heroCarouselLabel: string;
  heroGoTo: (index: number) => string;
  heroNew: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  cta: string;
  heroFootnote: string;
  featuresTitle1: string;
  featuresTitle2: string;
  featuresSubtitle: string;
  audience: AudienceContent;
  downloadTitle: string;
  downloadText: string;
  ios: string;
  android: string;
  comingSoon: string;
};

const landing: Record<string, LandingCopy> = {
  uz: {
    badge: "Toshkentda ishga tushdi",
    heroCarouselLabel: "Manzildagi bizneslar",
    heroGoTo: (index) => `${index}-biznesni ko'rsatish`,
    heroNew: "Yangi",
    titleLine1: "Shahringizdagi eng yaxshi joylar.",
    titleLine2: "Bitta platformada.",
    subtitle: "Bizneslar va mijozlar uchun yagona platforma",
    cta: "Boshlash",
    heroFootnote: "Restoranlar · Kafelar · Go'zallik · Xizmatlar",
    featuresTitle1: "Biz asosini qurdik,",
    featuresTitle2: "endi navbat sizda",
    featuresSubtitle:
      "Biznes yuritasizmi yoki yangi joylar izlaysizmi — hammasi shu yerda.",
    audience: {
      toggleBusiness: "Biznes uchun",
      toggleCustomer: "Mijozlar uchun",
      business: [
        { title: "Listing boshqaruvi", text: "Ma'lumotlar, narxlar va ish vaqtini yangilang.", tone: "gray", mock: "listing" },
        { title: "Sharhlarga javob", text: "Har bir mijozga rasmiy javob qaytaring.", tone: "purple", mock: "review" },
        { title: "E'lonlar va aksiyalar", text: "Yangiliklar, paketlar va chegirmalarni e'lon qiling.", tone: "mint", mock: "inbox" },
        { title: "Statistika", text: "Ko'rishlar va obunachilar dinamikasi.", tone: "plain", mock: "stats" }
      ],
      customer: [
        { title: "Shaxsiy profil", text: "Faoliyatingiz va obunalaringiz bir joyda.", tone: "gray", mock: "profile" },
        { title: "Hikoyalar", text: "Suratlar bilan bo'lishing, izoh va layklar oling.", tone: "purple", mock: "story" },
        { title: "Qidiruv", text: "Yaqin-atrofdagi eng yaxshi joylarni toping.", tone: "mint", mock: "search" },
        { title: "Do'stlar", text: "Tanishlaringizni kuzating va ulashing.", tone: "plain", mock: "follow" }
      ]
    },
    downloadTitle: "Ilovani yuklab oling",
    downloadText: "Mijozlar uchun iOS va Android ilovalari.",
    ios: "App Store",
    android: "Google Play",
    comingSoon: "Tez kunda"
  },
  ru: {
    badge: "Запущено в Ташкенте",
    heroCarouselLabel: "Бизнесы на Manzil",
    heroGoTo: (index) => `Показать бизнес ${index}`,
    heroNew: "Новый",
    titleLine1: "Лучшие места вашего города.",
    titleLine2: "На одной платформе.",
    subtitle: "Единая платформа для бизнеса и клиентов",
    cta: "Начать",
    heroFootnote: "Рестораны · Кафе · Красота · Услуги",
    featuresTitle1: "Мы построили основу,",
    featuresTitle2: "теперь дело за вами",
    featuresSubtitle:
      "Ведёте бизнес или ищете новые места — всё находится здесь.",
    audience: {
      toggleBusiness: "Для бизнеса",
      toggleCustomer: "Для клиентов",
      business: [
        { title: "Управление листингом", text: "Обновляйте данные, цены и часы работы.", tone: "gray", mock: "listing" },
        { title: "Ответы на отзывы", text: "Официально отвечайте каждому клиенту.", tone: "purple", mock: "review" },
        { title: "Объявления и акции", text: "Публикуйте новости, пакеты и скидки.", tone: "mint", mock: "inbox" },
        { title: "Статистика", text: "Динамика просмотров и подписчиков.", tone: "plain", mock: "stats" }
      ],
      customer: [
        { title: "Личный профиль", text: "Ваша активность и подписки в одном месте.", tone: "gray", mock: "profile" },
        { title: "Истории", text: "Делитесь фото, получайте комментарии и лайки.", tone: "purple", mock: "story" },
        { title: "Поиск", text: "Находите лучшие места рядом с вами.", tone: "mint", mock: "search" },
        { title: "Друзья", text: "Подписывайтесь на знакомых и делитесь.", tone: "plain", mock: "follow" }
      ]
    },
    downloadTitle: "Скачайте приложение",
    downloadText: "Приложения для iOS и Android — для клиентов.",
    ios: "App Store",
    android: "Google Play",
    comingSoon: "Скоро"
  },
  en: {
    badge: "Now live in Tashkent",
    heroCarouselLabel: "Businesses on Manzil",
    heroGoTo: (index) => `Show business ${index}`,
    heroNew: "New",
    titleLine1: "The best places in your city.",
    titleLine2: "On one platform.",
    subtitle: "One platform for businesses and customers",
    cta: "Get started",
    heroFootnote: "Restaurants · Cafes · Beauty · Services",
    featuresTitle1: "We built the foundation,",
    featuresTitle2: "the rest is yours",
    featuresSubtitle:
      "Whether you run a business or discover new places — everything is here.",
    audience: {
      toggleBusiness: "For business",
      toggleCustomer: "For customers",
      business: [
        { title: "Listing management", text: "Update details, prices, and opening hours.", tone: "gray", mock: "listing" },
        { title: "Review replies", text: "Respond to every customer officially.", tone: "purple", mock: "review" },
        { title: "Announcements", text: "Publish news, packages, and discounts.", tone: "mint", mock: "inbox" },
        { title: "Analytics", text: "Views and follower trends over time.", tone: "plain", mock: "stats" }
      ],
      customer: [
        { title: "Your profile", text: "Your activity and follows in one place.", tone: "gray", mock: "profile" },
        { title: "Stories", text: "Share photos, get comments and likes.", tone: "purple", mock: "story" },
        { title: "Search", text: "Find the best places near you.", tone: "mint", mock: "search" },
        { title: "Friends", text: "Follow people you know and share.", tone: "plain", mock: "follow" }
      ]
    },
    downloadTitle: "Download the app",
    downloadText: "iOS and Android apps for customers.",
    ios: "App Store",
    android: "Google Play",
    comingSoon: "Coming soon"
  }
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return landing[locale] ?? landing.uz;
}
