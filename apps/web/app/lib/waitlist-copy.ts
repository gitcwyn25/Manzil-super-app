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
  firstNameLabel?: string;
  lastNameLabel?: string;
  heardAboutLabel?: string;
  heardAboutOptions?: Array<{ value: string; label: string }>;
  featureInterestLabel?: string;
  featureInterestOptions?: Array<{ value: string; label: string }>;
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
      title: "Gurman mobil ilovasi tayyorlanmoqda",
      lead: "Gurman sizga mahalliy reja tuzishda yordam beradi. Ilova ishga tushganda birinchi bo'lib xabar olish uchun emailingizni qoldiring.",
      emailLabel: "Email",
      firstNameLabel: "Ism",
      lastNameLabel: "Familiya",
      heardAboutLabel: "Manzil haqida qayerdan bildingiz?",
      heardAboutOptions: [
        { value: "friend", label: "Do'stim tavsiya qildi" },
        { value: "instagram", label: "Instagram yoki TikTok" },
        { value: "telegram", label: "Telegram" },
        { value: "search", label: "Google yoki qidiruv" },
        { value: "other", label: "Boshqa" }
      ],
      featureInterestLabel: "Qaysi imkoniyat sizni qiziqtiradi?",
      featureInterestOptions: [
        { value: "discover", label: "Yangi joylarni kashf etish" },
        { value: "planning", label: "Kundalik reja tuzish" },
        { value: "recommendations", label: "Shaxsiy tavsiyalar" },
        { value: "bookings", label: "Buyurtma va bron qilish" },
        { value: "all", label: "Barchasi" }
      ],
      submit: "Gurman yangiliklariga yozilish",
      successTitle: "Ro'yxatdasiz",
      successBody: (position) => `Siz ${position}-o'rindasiz. Ilova tayyor bo'lganda xabar beramiz.`,
      countLabel: () => "",
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Мобильное приложение Gurman готовится",
      lead: "Gurman поможет планировать местные впечатления. Оставьте email, чтобы первым узнать о запуске приложения.",
      emailLabel: "Email",
      firstNameLabel: "Имя",
      lastNameLabel: "Фамилия",
      heardAboutLabel: "Как вы узнали о Manzil?",
      heardAboutOptions: [
        { value: "friend", label: "Посоветовал друг" },
        { value: "instagram", label: "Instagram или TikTok" },
        { value: "telegram", label: "Telegram" },
        { value: "search", label: "Google или поиск" },
        { value: "other", label: "Другое" }
      ],
      featureInterestLabel: "Какая возможность вам интересна?",
      featureInterestOptions: [
        { value: "discover", label: "Находить новые места" },
        { value: "planning", label: "Составлять планы на день" },
        { value: "recommendations", label: "Персональные рекомендации" },
        { value: "bookings", label: "Заказы и бронирования" },
        { value: "all", label: "Всё сразу" }
      ],
      submit: "Получать новости Gurman",
      successTitle: "Вы в списке",
      successBody: (position) => `Вы ${position}-й в списке. Мы напишем, когда приложение будет готово.`,
      countLabel: () => "",
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Gurman mobile is being built",
      lead: "Gurman will help people plan local experiences. Leave your email to hear first when the app is ready.",
      emailLabel: "Email",
      firstNameLabel: "Name",
      lastNameLabel: "Surname",
      heardAboutLabel: "How did you hear about Manzil?",
      heardAboutOptions: [
        { value: "friend", label: "A friend recommended it" },
        { value: "instagram", label: "Instagram or TikTok" },
        { value: "telegram", label: "Telegram" },
        { value: "search", label: "Google or search" },
        { value: "other", label: "Other" }
      ],
      featureInterestLabel: "What feature are you interested in?",
      featureInterestOptions: [
        { value: "discover", label: "Discovering new places" },
        { value: "planning", label: "Planning everyday experiences" },
        { value: "recommendations", label: "Personal recommendations" },
        { value: "bookings", label: "Bookings and orders" },
        { value: "all", label: "Everything" }
      ],
      submit: "Join Gurman updates",
      successTitle: "You're on the list",
      successBody: (position) => `You're number ${position}. We'll write when the app is ready.`,
      countLabel: () => "",
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
