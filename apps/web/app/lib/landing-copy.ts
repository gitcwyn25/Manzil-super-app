import type { Locale } from "@manzil/shared";
import type { BentoCopy } from "../components/home/bento-business-grid";
import type { IconName } from "../components/vm/icons";

export type CleverHeroCopy = {
  memberBadge: string;
  title1: string;
  title2: string;
  subtitle: string;
  explore: string;
  secondaryCta: string;
  systemAriaLabel: string;
  systemLiveLabel: string;
  systemLiveTitle: string;
  systemFutureLabel: string;
  systemFutureTitle: string;
  systemFutureNote: string;
  systemChips: string[];
  microPerks: string[];
};

export type GurmanPreviewCopy = {
  eyebrow: string;
  title: string;
  description: string;
  boundary: string;
  status: string;
  cta: string;
  previewTitle: string;
  previewSubtitle: string;
  previewFooter: string;
  chips: string[];
};

export type CleverBenefitCard = {
  icon: IconName;
  tag: string;
  title: string;
  description: string;
};

export type CleverBenefitsCopy = {
  badge: string;
  title: string;
  subtitle: string;
  cards: CleverBenefitCard[];
};

export type CleverFeatureTab = {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  badge: string;
  metricLabel: string;
  metricValue: string;
};

export type CleverFeaturesCopy = {
  badge: string;
  title: string;
  subtitle: string;
  tabs: CleverFeatureTab[];
};

export type CleverProcessStep = {
  number: string;
  title: string;
  description: string;
  icon: IconName;
};

export type CleverProcessCopy = {
  badge: string;
  title: string;
  subtitle: string;
  steps: CleverProcessStep[];
};

export type CleverPricingTier = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaHref: string;
};

export type CleverPricingCopy = {
  badge: string;
  title: string;
  subtitle: string;
  tiers: CleverPricingTier[];
};

export type CleverWaitlistCopy = {
  badge: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cityPlaceholder: string;
  cta: string;
  note: string;
  successTitle: string;
  successBody: string;
};

export type CleverTestimonial = {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  highlight: string;
};

export type CleverTestimonialsCopy = {
  badge: string;
  title: string;
  subtitle: string;
  items: CleverTestimonial[];
};

export type CleverFaqItem = {
  question: string;
  answer: string;
};

export type CleverFaqCopy = {
  badge: string;
  title: string;
  subtitle: string;
  items: CleverFaqItem[];
};

export type CleverCtaCopy = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  perks: string[];
};

export type LandingCopy = {
  cta: string;
  ios: string;
  android: string;
  hero: CleverHeroCopy;
  gurman: GurmanPreviewCopy;
  benefits: CleverBenefitsCopy;
  features: CleverFeaturesCopy;
  process: CleverProcessCopy;
  bento: BentoCopy;
  pricing: CleverPricingCopy;
  waitlist: CleverWaitlistCopy;
  testimonials: CleverTestimonialsCopy;
  faq: CleverFaqCopy;
  finalCta: CleverCtaCopy;
  homeCta: CleverCtaCopy;
};

