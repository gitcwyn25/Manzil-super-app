import type { Locale } from "@manzil/shared";

export const WAITLIST_TOPICS = ["city", "gurman", "pro"] as const;
export type WaitlistTopic = (typeof WAITLIST_TOPICS)[number];

export function isWaitlistTopic(value: string): value is WaitlistTopic {
  return (WAITLIST_TOPICS as readonly string[]).includes(value);
}

export type WaitlistCopy = {
  title: string;
  lead: string;
  emailLabel: string;
  cityLabel?: string;
  businessLabel?: string;
  submit: string;
  successTitle: string;
  successBody: (position: number) => string;
  countLabel: (count: number) => string;
  errorGeneric: string;
};

const CITY_OPTIONS = ["Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Nukus", "Qarshi"];

export const WAITLIST_CITIES = CITY_OPTIONS;

/**
 * Each topic states one specific thing Manzil will do and when. Vague copy makes
 * a page feel templated in exactly the way vague visuals do, so none of these
 * say "join our waitlist".
 */
const COPY: Record<WaitlistTopic, Record<string, WaitlistCopy>> = {
  city: {
    uz: {
      title: "Manzil hozircha faqat Toshkentda",
      lead: "Keyingi shahar — eng ko'p so'ralgani. Shahringizni tanlang, ochilganda birinchi bo'lib xabar beramiz.",
      emailLabel: "Email",
      cityLabel: "Shahar",
      submit: "Shahrimni so'rash",
      successTitle: "Ovozingiz hisobga olindi",
      successBody: (position) => `Siz bu shahar bo'yicha ${position}-o'rindasiz.`,
      countLabel: (count) => `${count} kishi so'radi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Manzil пока работает только в Ташкенте",
      lead: "Следующий город — тот, который просят чаще всего. Выберите свой, и мы напишем первым, когда откроемся.",
      emailLabel: "Email",
      cityLabel: "Город",
      submit: "Запросить мой город",
      successTitle: "Голос засчитан",
      successBody: (position) => `Вы ${position}-й по этому городу.`,
      countLabel: (count) => `${count} человек уже попросили`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Manzil is only in Tashkent so far",
      lead: "The next city is the one people ask for most. Pick yours and we'll write to you first when it opens.",
      emailLabel: "Email",
      cityLabel: "City",
      submit: "Request my city",
      successTitle: "Your vote is counted",
      successBody: (position) => `You're number ${position} for this city.`,
      countLabel: (count) => `${count} people have asked`,
      errorGeneric: "That didn't send. Try again."
    }
  },
  gurman: {
    uz: {
      title: "Gurman avval kichik guruhga javob beradi",
      lead: "Gurman AI haqiqiy sharhlar asosida joy tavsiya qiladi. Sifatni ushlab turish uchun navbat bilan ochamiz.",
      emailLabel: "Email",
      submit: "Navbatga qo'shilish",
      successTitle: "Navbatdasiz",
      successBody: (position) => `Navbatda ${position}-o'rindasiz.`,
      countLabel: (count) => `Navbatda ${count} kishi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Сначала Gurman отвечает небольшой группе",
      lead: "Gurman AI подбирает места по реальным отзывам. Мы открываем доступ очередями, чтобы держать качество.",
      emailLabel: "Email",
      submit: "Встать в очередь",
      successTitle: "Вы в очереди",
      successBody: (position) => `Вы ${position}-й в очереди.`,
      countLabel: (count) => `${count} человек в очереди`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Gurman answers a small group first",
      lead: "Gurman AI recommends places from real reviews. We open access in batches to keep the answers good.",
      emailLabel: "Email",
      submit: "Join the queue",
      successTitle: "You're in the queue",
      successBody: (position) => `You're number ${position} in line.`,
      countLabel: (count) => `${count} people waiting`,
      errorGeneric: "That didn't send. Try again."
    }
  },
  pro: {
    uz: {
      title: "Manzil Pro birinchi guruh uchun ochiladi",
      lead: "Kengaytirilgan CRM, kampaniyalar va tahlil. Birinchi guruhga kirgan bizneslar narxni bir yilga qulflaydi.",
      emailLabel: "Email",
      businessLabel: "Biznes nomi",
      submit: "Birinchi guruhga yozilish",
      successTitle: "Ro'yxatdasiz",
      successBody: (position) => `Siz ${position}-o'rindasiz.`,
      countLabel: (count) => `${count} biznes yozildi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Manzil Pro откроется для первой группы",
      lead: "Расширенный CRM, кампании и аналитика. Бизнесы из первой группы фиксируют цену на год.",
      emailLabel: "Email",
      businessLabel: "Название бизнеса",
      submit: "Записаться в первую группу",
      successTitle: "Вы в списке",
      successBody: (position) => `Вы ${position}-й в списке.`,
      countLabel: (count) => `${count} бизнесов записались`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Manzil Pro opens to a first cohort",
      lead: "Deeper CRM, campaigns, and analytics. Businesses in the first cohort lock their price for a year.",
      emailLabel: "Email",
      businessLabel: "Business name",
      submit: "Join the first cohort",
      successTitle: "You're on the list",
      successBody: (position) => `You're number ${position} on the list.`,
      countLabel: (count) => `${count} businesses signed up`,
      errorGeneric: "That didn't send. Try again."
    }
  }
};

export function getWaitlistCopy(topic: WaitlistTopic, locale: Locale): WaitlistCopy {
  const byLocale = COPY[topic];
  return byLocale[locale] ?? byLocale.uz;
}
