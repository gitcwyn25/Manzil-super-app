import type { Locale } from "@manzil/shared";
import type { BentoCopy } from "../components/home/bento-business-grid";
import type { IconName } from "../components/vm/icons";

export type CleverHeroCopy = {
  memberBadge: string;
  title1: string;
  title2: string;
  subtitle: string;
  explore: string;
  how: string;
  chatName: string;
  chatStatus: string;
  chatAi: string;
  chatUser: string;
  microPerks: string[];
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
  benefits: CleverBenefitsCopy;
  features: CleverFeaturesCopy;
  process: CleverProcessCopy;
  bento: BentoCopy;
  pricing: CleverPricingCopy;
  waitlist: CleverWaitlistCopy;
  testimonials: CleverTestimonialsCopy;
  faq: CleverFaqCopy;
  finalCta: CleverCtaCopy;
};

const landing: Record<string, LandingCopy> = {
  uz: {
    cta: "Boshlash",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Toshkentdagi haqiqiy maskanlar",
      title1: "Joy emas,",
      title2: "tajriba rejalashtiring.",
      subtitle:
        "Nima rejalashtirayotganingizni ayting. Manzil katalogi mavjud maskanlarni solishtirishga yordam beradi.",
      explore: "Rejani boshlash",
      how: "Katalogni ko'rish",
      chatName: "Manzil katalogi",
      chatStatus: "Toshkentdagi joylar",
      chatAi: "Salom! Toshkentdagi haqiqiy joylar va sharhlarni ko'ring.",
      chatUser: "Shanba oqshomi uchun sokin, sifatli qahva va desertlari bor joy kerak.",
      microPerks: ["Katalog ma'lumotlari", "Toshkentdan boshlang", "Bepul boshlash"]
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
          tag: "Biznes Hamkorlik",
          title: "Biznesingizni yangi bosqichga olib chiqing",
          description:
            "Kompaniyangizni ro'yxatdan o'tkazing, yangi mijozlar oqimiga ega bo'ling va statistikalarni kuzating."
        }
      ]
    },
    features: {
      badge: "Xususiyatlar",
      title: "Shaharni kashf qilishning yangi usuli",
      subtitle: "Foydalanuvchilar va biznes egalari uchun qulaylik yaratuvchi zamonaviy funksiyalar.",
      tabs: [
        {
          id: "concierge",
          label: "Katalog",
          title: "Sizning shaxsiy shahar gid-maslahatchisi",
          description:
            "Turkumlar, tumanlar va reytinglar bo'yicha kerakli maskanni tez toping.",
          bullets: [
            "Tabiiy tildagi savollarni tushunish (O'zbek, Rus, Ingliz)",
            "Haqiqiy sharhlardagi muhim jihatlarni umumlashtirish",
            "To'g'ridan-to'g'ri bog'lanish va marshrut tuzish"
          ],
          badge: "Aqlli Tavsiya",
          metricLabel: "Qidiruv vaqti tejalishi",
          metricValue: "—"
        },
        {
          id: "catalog",
          label: "Aqlli Katalog",
          title: "Toshkentning eng yaxshi maskanlari bir joyda",
          description:
            "Turkumlar, tumanlar va reytinglar bo'yicha qulay filtrlash tizimi. Mavjud ish vaqti, menyu, fotosuratlar va aloqa ma'lumotlarini bir joyda ko'ring.",
          bullets: [
            "Tumanlar va lokatsiya bo'yicha tezkor saralash",
            "Mavjud fotosuratlarni ko'rish",
            "To'g'ridan-to'g'ri telefon va Telegram havolalari"
          ],
          badge: "Katalog ma'lumotlari",
          metricLabel: "Katalog holati",
          metricValue: "—"
        },
        {
          id: "business",
          label: "Biznes Portali",
          title: "Mijozlar sizni oson topishsin",
          description:
            "Biznesingiz profilini yarating, xizmatlaringizni joylashtiring, aksiyalar e'lon qiling va to'g'ridan-to'g'ri mijozlar oqimini qabul qiling.",
          bullets: [
            "Qulay boshqaruv paneli va tahlillar",
            "Mijozlar sharhlariga tezkor javob berish",
            "Katalogda ko'rinish"
          ],
          badge: "Biznes profili",
          metricLabel: "Profil holati",
          metricValue: "—"
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
            "Mehmonlarning xolisona fikrlari, baholari va haqiqiy fotosuratlarini ko'rib, to'g'ri qaror qabul qiling.",
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
      title: "Eng yaxshi joylar",
      subtitle: "Manzildagi katalog joylari — mavjud sharhlar va ma'lumotlar bilan.",
      viewAll: "Barcha turkumlarni ko'rish",
      featuredBadge: "Tanlangan",
      partnerTitle: "Biznesingiz bormi?",
      partnerText:
        "Manzilga qo'shiling — xizmatlaringizni izlayotgan mijozlar sizni oson topishsin.",
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
      badge: "Kengayish",
      title: "O'z shahringizda birinchilardan bo'ling",
      subtitle:
        "Samarqand, Buxoro, Namangan va boshqa shaharlarga tez orada kirib boramiz. Ro'yxatdan o'ting va yangiliklardan birinchi bo'lib xabardor bo'ling.",
      placeholder: "Telefon raqamingiz yoki emailingiz...",
      cityPlaceholder: "Shahringizni tanlang...",
      cta: "Navbatga qo'shilish",
      note: "Spam yo'q. Faqat shahringizda ishga tushganimizda xabar beramiz.",
      successTitle: "Rahmat! Siz navbatdasiz.",
      successBody: "Shahringizda platforma ochilishi bilan sizga birinchi bo'lib maxsus bonus bilan xabar yo'llaymiz."
    },
    testimonials: {
      badge: "Fikrlar",
      title: "Foydalanuvchilarimiz nima deydi?",
      subtitle: "Manzil orqali qulaylikka erishgan shahar aholisi va biznes egalari fikrlari.",
      items: [
        {
          name: "Jasur Rahimov",
          role: "Muntazam foydalanuvchi",
          company: "Toshkent",
          avatar: "JR",
          rating: 5,
          highlight: "Manzil juda qulay!",
          content:
            "Kechki ovqat uchun tinch va mazali joy izlayotgandim. Manzil orqali mos qahvaxonani tez topdim."
        },
        {
          name: "Dilnoza Karimova",
          role: "Kafe asoschisi",
          company: "Vanilla Lounge",
          avatar: "DK",
          rating: 5,
          highlight: "Mijozlar oqimi sezilarli oshdi",
          content:
            "Manzil platformasida ro'yxatdan o'tganimizdan so'ng, yangi mehmonlarimiz safi kengaydi."
        },
        {
          name: "Bobur Mirzayev",
          role: "Mahalliy sayyoh",
          company: "Samarqand",
          avatar: "BM",
          rating: 5,
          highlight: "Haqiqiy sharhlar va aniq manzillar",
          content:
            "Toshkentga kelganimda sifatli xizmat ko'rsatish joylarini topish juda qiyin edi. Manzil menga eng toza va xizmati yuqori joylarni tezda topishga yordam berdi."
        }
      ]
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
          question: "Boshqa shaharlar (Samarqand, Buxoro) qachon qo'shiladi?",
          answer:
            "Hozirda Toshkent to'liq qamrab olingan bo'lib, viloyat markazlariga bosqichma-bosqich kengaymoqdamiz. 'Kengayish' bo'limida o'z shahringizni tanlab navbatga yozilishingiz mumkin."
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
    }
  },
  ru: {
    cta: "Начать",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Реальные места Ташкента",
      title1: "Планируйте впечатления,",
      title2: "а не просто места.",
      subtitle:
        "Расскажите, что ищете. Каталог Manzil поможет сравнить доступные места и принять решение на основе имеющихся данных.",
      explore: "Начать планирование",
      how: "Чат с Gurman AI",
      chatName: "Gurman AI Консьерж",
      chatStatus: "Подбирает рекомендацию…",
      chatAi: "Здравствуйте! Какое место вы ищете? Подберу на основе настоящих отзывов и проверенных данных.",
      chatUser: "Нужно тихое, атмосферное место с хорошим кофе и десертами на субботний вечер.",
      microPerks: ["Каталог Manzil", "Данные профилей", "Бесплатный старт"]
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
          title: "Персональные советы от Gurman AI",
          description:
            "Опишите свои пожелания простыми словами — Gurman AI проанализирует реальные отзывы и подберёт идеальные варианты."
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
          title: "Новый уровень для вашего бизнеса",
          description:
            "Добавьте свою компанию в каталог, привлекайте платёжеспособную аудиторию и отслеживайте статистику."
        }
      ]
    },
    features: {
      badge: "Возможности",
      title: "Новый взгляд на городскую жизнь",
      subtitle: "Современные инструменты для удобного поиска и роста локального бизнеса.",
      tabs: [
        {
          id: "concierge",
          label: "Gurman AI Консьерж",
          title: "Ваш личный персональный городской гид",
          description:
            "Находите подходящие места за секунды. В отличие от обычных поисковиков, Gurman AI учитывает атмосферу, нюансы из отзывов и соотношение цены и качества.",
          bullets: [
            "Понимание запросов на естественном языке (Узбекский, Русский, Английский)",
            "Сводка ключевых преимуществ из реальных отзывов",
            "Прямая связь с заведением и прокладка маршрута"
          ],
          badge: "Умный выбор",
          metricLabel: "Экономия времени поиска",
          metricValue: "—"
        },
        {
          id: "catalog",
          label: "Умный каталог",
          title: "Лучшие локации Ташкента в одном месте",
          description:
            "Удобные фильтры по категориям, районам и рейтингам. Смотрите доступные часы работы, меню, фотографии и контакты в одном месте.",
          bullets: [
            "Быстрая сортировка по районам и геолокации",
            "Доступные фотографии от посетителей",
            "Прямые контакты и переход в Telegram"
          ],
          badge: "Данные каталога",
          metricLabel: "Статус каталога",
          metricValue: "—"
        },
        {
          id: "business",
          label: "Бизнес-портал",
          title: "Пусть клиенты находят вас первыми",
          description:
            "Создайте профиль компании, добавляйте услуги, публикуйте акции и получайте поток прямых обращений от клиентов.",
          bullets: [
            "Удобный личный кабинет и аналитика просмотров",
            "Оперативные ответы на отзывы гостей",
            "Расширенное представление профиля"
          ],
          badge: "Профиль бизнеса",
          metricLabel: "Статус профиля",
          metricValue: "—"
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
            "Ознакомьтесь с реальными мнениями, рейтингами и фото гостей перед принятием решения.",
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
      title: "Лучшие места",
      subtitle: "Места из каталога Manzil — с доступными отзывами и данными.",
      viewAll: "Все категории",
      featuredBadge: "Выбор Manzil",
      partnerTitle: "У вас свой бизнес?",
      partnerText:
        "Присоединяйтесь к Manzil — пусть вас находят клиенты, которые ищут ваши услуги.",
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
      badge: "Расширение",
      title: "Будьте первыми в своём городе",
      subtitle:
        "Мы скоро запускаемся в Самарканде, Бухаре, Намангане и других регионах. Запишитесь в лист ожидания и получите ранний доступ.",
      placeholder: "Ваш телефон или email...",
      cityPlaceholder: "Выберите ваш город...",
      cta: "Вступить в лист ожидания",
      note: "Без спама. Сообщим только при запуске в вашем городе.",
      successTitle: "Спасибо! Вы в списке ожидания.",
      successBody: "Как только сервис откроется в вашем городе, вы получите персональное уведомление с бонусом."
    },
    testimonials: {
      badge: "Отзывы",
      title: "Что говорят наши пользователи?",
      subtitle: "Истории жителей города и владельцев бизнеса, использующих Manzil.",
      items: [
        {
          name: "Жасур Рахимов",
          role: "Постоянный пользователь",
          company: "Ташкент",
          avatar: "ЖР",
          rating: 5,
          highlight: "Gurman AI — это просто находка!",
          content:
            "Искал уютное место для семейного ужина. Gurman AI порекомендовал отличный ресторан с прекрасной террасой. Всё совпало с описанием до мелочей."
        },
        {
          name: "Дильноза Каримова",
          role: "Основательница кофейни",
          company: "Vanilla Lounge",
          avatar: "ДК",
          rating: 5,
          highlight: "Поток гостей заметно вырос",
          content:
            "После регистрации на Manzil к нам стали приходить новые гости, которые отмечают, что нашли нас именно через рекомендации AI-консьержа."
        },
        {
          name: "Бобур Мирзаев",
          role: "Путешественник",
          company: "Самарканд",
          avatar: "БМ",
          rating: 5,
          highlight: "Честные отзывы и точные координаты",
          content:
            "Приезжая в столицу по работе, всегда открываю Manzil. Очень удобно находить проверенные заведения рядом с местом встречи."
        }
      ]
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
            "Мы уже масштабируемся на Самарканд, Бухару и Ферганскую долину. Вы можете оставить заявку в разделе 'Расширение', чтобы узнать о старте первыми."
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
    }
  },
  en: {
    cta: "Get started",
    ios: "App Store",
    android: "Google Play",
    hero: {
      memberBadge: "Real places in Tashkent",
      title1: "Plan experiences,",
      title2: "not just places.",
      subtitle:
        "Tell us what you are looking for. The Manzil directory helps you compare available places using the data it has.",
      explore: "Start planning",
      how: "Chat with Gurman AI",
      chatName: "Gurman AI Concierge",
      chatStatus: "Generating real-time recommendation…",
      chatAi: "Hello! What kind of place are you looking for? I recommend based on authentic reviews and verified data.",
      chatUser: "Looking for a quiet, high-quality café with great coffee and desserts for Saturday evening.",
      microPerks: ["Manzil directory", "Profile details", "Free to start"]
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
          title: "Personalized advice with Gurman AI",
          description:
            "Describe what you need in natural language — Gurman AI analyzes authentic guest feedback to deliver tailored options."
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
          tag: "Business Growth",
          title: "Elevate your local business",
          description:
            "List your company on Manzil, reach high-intent customers, and track your audience engagement."
        }
      ]
    },
    features: {
      badge: "Features",
      title: "A smarter way to experience the city",
      subtitle: "State-of-the-art tools crafted for both visitors and local businesses.",
      tabs: [
        {
          id: "concierge",
          label: "Gurman AI Concierge",
          title: "Your personal AI city guide",
          description:
            "Find the perfect venue in seconds. Unlike traditional search engines, Gurman AI factors in ambiance, subtle review nuances, and price-to-quality balance.",
          bullets: [
            "Understands natural queries in Uzbek, Russian, and English",
            "Synthesizes key takeaways from genuine guest reviews",
            "Instant directions and direct contact channels"
          ],
          badge: "Smart Match",
          metricLabel: "Search time saved",
          metricValue: "—"
        },
        {
          id: "catalog",
          label: "Smart Directory",
          title: "Tashkent's top venues in one place",
          description:
            "Effortless filtering by category, district, and ratings. See available hours, menus, photos, and contact details in one place.",
          bullets: [
            "Fast district and geolocation filtering",
            "Available visitor photo galleries",
            "Direct phone and Telegram shortcuts"
          ],
          badge: "Catalogue data",
          metricLabel: "Catalogue status",
          metricValue: "—"
        },
        {
          id: "business",
          label: "Business Portal",
          title: "Let new customers discover you first",
          description:
            "Create your business profile, post service listings, announce promotions, and receive direct inquiries from local customers.",
          bullets: [
            "Intuitive management console and view analytics",
            "Prompt review responses to build trust",
            "Enhanced catalogue profile"
          ],
          badge: "Business profile",
          metricLabel: "Profile status",
          metricValue: "—"
        }
      ]
    },
    process: {
      badge: "How it works",
      title: "From an idea to a memory",
      subtitle: "Gurman clarifies your plan, compares real options, and helps you take the next step.",
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
            "Review real ratings, genuine opinions, and visitor photos before making your choice.",
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
      title: "Experience the best",
      subtitle: "Places listed on Manzil, with the reviews and details that are available.",
      viewAll: "View all categories",
      featuredBadge: "Featured",
      partnerTitle: "Own a local business?",
      partnerText: "Join Manzil and get found by customers who are looking for your services.",
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
      badge: "Expansion",
      title: "Be the first in your city",
      subtitle:
        "We are expanding rapidly to Samarkand, Bukhara, Namangan, and beyond. Join our early waitlist for priority launch benefits.",
      placeholder: "Your phone or email address...",
      cityPlaceholder: "Select your city...",
      cta: "Join Waitlist",
      note: "No spam. We will only notify you when we launch in your area.",
      successTitle: "Thank you! You're on the list.",
      successBody: "We will notify you with special early-access perks as soon as Manzil goes live in your city."
    },
    testimonials: {
      badge: "Testimonials",
      title: "What our community says",
      subtitle: "Hear how Manzil helps visitors and local entrepreneurs connect every day.",
      items: [
        {
          name: "Jasur Rahimov",
          role: "Active Member",
          company: "Tashkent",
          avatar: "JR",
          rating: 5,
          highlight: "Gurman AI is incredible!",
          content:
            "I was searching for a quiet dinner spot. The café recommended by Gurman AI was spot on with its ambiance and coffee quality. Manzil is now my default weekend guide."
        },
        {
          name: "Dilnoza Karimova",
          role: "Café Founder",
          company: "Vanilla Lounge",
          avatar: "DK",
          rating: 5,
          highlight: "Customer influx increased significantly",
          content:
            "Since listing our venue on Manzil, we've welcomed dozens of new guests who discovered us directly via AI Concierge suggestions."
        },
        {
          name: "Bobur Mirzayev",
          role: "Local Explorer",
          company: "Samarkand",
          avatar: "BM",
          rating: 5,
          highlight: "Honest feedback and accurate locations",
          content:
            "Whenever I travel to Tashkent on business, Manzil is indispensable for pinpointing high-standard dining and meeting spots near me."
        }
      ]
    },
    faq: {
      badge: "FAQ",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about Manzil and the planned Gurman mobile app.",
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
            "We are actively expanding across Samarkand, Bukhara, and the Fergana Valley. You can submit your city in the 'Expansion' section to be alerted on launch day."
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
    }
  }
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return landing[locale] ?? landing.uz;
}