const landing: Record<string, LandingCopy> = {
  uz: {
    cta: "Boshlash",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Toshkentdagi haqiqiy maskanlar",
      title1: "Haqiqiy joylarni toping.",
      title2: "Keyingi rejangizni tasavvur qiling.",
      subtitle:
        "Manzil Toshkentdagi mavjud mahalliy bizneslarni topish va solishtirishga yordam beradi. Gurman AI esa kelajakdagi mobil rejalashtirish tajribasi sifatida ishlab chiqilmoqda.",
      explore: "Joylarni kashf etish",
      secondaryCta: "Gurman mobiliga qo'shilish",
      systemAriaLabel: "Manzil tizimi: hozirgi katalogdan kelajakdagi Gurman mobil tajribasigacha",
      systemLiveLabel: "Hozir mavjud",
      systemLiveTitle: "Mavjud joylarni ko'ring",
      systemFutureLabel: "Mobil preview",
      systemFutureTitle: "Gurman AI rejalashtirish",
      systemFutureNote: "Kutish ro'yxati ochiq",
      systemChips: ["Joy", "Taom", "Tort", "Budjet"],
      microPerks: ["Mavjud katalog ma'lumotlari", "Toshkentdan boshlang", "Bepul ko'rish"]
    },
    gurman: {
      eyebrow: "Gurman AI · mobil tajriba",
      title: "“Nima qilamiz?” savolidan aniqroq rejaga.",
      description:
        "Gurman AI mahalliy tajribalarni rejalashtirish uchun mobil tajriba sifatida ishlab chiqilmoqda. U joy, taom, tort, transport, budjet, kayfiyat va vaqt kabi afzalliklarni bitta tahrirlanadigan reja atrofida ko'rishga yordam berishi ko'zda tutilgan.",
      boundary: "Hozir: konsept va kutish ro'yxati. Webda chat yoki bronlash yo'q.",
      status: "Mobil preview · Kutish ro'yxati ochiq",
      cta: "Gurman kutish ro'yxatiga qo'shilish",
      previewTitle: "4 kishilik tug'ilgan kun",
      previewSubtitle: "Reja konsepti",
      previewFooter: "Konsept preview · bronlash yoki jonli mavjudlik yo'q",
      chips: ["Joy", "Taom", "Tort", "Transport", "Budjet", "Kayfiyat", "Vaqt"]
    },
    benefits: {
      badge: "Afzalliklar",
      title: "Bir qarordan to'liq tajribagacha",
      subtitle:
        "Toshkent katalogi, jamoa sharhlari va qulay interfeys orqali vaqtingizni tejang va mos joyni tanlang.",
      cards: [
        {
          icon: "sparkles",
          tag: "Toshkent katalogi",
          title: "Haqiqiy joylarni oson toping",
          description:
            "Katalogdagi haqiqiy sharhlar va ma'lumotlar asosida sizga mos variantlarni toping."
        },
        {
          icon: "verified",
          tag: "Haqiqiylik",
          title: "Sharhlarni kontekst bilan ko'ring",
          description:
            "Mavjud baholar, fikrlar va fotosuratlarni ko'rib, joy haqida o'zingizga mos qaror qiling."
        },
        {
          icon: "search",
          tag: "Tezkor Qidiruv",
          title: "Keng qamrovli shahar katalogi",
          description:
            "Restoranlar, qahvaxonalar, xizmat ko'rsatish markazlari va dam olish maskanlari tumanlar bo'yicha saralangan."
        },
        {
          icon: "trending_up",
          tag: "Biznes profili",
          title: "Biznesingizni katalogda ko'rsating",
          description:
            "Biznesingizni katalogga qo'shing, xizmatlaringizni ko'rsating va mavjud profil ma'lumotlarini boshqaring."
        }
      ]
    },
    features: {
      badge: "Xususiyatlar",
      title: "Shaharni kashf qilishning yangi usuli",
      subtitle: "Katalog foydalanuvchilari va biznes egalari uchun mavjud funksiyalar.",
      tabs: [
        {
          id: "discover",
          label: "Katalog",
          title: "Toshkent katalogini tushunib tanlang",
          description:
            "Turkumlar, tumanlar va katalogda mavjud ma'lumotlar bo'yicha joylarni toping va solishtiring.",
          bullets: [
            "Tuman va turkum bo'yicha qidirish",
            "Mavjud baho, sharh va fotosuratlarni solishtirish",
            "To'g'ridan-to'g'ri bog'lanish va marshrut tuzish"
          ],
          badge: "Mavjud katalog",
          metricLabel: "Katalog holati",
          metricValue: "Mavjud maydonlar"
        },
        {
          id: "catalog",
          label: "Aqlli Katalog",
          title: "Toshkent maskanlarini bir katalogda ko'ring",
          description:
            "Turkum va tuman bo'yicha joylarni toping, so'ng mavjud ish vaqti, menyu, fotosurat va aloqa ma'lumotlarini solishtiring.",
          bullets: [
            "Tumanlar va lokatsiya bo'yicha tezkor saralash",
            "Mavjud fotosuratlarni ko'rish",
            "To'g'ridan-to'g'ri telefon va Telegram havolalari"
          ],
          badge: "Katalog ma'lumotlari",
          metricLabel: "Katalog holati",
          metricValue: "Mavjud maydonlar"
        },
        {
          id: "business",
          label: "Biznes Portali",
          title: "Biznesingizni katalogda ko'rsating",
          description:
            "Biznesingiz profilini yarating, xizmatlaringizni joylashtiring va katalog foydalanuvchilari uchun to'g'ridan-to'g'ri aloqa kanallarini ko'rsating.",
          bullets: [
            "Profil ma'lumotlarini boshqarish",
            "Mavjud sharhlar bilan ishlash",
            "Katalogda ko'rinish"
          ],
          badge: "Biznes profili",
          metricLabel: "Profil holati",
          metricValue: "Katalogga qo'shilish"
        }
      ]
    },
    process: {
      badge: "Qanday ishlaydi",
      title: "G'oyadan yaxshi xotiragacha",
      subtitle: "Manzil katalogi rejangizga mos joylarni topishga yordam beradi.",
      steps: [
        {
          number: "01",
          title: "Nimani rejalashtirayotganingizni ayting",
          description:
            "Katalog bo'ylab kerakli xizmat, restoran yoki dam olish maskanini qidiring.",
          icon: "search"
        },
        {
          number: "02",
          title: "Variantlarni solishtiring",
          description:
            "Mavjud baholar, sharhlar va fotosuratlarni ko'rib, o'zingizga mos qaror qiling.",
          icon: "star"
        },
        {
          number: "03",
          title: "Tajriba yarating",
          description:
            "Marshrutni bosing, to'g'ridan-to'g'ri qo'ng'iroq qiling va ajoyib dam oling. Taassurotlaringizni boshqalar bilan bo'lishing.",
          icon: "verified"
        }
      ]
    },
    bento: {
      title: "Katalogdagi joylar",
      subtitle: "Manzildagi katalog joylari — mavjud sharhlar va ma'lumotlar bilan.",
      viewAll: "Barcha turkumlarni ko'rish",
      featuredBadge: "Tanlangan",
      partnerTitle: "Biznesingiz bormi?",
      partnerText:
        "Profilingizni Manzil katalogiga qo'shing va xizmatlaringizni katalog foydalanuvchilariga ko'rsating.",
      partnerCta: "Hamkor bo'lish"
    },
    pricing: {
      badge: "Biznes tariflari",
      title: "Har qanday biznes uchun mos rejalar",
      subtitle: "Kompaniyangizni Manzil katalogiga qo'shing va maqsadli auditoriyani jalb qiling.",
      tiers: [
        {
          id: "free",
          name: "Free",
          tagline: "Katalogda paydo bo'lish va asosiy ma'lumotlarni ko'rsatish uchun.",
          price: "0 so'm",
          period: "doimiy bepul",
          features: [
            "Asosiy biznes profili",
            "Manzil, telefon va ish vaqti",
            "5 tagacha fotosurat yuklash",
            "Mijozlar sharhlarini qabul qilish",
            "Xaritada ko'rsatilishi"
          ],
          cta: "Bepul qo'shilish",
          ctaHref: "/uz/business/register"
        },
        {
          id: "pro",
          name: "Pro",
          tagline: "Ko'proq mijoz jalb qilish va o'z sohasida yetakchi bo'lish uchun.",
          price: "Tez orada",
          period: "narx e'lon qilinadi",
          popular: true,
          features: [
            "Free tarifidagi barcha imkoniyatlar",
            "Tasdiqlangan 'Verified' ko'k nishon",
            "Qidiruv natijalarida yuqori o'rinlar",
            "Katalogdagi ustuvor ko'rinish",
            "Cheksiz fotosuratlar va menyu",
            "Batafsil ko'rishlar tahlili (Analytics)"
          ],
          cta: "Pro tarifini tanlash",
          ctaHref: "/uz/business/register?plan=pro"
        },
        {
          id: "max",
          name: "Max",
          tagline: "Tarmoqli restoranlar va yirik xizmat ko'rsatuvchilar uchun.",
          price: "Tez orada",
          period: "narx e'lon qilinadi",
          features: [
            "Pro rejasidagi barcha imkoniyatlar",
            "Bosh sahifada maxsus banner joylashuvi",
            "Eksklyuziv promo-aksiyalar e'loni",
            "Bir nechta filiallarni yagona boshqarish",
            "Shaxsiy menejer va 24/7 qo'llab-quvvatlash",
            "Shaxsiy brending va foto-suratga olish"
          ],
          cta: "Biz bilan bog'lanish",
          ctaHref: "/uz/business/register?plan=max"
        }
      ]
    },
    waitlist: {
      badge: "Gurman mobil",
      title: "Gurman mobil tajribasiga qiziqasizmi?",
      subtitle:
        "Email manzilingizni qoldiring — Gurman mobil tajribasi haqida yangiliklar bo'lsa, xabar beramiz.",
      placeholder: "Email manzilingiz...",
      cityPlaceholder: "",
      cta: "Yangiliklardan xabardor bo'lish",
      note: "Spam yo'q. Faqat Gurman mobil tajribasi haqidagi yangiliklar.",
      successTitle: "Rahmat — siz ro'yxatdasiz.",
      successBody: "Gurman mobil tajribasi haqida yangiliklar bo'lsa, sizga xabar beramiz."
    },
    testimonials: {
      badge: "Jamiyat fikrlari",
      title: "Haqiqiy dalillarni ko'rsatamiz.",
      subtitle: "Tekshirilgan fikrlar uchun manba va ruxsat bo'lmasa, ularni nashr qilmaymiz.",
      items: []
    },
    faq: {
      badge: "Ko'p so'raladigan savollar",
      title: "Barcha savollaringizga aniq javoblar",
      subtitle: "Manzil platformasi haqida eng ko'p beriladigan savollar.",
      items: [
        {
          question: "Manzil nima va u qanday xizmatlarni taqdim etadi?",
          answer:
            "Manzil — Toshkentdagi mahalliy bizneslarni topish va solishtirish uchun shahar katalogi. Gurman esa kelajakdagi mobil rejalashtirish tajribasi sifatida ishlab chiqilmoqda."
        },
        {
          question: "Manzildagi joylar qanday tanlanadi?",
          answer:
            "Manzil katalogidagi joylar haqiqiy ma'lumotlar va mehmonlar qoldirgan sharhlar asosida ko'rsatiladi."
        },
        {
          question: "Biznesimni Manzilga qo'shish bepulmi?",
          answer:
            "Ha! Asosiy tarifimiz doimiy bepul. Siz istalgan vaqtda biznes profilingizni yaratib, o'z joyingizni katalogga qo'shishingiz mumkin. Pro va Max imkoniyatlari tez orada taqdim etiladi."
        },
        {
          question: "Platforma qaysi tillarda ishlaydi?",
          answer:
            "Manzil uch tilda: O'zbekcha (lotin), Ruscha va Inglizcha faoliyat yuritadi."
        },
        {
          question: "Boshqa shaharlar qachon qo'shiladi?",
          answer:
            "Hozirgi katalog Toshkentga qaratilgan. Boshqa shaharlar bo'yicha ochilish sanasi e'lon qilinmagan."
        }
      ]
    },
    finalCta: {
      badge: "Hoziroq kashf eting",
      title: "Shahringizning eng sara maskanlarini topishga tayyormisiz?",
      subtitle:
        "Katalogdagi mavjud ma'lumotlarni solishtiring yoki biznesingizni Manzilga qo'shing.",
      primaryCta: "Katalogga o'tish",
      primaryHref: "/uz/discover",
      secondaryCta: "Biznesni qo'shish",
      secondaryHref: "/uz/business/register",
      perks: ["Tezkor & Oson", "Mavjud sharhlar", "Bepul boshlash"]
    },
    homeCta: {
      badge: "Manzil tizimi",
      title: "Bugun katalogni ko'ring. Ertangi Gurman mobil tajribasini kuting.",
      subtitle:
        "Mavjud joylarni solishtiring yoki Gurman mobil tajribasi haqidagi yangiliklarga yoziling.",
      primaryCta: "Katalogni ko'rish",
      primaryHref: "/uz/discover",
      secondaryCta: "Gurman yangiliklari",
      secondaryHref: "/uz/waitlist/gurman",
      perks: ["Hozir: katalog", "Preview: mobil Gurman", "Bronlash simulyatsiya qilinmaydi"]
    }
  },
  ru: {
    cta: "Начать",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Реальные места Ташкента",
      title1: "Находите реальные места.",
      title2: "Планируйте то, что будет дальше.",
      subtitle:
        "Manzil помогает находить и сравнивать доступные локальные бизнесы в Ташкенте. Gurman AI разрабатывается как будущий мобильный помощник для планирования впечатлений.",
      explore: "Открыть каталог",
      secondaryCta: "В лист ожидания мобильного Gurman",
      systemAriaLabel: "Система Manzil: от доступного каталога к будущему мобильному Gurman",
      systemLiveLabel: "Доступно сейчас",
      systemLiveTitle: "Смотрите доступные места",
      systemFutureLabel: "Предпросмотр",
      systemFutureTitle: "Мобильное планирование Gurman",
      systemFutureNote: "Лист ожидания открыт",
      systemChips: ["Место", "Еда", "Торт", "Бюджет"],
      microPerks: ["Доступные данные каталога", "Начинаем с Ташкента", "Можно изучать бесплатно"]
    },
    gurman: {
      eyebrow: "Gurman AI · мобильный опыт",
      title: "От «что будем делать?» — к понятному плану.",
      description:
        "Gurman AI разрабатывается как мобильный планировщик локальных впечатлений. Он должен помогать собрать в одном редактируемом плане место, еду, торт, транспорт, бюджет, атмосферу и время.",
      boundary: "Сейчас: концепция и лист ожидания. Веб-чата и бронирования пока нет.",
      status: "Предпросмотр · мобильный продукт · лист ожидания открыт",
      cta: "В лист ожидания Gurman",
      previewTitle: "День рождения для 4 человек",
      previewSubtitle: "Концепция плана",
      previewFooter: "Концепт · без бронирования и онлайн-доступности",
      chips: ["Место", "Еда", "Торт", "Транспорт", "Бюджет", "Атмосфера", "Время"]
    },
    benefits: {
      badge: "Преимущества",
      title: "От идеи до готового впечатления",
      subtitle:
        "Каталог Manzil, отзывы сообщества и продуманный интерфейс экономят ваше время и помогают выбрать подходящее место.",
      cards: [
        {
          icon: "sparkles",
          tag: "Каталог Manzil",
          title: "Находите реальные места",
          description:
            "Сравнивайте доступные карточки мест, отзывы, фотографии и другие поля каталога перед своим решением."
        },
        {
          icon: "verified",
          tag: "Достоверность",
          title: "Изучайте отзывы с контекстом",
          description:
            "Смотрите доступные оценки, впечатления и фотографии, чтобы принять решение, подходящее именно вам."
        },
        {
          icon: "search",
          tag: "Быстрый поиск",
          title: "Удобный городской каталог",
          description:
            "Рестораны, кофейни, сервисные центры и места отдыха с удобной сортировкой по районам Ташкента."
        },
        {
          icon: "trending_up",
          tag: "Для бизнеса",
          title: "Покажите бизнес в каталоге",
          description:
            "Добавьте компанию в каталог, покажите основные услуги и управляйте доступными данными профиля."
        }
      ]
    },
    features: {
      badge: "Возможности",
      title: "Новый взгляд на городскую жизнь",
      subtitle: "Доступные функции для поиска мест и представления локального бизнеса.",
      tabs: [
        {
          id: "discover",
          label: "Каталог",
          title: "Сравнивайте места Ташкента по доступным данным",
          description:
            "Находите места по категориям и районам, а затем сравнивайте те поля каталога, которые доступны сегодня.",
          bullets: [
            "Поиск по районам и категориям",
            "Доступные оценки, отзывы и фотографии",
            "Прямая связь с заведением и прокладка маршрута"
          ],
          badge: "Данные каталога",
          metricLabel: "Статус каталога",
          metricValue: "Доступные поля"
        },
        {
          id: "catalog",
          label: "Умный каталог",
          title: "Места Ташкента в одном каталоге",
          description:
            "Находите места по категориям и районам, затем сравнивайте доступные часы работы, меню, фотографии и контакты.",
          bullets: [
            "Быстрая сортировка по районам и геолокации",
            "Доступные фотографии от посетителей",
            "Прямые контакты и переход в Telegram"
          ],
          badge: "Данные каталога",
          metricLabel: "Статус каталога",
          metricValue: "Доступные поля"
        },
        {
          id: "business",
          label: "Бизнес-портал",
          title: "Покажите бизнес в каталоге",
          description:
            "Создайте профиль компании, добавьте услуги и укажите прямые каналы связи для пользователей каталога.",
          bullets: [
            "Управление данными профиля",
            "Работа с доступными отзывами",
            "Расширенное представление профиля"
          ],
          badge: "Профиль бизнеса",
          metricLabel: "Статус профиля",
          metricValue: "Добавление в каталог"
        }
      ]
    },
    process: {
      badge: "Как это работает",
      title: "От идеи до воспоминания",
      subtitle: "Найти подходящее место или услугу на Manzil легко и приятно.",
      steps: [
        {
          number: "01",
          title: "Начните с каталога Manzil",
          description:
            "Выберите категорию, район или поисковый запрос и откройте подходящие варианты.",
          icon: "search"
        },
        {
          number: "02",
          title: "Изучите честные отзывы",
          description:
            "Изучите доступные оценки, отзывы и фотографии перед принятием решения.",
          icon: "star"
        },
        {
          number: "03",
          title: "Посещайте и делитесь впечатлениями",
          description:
            "Постройте маршрут, свяжитесь напрямую и наслаждайтесь отличным сервисом.",
          icon: "verified"
        }
      ]
    },
    bento: {
      title: "Места из каталога",
      subtitle: "Места из каталога Manzil — с доступными отзывами и данными.",
      viewAll: "Все категории",
      featuredBadge: "Выбор Manzil",
      partnerTitle: "У вас свой бизнес?",
      partnerText:
        "Добавьте профиль в каталог и покажите услуги пользователям Manzil.",
      partnerCta: "Стать партнёром"
    },
    pricing: {
      badge: "Тарифы для бизнеса",
      title: "Гибкие тарифные планы для любого масштаба",
      subtitle: "Разместите компанию на платформе Manzil и привлекайте новых клиентов.",
      tiers: [
        {
          id: "free",
          name: "Free",
          tagline: "Для присутствия в каталоге и отображения основной информации.",
          price: "0 сум",
          period: "навсегда бесплатно",
          features: [
            "Базовый профиль компании",
            "Адрес, телефон и график работы",
            "Загрузка до 5 фотографий",
            "Приём отзывов клиентов",
            "Отображение на карте города"
          ],
          cta: "Начать бесплатно",
          ctaHref: "/ru/business/register"
        },
        {
          id: "pro",
          name: "Pro",
          tagline: "Для активного привлечения клиентов и лидерства в своей категории.",
          price: "Скоро",
          period: "цена будет объявлена",
          popular: true,
          features: [
            "Все возможности тарифа Free",
            "Синяя галочка 'Verified'",
            "Высокие позиции в результатах поиска",
            "Расширенное представление профиля",
            "Неограниченно фото и полное меню",
            "Подробная аналитика просмотров"
          ],
          cta: "Выбрать тариф Pro",
          ctaHref: "/ru/business/register?plan=pro"
        },
        {
          id: "max",
          name: "Max",
          tagline: "Для ресторанных сетей и крупных сервисных компаний.",
          price: "Скоро",
          period: "цена будет объявлена",
          features: [
            "Все возможности тарифа Pro",
            "Спец-размещение на главной странице",
            "Публикация эксклюзивных акций",
            "Управление сетью филиалов в одном кабинете",
            "Персональный менеджер и поддержка 24/7",
            "Профессиональная фотосъёмка заведения"
          ],
          cta: "Связаться с нами",
          ctaHref: "/ru/business/register?plan=max"
        }
      ]
    },
    waitlist: {
      badge: "Gurman mobile",
      title: "Хотите узнать о мобильном Gurman?",
      subtitle:
        "Оставьте email — мы сообщим новости о мобильном Gurman, когда появятся обновления.",
      placeholder: "Ваш email...",
      cityPlaceholder: "",
      cta: "Узнавать новости",
      note: "Без спама. Только новости о мобильном Gurman.",
      successTitle: "Спасибо — вы в списке.",
      successBody: "Мы сообщим новости о мобильном Gurman, когда появятся обновления."
    },
    testimonials: {
      badge: "Отзывы сообщества",
      title: "Показываем реальные доказательства.",
      subtitle: "Мы не публикуем отзывы без проверенного источника и разрешения.",
      items: []
    },
    faq: {
      badge: "Часто задаваемые вопросы",
      title: "Ответы на популярные вопросы",
      subtitle: "Всё, что нужно знать о платформе Manzil и планах по мобильному Gurman.",
      items: [
        {
          question: "Что такое Manzil?",
          answer:
            "Manzil — это городской каталог для поиска и сравнения локальных бизнесов в Ташкенте. Gurman разрабатывается как будущий мобильный помощник для планирования впечатлений."
        },
        {
          question: "Что такое Gurman?",
          answer:
            "Gurman — будущий мобильный помощник для планирования локальных впечатлений. Сейчас он находится в разработке; о запуске можно узнать через лист ожидания."
        },
        {
          question: "Бесплатно ли добавлять бизнес на платформу?",
          answer:
            "Да, тариф Free полностью бесплатен. Расширенные возможности Pro и Max появятся позже."
        },
        {
          question: "Какие языки поддерживает сервис?",
          answer:
            "Платформа Manzil доступна на узбекском, русском и английском языках. Мобильный Gurman находится в разработке."
        },
        {
          question: "Когда сервис появится в других городах Узбекистана?",
          answer:
            "Текущий каталог ориентирован на Ташкент. Даты запуска в других городах пока не объявлены."
        }
      ]
    },
    finalCta: {
      badge: "Начните прямо сейчас",
      title: "Готовы открыть лучшие места своего города?",
      subtitle:
        "Сравнивайте доступные данные каталога или добавьте свой бизнес на Manzil уже сегодня.",
      primaryCta: "В каталог",
      primaryHref: "/ru/discover",
      secondaryCta: "Зарегистрировать бизнес",
      secondaryHref: "/ru/business/register",
      perks: ["Быстрый старт", "Доступные отзывы", "Бесплатный старт"]
    },
    homeCta: {
      badge: "Система Manzil",
      title: "Откройте каталог сегодня. Следите за мобильным Gurman завтра.",
      subtitle:
        "Сравнивайте доступные места или подписывайтесь на новости о мобильном опыте Gurman.",
      primaryCta: "Открыть каталог",
      primaryHref: "/ru/discover",
      secondaryCta: "Новости Gurman",
      secondaryHref: "/ru/waitlist/gurman",
      perks: ["Сейчас: каталог", "Предпросмотр: Gurman mobile", "Бронирование не симулируем"]
    }
  },
  en: {
    cta: "Get started",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Real places in Tashkent",
      title1: "Find real places.",
      title2: "Plan what comes next.",
      subtitle:
        "Manzil helps you find and compare available local businesses in Tashkent. Gurman AI is being developed as a future mobile planner for local experiences.",
      explore: "Explore Discover",
      secondaryCta: "Join the Gurman mobile waitlist",
      systemAriaLabel: "The Manzil system: from the available directory to future Gurman mobile planning",
      systemLiveLabel: "Live",
      systemLiveTitle: "Browse available places",
      systemFutureLabel: "Mobile preview",
      systemFutureTitle: "Gurman AI planning",
      systemFutureNote: "Waitlist open",
      systemChips: ["Venue", "Food", "Cake", "Budget"],
      microPerks: ["Available directory data", "Starting in Tashkent", "Free to explore"]
    },
    gurman: {
      eyebrow: "Gurman AI · mobile experience",
      title: "From “what should we do?” to a clearer plan.",
      description:
        "Gurman AI is being developed as a mobile planner for local experiences. It is designed to bring venue, food, cake, transport, budget, atmosphere, and timing into one editable plan.",
      boundary: "Now: concept and waitlist. No web chat or booking yet.",
      status: "Mobile preview · Waitlist open",
      cta: "Join the Gurman waitlist",
      previewTitle: "Birthday for 4 people",
      previewSubtitle: "Example planning workspace",
      previewFooter: "Concept preview · no booking or live availability",
      chips: ["Venue", "Food", "Cake", "Transport", "Budget", "Atmosphere", "Timing"]
    },
    benefits: {
      badge: "Benefits",
      title: "From one decision to a full experience",
      subtitle:
        "The Manzil directory, community reviews, and an intuitive catalog save you time and help you find a suitable place.",
      cards: [
        {
          icon: "sparkles",
          tag: "Manzil Directory",
          title: "Find real places",
          description:
            "Compare available place profiles, reviews, photos, and other directory fields before making your own decision."
        },
        {
          icon: "verified",
          tag: "Authenticity",
          title: "Read reviews with context",
          description:
            "See the available ratings, opinions, and photos before choosing the place that fits you."
        },
        {
          icon: "search",
          tag: "Fast Search",
          title: "Comprehensive city directory",
          description:
            "Restaurants, cafés, lifestyle services, and leisure spots organized cleanly by district and category."
        },
        {
          icon: "trending_up",
          tag: "Business Profile",
          title: "Show your business in the directory",
          description:
            "List your company on Manzil, show your services, and manage the profile data available to directory users."
        }
      ]
    },
    features: {
      badge: "Features",
      title: "A smarter way to experience the city",
      subtitle: "Available features for finding places and presenting local businesses.",
      tabs: [
        {
          id: "discover",
          label: "Discover",
          title: "Compare Tashkent places using available data",
          description:
            "Find places by category and district, then compare the directory fields that are available today.",
          bullets: [
            "Search by district and category",
            "Available ratings, reviews, and photos",
            "Direct contact channels and directions"
          ],
          badge: "Directory data",
          metricLabel: "Directory status",
          metricValue: "Available fields"
        },
        {
          id: "catalog",
          label: "Smart Directory",
          title: "Tashkent places in one directory",
          description:
            "Find places by category and district, then compare available hours, menus, photos, and contact details.",
          bullets: [
            "Fast district and geolocation filtering",
            "Available visitor photo galleries",
            "Direct phone and Telegram shortcuts"
          ],
          badge: "Catalogue data",
          metricLabel: "Catalogue status",
          metricValue: "Available fields"
        },
        {
          id: "business",
          label: "Business Portal",
          title: "Show your business in the directory",
          description:
            "Create a business profile, add service listings, and show direct contact channels for directory users.",
          bullets: [
            "Manage available profile data",
            "Work with available reviews",
            "Enhanced catalogue profile"
          ],
          badge: "Business profile",
          metricLabel: "Profile status",
          metricValue: "Join the directory"
        }
      ]
    },
    process: {
      badge: "How it works",
      title: "From an idea to a memory",
      subtitle: "The Manzil directory helps you compare available options and choose your next step.",
      steps: [
        {
          number: "01",
          title: "Start with the Manzil directory",
          description:
            "Choose a category, district, or search query to open options that fit your plan.",
          icon: "search"
        },
        {
          number: "02",
          title: "Compare real options",
          description:
            "Review the ratings, opinions, and visitor photos available on each profile before making your choice.",
          icon: "star"
        },
        {
          number: "03",
          title: "Make the experience happen",
          description:
            "Get directions, connect directly with the venue, and share your experience with the community.",
          icon: "verified"
        }
      ]
    },
    bento: {
      title: "Explore available places",
      subtitle: "Places listed on Manzil, with the reviews and details that are available.",
      viewAll: "View all categories",
      featuredBadge: "Featured",
      partnerTitle: "Own a local business?",
      partnerText: "List your profile on Manzil and show your services to directory users.",
      partnerCta: "Partner with us"
    },
    pricing: {
      badge: "Business Pricing",
      title: "Flexible plans for businesses of all sizes",
      subtitle: "Showcase your business on Manzil and attract new high-intent local clients.",
      tiers: [
        {
          id: "free",
          name: "Free",
          tagline: "Essential listing to establish your presence on the platform.",
          price: "0 UZS",
          period: "forever free",
          features: [
            "Basic business profile",
            "Address, phone, and opening hours",
            "Upload up to 5 photos",
            "Receive customer reviews",
            "Interactive map placement"
          ],
          cta: "Join Free",
          ctaHref: "/en/business/register"
        },
        {
          id: "pro",
          name: "Pro",
          tagline: "For growing businesses looking to dominate search rankings.",
          price: "Coming soon",
          period: "pricing to be announced",
          popular: true,
          features: [
            "Everything in Free plan",
            "Verified blue badge",
            "Top ranking in search & catalog results",
            "Enhanced catalogue profile",
            "Unlimited photos and full menu upload",
            "Detailed audience view analytics"
          ],
          cta: "Choose Pro",
          ctaHref: "/en/business/register?plan=pro"
        },
        {
          id: "max",
          name: "Max",
          tagline: "For restaurant groups, multi-branch chains, and premier venues.",
          price: "Coming soon",
          period: "pricing to be announced",
          features: [
            "Everything in Pro",
            "Featured placement on homepage banner",
            "Exclusive promotional announcements",
            "Multi-branch centralized management",
            "Dedicated account manager & 24/7 support",
            "Professional photo shoot included"
          ],
          cta: "Contact Us",
          ctaHref: "/en/business/register?plan=max"
        }
      ]
    },
    waitlist: {
      badge: "Gurman mobile",
      title: "Curious about the Gurman mobile experience?",
      subtitle:
        "Leave your email and we will share updates about Gurman mobile as they become available.",
      placeholder: "Your email...",
      cityPlaceholder: "",
      cta: "Get updates",
      note: "No spam. Only updates about Gurman mobile.",
      successTitle: "Thank you — you are on the list.",
      successBody: "We will share updates about Gurman mobile as they become available."
    },
    testimonials: {
      badge: "Community evidence",
      title: "Show the evidence, not invented outcomes.",
      subtitle: "We do not publish testimonials without a verified source and permission.",
      items: []
    },
    faq: {
      badge: "FAQ",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about Manzil and the planned Gurman mobile experience.",
      items: [
        {
          question: "What is Manzil?",
          answer:
            "Manzil is a local-business directory for finding and comparing places in Tashkent. Gurman is being developed as a future mobile planner for local experiences."
        },
        {
          question: "What is Gurman?",
          answer:
            "Gurman is a future mobile planner for local experiences. It is currently in development; join the waitlist to hear when it launches."
        },
        {
          question: "Is it free to list my business?",
          answer:
            "Yes. The Free tier is available at no cost. Expanded Pro and Max capabilities will be introduced later."
        },
        {
          question: "What languages are supported?",
          answer:
            "The Manzil website is available in Uzbek (Latin), Russian, and English. Gurman mobile is still in development."
        },
        {
          question: "When will other cities be added?",
          answer:
            "The current directory is focused on Tashkent. Launch dates for other cities have not been announced."
        }
      ]
    },
    finalCta: {
      badge: "Start Today",
      title: "Ready to explore the best of your city?",
      subtitle:
        "Compare the available directory details or add your business to Manzil today.",
      primaryCta: "Explore Catalog",
      primaryHref: "/en/discover",
      secondaryCta: "Register Business",
      secondaryHref: "/en/business/register",
      perks: ["Instant Start", "Available reviews", "Free to begin"]
    },
    homeCta: {
      badge: "The Manzil system",
      title: "Explore the directory today. Follow Gurman mobile tomorrow.",
      subtitle:
        "Compare available places or get updates about the Gurman mobile experience.",
      primaryCta: "Explore Discover",
      primaryHref: "/en/discover",
      secondaryCta: "Gurman updates",
      secondaryHref: "/en/waitlist/gurman",
      perks: ["Now: directory", "Preview: Gurman mobile", "No booking simulation"]
    }
  }
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return landing[locale] ?? landing.uz;
}
