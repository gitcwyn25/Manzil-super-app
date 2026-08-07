import type { Locale } from "@manzil/shared";

/** A single alternating product-feature section on the business landing page. */
export type BusinessFeature = {
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  mock: "reviews" | "promos" | "analytics";
};

/** Copy for the business landing page (/business). */
export type BusinessLandingCopy = {
  heroEyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  trustLine: string;
  proofTitle: string;
  features: BusinessFeature[];
  statsTitle: string;
  stats: Array<{ value: number; suffix: string; label: string }>;
  pricingTitle: string;
  pricingText: string;
  perMonth: string;
  plans: {
    free: { name: string; price: string; features: string[]; cta: string };
    pro: { name: string; price: string; features: string[]; cta: string };
    max: { name: string; price: string; features: string[]; cta: string; badge: string };
  };
  finalTitle: string;
  finalText: string;
  finalCta: string;
};

const copy: Record<string, BusinessLandingCopy> = {
  uz: {
    heroEyebrow: "Manzil Biznes",
    heroTitle1: "Ko'proq mijoz.",
    heroTitle2: "Bitta oddiy kabinet.",
    heroText:
      "Profilingizni yangilang, sharhlarga javob bering, aksiya e'lon qiling va statistikani kuzating — Toshkentdagi mijozlaringiz uchun barchasi bir joyda.",
    ctaPrimary: "Bepul boshlash",
    ctaSecondary: "Kabinetga kirish",
    trustLine: "Yangi platforma — birinchilardan bo'ling.",
    proofTitle: "Toshkentning ishonchli joylari Manzil'da",
    features: [
      {
        eyebrow: "Obro'",
        title: "Har bir sharhga javob bering",
        text: "Yangi sharhlar bitta joyda to'planadi. Bir marta bosib javob bering va mijozlar ishonchini mustahkamlang.",
        bullets: ["Barcha sharhlar bitta oynada", "Tayyor javob shablonlari", "Yangi sharh haqida bildirishnoma"],
        mock: "reviews"
      },
      {
        eyebrow: "Sotuv",
        title: "Aksiya va setlarni bir daqiqada e'lon qiling",
        text: "Tushlik seti, chegirma yoki maxsus taklif — yarating, muddatini belgilang, mijozlar darhol ko'radi.",
        bullets: ["Chegirma va setlar", "Amal qilish muddati", "Qidiruvda ko'rinadi"],
        mock: "promos"
      },
      {
        eyebrow: "O'sish",
        title: "Nima ishlayotganini aniq biling",
        text: "Ko'rishlar, sharhlar va eng ko'p so'ralgan xizmatlar — har kuni yangilanadigan statistika bilan qaror qabul qiling.",
        bullets: ["Haftalik va oylik dinamika", "Eng mashhur xizmatlar", "Reyting o'zgarishi"],
        mock: "analytics"
      }
    ],
    statsTitle: "Raqamlarda Manzil",
    stats: [],
    pricingTitle: "Sizga mos rejani tanlang",
    pricingText: "Bepul boshlang. Xohlagan vaqtda yangilang.",
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
    },
    finalTitle: "Biznesingizni bugun Manzil'ga qo'shing",
    finalText: "Ro'yxatdan o'tish 2 daqiqa. Karta talab qilinmaydi.",
    finalCta: "Bepul hisob ochish"
  },
  ru: {
    heroEyebrow: "Manzil Бизнес",
    heroTitle1: "Больше клиентов.",
    heroTitle2: "Один простой кабинет.",
    heroText:
      "Обновляйте профиль, отвечайте на отзывы, запускайте акции и следите за статистикой — всё для ваших клиентов в Ташкенте в одном месте.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Войти в кабинет",
    trustLine: "Новая платформа — станьте одними из первых.",
    proofTitle: "Надёжные места Ташкента — на Manzil",
    features: [
      {
        eyebrow: "Репутация",
        title: "Отвечайте на каждый отзыв",
        text: "Новые отзывы собираются в одном месте. Отвечайте в один клик и укрепляйте доверие клиентов.",
        bullets: ["Все отзывы в одном окне", "Готовые шаблоны ответов", "Уведомления о новых отзывах"],
        mock: "reviews"
      },
      {
        eyebrow: "Продажи",
        title: "Запускайте акции и сеты за минуту",
        text: "Бизнес-ланч, скидка или спецпредложение — создайте, задайте срок, и клиенты сразу увидят.",
        bullets: ["Скидки и сеты", "Срок действия", "Видно в поиске"],
        mock: "promos"
      },
      {
        eyebrow: "Рост",
        title: "Точно знайте, что работает",
        text: "Просмотры, отзывы и самые популярные услуги — принимайте решения на основе ежедневной статистики.",
        bullets: ["Недельная и месячная динамика", "Популярные услуги", "Изменение рейтинга"],
        mock: "analytics"
      }
    ],
    statsTitle: "Manzil в цифрах",
    stats: [],
    pricingTitle: "Выберите подходящий план",
    pricingText: "Начните бесплатно. Обновляйтесь в любой момент.",
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
    },
    finalTitle: "Добавьте бизнес на Manzil сегодня",
    finalText: "Регистрация за 2 минуты. Карта не нужна.",
    finalCta: "Создать бесплатно"
  },
  en: {
    heroEyebrow: "Manzil Business",
    heroTitle1: "More customers.",
    heroTitle2: "One simple dashboard.",
    heroText:
      "Update your profile, reply to reviews, launch promotions, and track performance — everything for your Tashkent customers in one place.",
    ctaPrimary: "Start free",
    ctaSecondary: "Open dashboard",
    trustLine: "A new platform — be among the first.",
    proofTitle: "Trusted places across Tashkent are on Manzil",
    features: [
      {
        eyebrow: "Reputation",
        title: "Reply to every review",
        text: "New reviews land in one place. Reply in a click and build lasting customer trust.",
        bullets: ["All reviews in one inbox", "Ready-made reply templates", "Alerts for every new review"],
        mock: "reviews"
      },
      {
        eyebrow: "Sales",
        title: "Launch deals and sets in a minute",
        text: "A lunch set, a discount, or a special offer — create it, set the dates, and customers see it instantly.",
        bullets: ["Discounts and sets", "Validity period", "Shows up in search"],
        mock: "promos"
      },
      {
        eyebrow: "Growth",
        title: "Know exactly what works",
        text: "Views, reviews, and your most-requested services — decide with statistics that update every day.",
        bullets: ["Weekly and monthly trends", "Top services", "Rating changes over time"],
        mock: "analytics"
      }
    ],
    statsTitle: "Manzil in numbers",
    stats: [],
    pricingTitle: "Choose the plan that fits",
    pricingText: "Start free. Upgrade any time.",
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
    },
    finalTitle: "Add your business to Manzil today",
    finalText: "Registration takes 2 minutes. No card required.",
    finalCta: "Create a free account"
  }
};

export function getBusinessLandingCopy(locale: Locale): BusinessLandingCopy {
  return copy[locale] ?? copy.uz;
}
