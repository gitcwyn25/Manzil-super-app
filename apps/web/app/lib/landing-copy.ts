import type { Locale } from "@manzil/shared";
import type { BentoCopy } from "../components/home/bento-business-grid";
import type { FeatureTrioCopy } from "../components/home/feature-trio";
import type { HeroConciergeCopy } from "../components/home/hero-concierge";

/**
 * Landing (home) copy — Vibrant Marketplace (task A2). uz is authoritative;
 * ru/en are faithful translations. Copy stance per D8: aspirational energy,
 * honest claims — Gurman AI recommends from real reviews and real catalog
 * data; no bookings, no invented venues, no fee claims.
 *
 * `cta`, `ios` and `android` are consumed by the site chrome (header,
 * mobile-nav, footer) and survive the home rebuild unchanged. The retired
 * AudienceFeatures / StoreBadges / hero-carousel fields left with their
 * sections (D9).
 */
export type LandingCopy = {
  /** Header + mobile-nav pill CTA (chrome). */
  cta: string;
  /** Footer app-link labels (chrome). */
  ios: string;
  android: string;
  hero: HeroConciergeCopy;
  features: FeatureTrioCopy;
  bento: BentoCopy;
};

const landing: Record<string, LandingCopy> = {
  uz: {
    cta: "Boshlash",
    ios: "App Store",
    android: "Google Play",
    hero: {
      badge: "Gurman AI bilan tanishing",
      title1: "Shahringizni kashf eting,",
      title2: "Gurman AI bilan.",
      subtitle:
        "Manzil — Toshkentdagi haqiqiy joylar katalogi. Gurman AI haqiqiy sharhlar va biznes ma'lumotlari asosida sizga mos joylarni tavsiya qiladi.",
      explore: "Joylarni ko'rish",
      how: "Gurman AI'ni sinab ko'rish",
      chatName: "Gurman AI",
      chatStatus: "Tavsiya tayyorlamoqda…",
      chatAi: "Salom! Qanday joy izlayapsiz? Haqiqiy sharhlar asosida tavsiya beraman.",
      chatUser: "Shanba oqshomi uchun tinch kafe kerak."
    },
    features: {
      title: "AI konsyerj",
      subtitle:
        "Gurman AI Manzil katalogidagi haqiqiy joylar va sharhlar bilan ishlaydi — qidiruvdan tanlovgacha yo'l ko'rsatadi.",
      items: [
        {
          title: "Aqlli rejalar",
          text: "Qanday kun istayotganingizni yozing — Gurman AI katalogdagi bir-biriga mos joylarni taklif qiladi."
        },
        {
          title: "Jonli kashfiyot",
          text: "Tavsiyalar haqiqiy sharhlar va joriy katalogga tayanadi — yangi joylar qo'shilishi bilan paydo bo'ladi."
        },
        {
          title: "Shaxsiy yondashuv",
          text: "Suhbatda aytganlaringizga qarab tavsiyalar moslashadi — tinch kafe yoki gavjum restoran, tanlov sizniki."
        }
      ]
    },
    bento: {
      title: "Eng yaxshi joylar",
      subtitle: "Manzildagi haqiqiy joylar — mehmonlarning haqiqiy sharhlari bilan.",
      viewAll: "Barcha turkumlarni ko'rish",
      featuredBadge: "Tanlangan",
      partnerTitle: "Biznesingiz bormi?",
      partnerText:
        "Manzilga qo'shiling — xizmatlaringizni izlayotgan mijozlar sizni topishsin.",
      partnerCta: "Hamkor bo'lish"
    }
  },
  ru: {
    cta: "Начать",
    ios: "App Store",
    android: "Google Play",
    hero: {
      badge: "Познакомьтесь с Gurman AI",
      title1: "Откройте свой город,",
      title2: "вместе с Gurman AI.",
      subtitle:
        "Manzil — каталог реальных мест Ташкента. Gurman AI рекомендует подходящие вам места на основе настоящих отзывов и данных бизнесов.",
      explore: "Смотреть места",
      how: "Попробовать Gurman AI",
      chatName: "Gurman AI",
      chatStatus: "Готовит рекомендацию…",
      chatAi: "Здравствуйте! Какое место вы ищете? Порекомендую на основе настоящих отзывов.",
      chatUser: "Нужно тихое кафе на субботний вечер."
    },
    features: {
      title: "AI-консьерж",
      subtitle:
        "Gurman AI работает с реальными местами и отзывами каталога Manzil — ведёт вас от поиска до выбора.",
      items: [
        {
          title: "Умные планы",
          text: "Опишите, какой день вы хотите — Gurman AI предложит подходящие друг к другу места из каталога."
        },
        {
          title: "Живые открытия",
          text: "Рекомендации опираются на настоящие отзывы и актуальный каталог — новые места появляются сразу после добавления."
        },
        {
          title: "Персональный подход",
          text: "Рекомендации подстраиваются под то, что вы говорите в диалоге — тихое кафе или оживлённый ресторан, выбор за вами."
        }
      ]
    },
    bento: {
      title: "Лучшие места",
      subtitle: "Реальные места на Manzil — с настоящими отзывами гостей.",
      viewAll: "Все категории",
      featuredBadge: "Выбор Manzil",
      partnerTitle: "У вас свой бизнес?",
      partnerText:
        "Присоединяйтесь к Manzil — пусть вас находят клиенты, которые ищут ваши услуги.",
      partnerCta: "Стать партнёром"
    }
  },
  en: {
    cta: "Get started",
    ios: "App Store",
    android: "Google Play",
    hero: {
      badge: "Meet Gurman AI",
      title1: "Discover your city,",
      title2: "with Gurman AI.",
      subtitle:
        "Manzil is a catalog of real places in Tashkent. Gurman AI recommends places that fit you, based on real reviews and real business data.",
      explore: "Explore places",
      how: "Try Gurman AI",
      chatName: "Gurman AI",
      chatStatus: "Preparing a recommendation…",
      chatAi: "Hi! What kind of place are you looking for? I recommend from real reviews.",
      chatUser: "A quiet café for Saturday evening."
    },
    features: {
      title: "The AI concierge",
      subtitle:
        "Gurman AI works with the real places and reviews in the Manzil catalog — guiding you from search to choice.",
      items: [
        {
          title: "Smart itineraries",
          text: "Describe the day you want — Gurman AI suggests catalog places that fit together."
        },
        {
          title: "Real-time discovery",
          text: "Recommendations draw on real reviews and the live catalog — new places show up as they join."
        },
        {
          title: "Personalized",
          text: "Suggestions adapt to what you say in the conversation — a quiet café or a lively restaurant, your call."
        }
      ]
    },
    bento: {
      title: "Experience the best",
      subtitle: "Real places on Manzil, with real reviews from guests.",
      viewAll: "View all categories",
      featuredBadge: "Featured",
      partnerTitle: "Own a local business?",
      partnerText: "Join Manzil and get found by customers who are looking for your services.",
      partnerCta: "Partner with us"
    }
  }
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return landing[locale] ?? landing.uz;
}
