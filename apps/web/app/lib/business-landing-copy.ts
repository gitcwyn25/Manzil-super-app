import type { Locale } from "@manzil/shared";

/** Copy for the business landing page (/business). */
export type BusinessLandingCopy = {
  heroTitle1: string;
  heroTitle2: string;
  heroText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  bandTitle: string;
  bandText: string;
  bandCta: string;
  stats: Array<{ value: number; suffix: string; label: string }>;
  bentoTitle: string;
  bento: Array<{ title: string; text: string; dark: boolean }>;
  pricingTitle: string;
  pricingText: string;
  perMonth: string;
  plans: {
    free: { name: string; price: string; features: string[]; cta: string };
    pro: { name: string; price: string; features: string[]; cta: string };
    max: { name: string; price: string; features: string[]; cta: string; badge: string };
  };
};

const copy: Record<string, BusinessLandingCopy> = {
  uz: {
    heroTitle1: "Biznesingizni",
    heroTitle2: "onlayn rivojlantiring",
    heroText:
      "Manzil'da biznes profilingizni yuriting: narxlar, aksiyalar, e'lonlar va mijozlar bilan aloqa — hammasi bitta kabinetda.",
    ctaPrimary: "Hisob ochish",
    ctaSecondary: "Kabinetga kirish",
    bandTitle: "Barcha ko'rsatkichlar bitta panelda",
    bandText: "Ko'rishlar, sharhlar va obunachilar statistikasi har kuni yangilanadi.",
    bandCta: "Panelni ochish",
    stats: [
      { value: 1200, suffix: "+", label: "Faol bizneslar" },
      { value: 48000, suffix: "+", label: "Oylik ko'rishlar" },
      { value: 9600, suffix: "+", label: "Mijoz sharhlari" },
      { value: 12, suffix: "", label: "Tumanlar" }
    ],
    bentoTitle: "Kabinetda nimalar bor",
    bento: [
      { title: "CRM va mijozlar bazasi", text: "Mijozlar faoliyati va sharhlar tarixi bitta joyda saqlanadi.", dark: true },
      { title: "E'lonlar va aksiyalar", text: "Yangi takliflar, paketlar va chegirmalarni e'lon qiling.", dark: false },
      { title: "Narxlar va xizmatlar", text: "Narxlaringizni istalgan vaqtda yangilang — mijozlar darhol ko'radi.", dark: false },
      { title: "Statistika va hisobotlar", text: "Haftalik dinamika, eng ko'p ko'rilgan xizmatlar va reyting.", dark: true }
    ],
    pricingTitle: "Tariflar",
    pricingText: "O'zingizga mos rejani tanlang.",
    perMonth: "/oy",
    plans: {
      free: {
        name: "Boshlang'ich",
        price: "0 so'm",
        features: ["Biznes profili", "Sharhlarga javob", "Asosiy statistika"],
        cta: "Bepul boshlash"
      },
      pro: {
        name: "Pro",
        price: "399 000 so'm",
        features: ["Boshlang'ich rejadagi hammasi", "E'lonlar va aksiyalar", "Foto galereya", "Kengaytirilgan statistika"],
        cta: "Pro rejani tanlash"
      },
      max: {
        name: "Max",
        price: "499 000 so'm",
        features: ["Pro rejadagi hammasi", "Qidiruvda ustuvor o'rin", "Bir nechta filial", "Shaxsiy menejer"],
        cta: "Max rejani tanlash",
        badge: "Ommabop"
      }
    }
  },
  ru: {
    heroTitle1: "Развивайте бизнес",
    heroTitle2: "в интернете",
    heroText:
      "Ведите профиль бизнеса на Manzil: цены, акции, объявления и связь с клиентами — всё в одном кабинете.",
    ctaPrimary: "Создать аккаунт",
    ctaSecondary: "Войти в кабинет",
    bandTitle: "Все показатели на одной панели",
    bandText: "Статистика просмотров, отзывов и подписчиков обновляется ежедневно.",
    bandCta: "Открыть панель",
    stats: [
      { value: 1200, suffix: "+", label: "Активных бизнесов" },
      { value: 48000, suffix: "+", label: "Просмотров в месяц" },
      { value: 9600, suffix: "+", label: "Отзывов клиентов" },
      { value: 12, suffix: "", label: "Районов" }
    ],
    bentoTitle: "Что входит в кабинет",
    bento: [
      { title: "CRM и база клиентов", text: "История активности клиентов и отзывов хранится в одном месте.", dark: true },
      { title: "Объявления и акции", text: "Публикуйте новые предложения, пакеты и скидки.", dark: false },
      { title: "Цены и услуги", text: "Обновляйте цены в любой момент — клиенты видят их сразу.", dark: false },
      { title: "Статистика и отчёты", text: "Недельная динамика, популярные услуги и рейтинг.", dark: true }
    ],
    pricingTitle: "Тарифы",
    pricingText: "Выберите подходящий план.",
    perMonth: "/мес",
    plans: {
      free: {
        name: "Начальный",
        price: "0 сум",
        features: ["Профиль бизнеса", "Ответы на отзывы", "Базовая статистика"],
        cta: "Начать бесплатно"
      },
      pro: {
        name: "Pro",
        price: "399 000 сум",
        features: ["Всё из Начального", "Объявления и акции", "Фотогалерея", "Расширенная статистика"],
        cta: "Выбрать Pro"
      },
      max: {
        name: "Max",
        price: "499 000 сум",
        features: ["Всё из Pro", "Приоритет в поиске", "Несколько филиалов", "Персональный менеджер"],
        cta: "Выбрать Max",
        badge: "Популярный"
      }
    }
  },
  en: {
    heroTitle1: "Grow your business",
    heroTitle2: "online",
    heroText:
      "Run your business profile on Manzil: prices, promotions, announcements, and customer communication — all in one dashboard.",
    ctaPrimary: "Create account",
    ctaSecondary: "Open dashboard",
    bandTitle: "Every metric on one panel",
    bandText: "Views, reviews, and follower statistics update daily.",
    bandCta: "Open the panel",
    stats: [
      { value: 1200, suffix: "+", label: "Active businesses" },
      { value: 48000, suffix: "+", label: "Monthly views" },
      { value: 9600, suffix: "+", label: "Customer reviews" },
      { value: 12, suffix: "", label: "Districts" }
    ],
    bentoTitle: "What the dashboard includes",
    bento: [
      { title: "CRM and customer base", text: "Customer activity and review history stored in one place.", dark: true },
      { title: "Announcements and promotions", text: "Publish new offers, packages, and discounts.", dark: false },
      { title: "Prices and services", text: "Update your prices any time — customers see them instantly.", dark: false },
      { title: "Statistics and reports", text: "Weekly trends, top services, and rating.", dark: true }
    ],
    pricingTitle: "Pricing",
    pricingText: "Choose the plan that fits.",
    perMonth: "/mo",
    plans: {
      free: {
        name: "Starter",
        price: "0 UZS",
        features: ["Business profile", "Review replies", "Basic statistics"],
        cta: "Start free"
      },
      pro: {
        name: "Pro",
        price: "399,000 UZS",
        features: ["Everything in Starter", "Announcements and promotions", "Photo gallery", "Advanced statistics"],
        cta: "Choose Pro"
      },
      max: {
        name: "Max",
        price: "499,000 UZS",
        features: ["Everything in Pro", "Priority in search", "Multiple branches", "Dedicated manager"],
        cta: "Choose Max",
        badge: "Most popular"
      }
    }
  }
};

export function getBusinessLandingCopy(locale: Locale): BusinessLandingCopy {
  return copy[locale] ?? copy.uz;
}
