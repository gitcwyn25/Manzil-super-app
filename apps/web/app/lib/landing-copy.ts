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
        "Nima rejalashtirayotganingizni Gurman'ga ayting. U mavjud maskanlarni solishtiradi va qaror qabul qilishingizga yordam beradi.",
      explore: "Rejani boshlash",
      how: "Gurman AI bilan suhbat",
      chatName: "Gurman AI Konsyerj",
      chatStatus: "Real vaqtda tavsiya tayyorlanmoqda…",
      chatAi: "Salom! Qanday joy izlayapsiz? Haqiqiy sharhlar va joriy ma'lumotlar asosida tanlab beraman.",
      chatUser: "Shanba oqshomi uchun sokin, sifatli qahva va desertlari bor joy kerak.",
      microPerks: ["100% haqiqiy sharhlar", "Jonli katalog ma'lumotlari", "Mutlaqo bepul"]
    },
    benefits: {
      badge: "Afzalliklar",
      title: "Bir qarordan to'liq tajribagacha",
      subtitle:
        "Sun'iy intellekt, tekshirilgan sharhlar va qulay interfeys orqali vaqtingizni tejang va eng yaxshi joylarni tanlang.",
      cards: [
        {
          icon: "sparkles",
          tag: "AI Konsyerj",
          title: "Gurman AI bilan shaxsiy tavsiyalar",
          description:
            "Oddiy tilda o'z hohishingizni ayting — Gurman AI haqiqiy sharhlarni tahlil qilib, sizga mos variantlarni saralab beradi."
        },
        {
          icon: "verified",
          tag: "Haqiqiylik",
          title: "Tasdiqlangan va ishonchli sharhlar",
          description:
            "Soxta reytinglar yo'q. Faqat tashrif buyurgan haqiqiy mehmonlarning xolisona baholari va fotosuratlari."
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
          label: "Gurman AI Konsyerj",
          title: "Sizning shaxsiy shahar gid-maslahatchisi",
          description:
            "Bir necha soniyada hohishingizga mos maskanni toping. Gurman AI oddiy qidiruv tizimlaridan farqli ravishda atmosferani, sharhlardagi nozik jihatlarni va narx sifat mutanosibligini hisobga oladi.",
          bullets: [
            "Tabiiy tildagi savollarni tushunish (O'zbek, Rus, Ingliz)",
            "Haqiqiy sharhlardagi muhim jihatlarni umumlashtirish",
            "To'g'ridan-to'g'ri bog'lanish va marshrut tuzish"
          ],
          badge: "Aqlli Tavsiya",
          metricLabel: "Qidiruv vaqti tejalishi",
          metricValue: "85%"
        },
        {
          id: "catalog",
          label: "Aqlli Katalog",
          title: "Toshkentning eng yaxshi maskanlari bir joyda",
          description:
            "Turkumlar, tumanlar va reytinglar bo'yicha qulay filtrlash tizimi. Har bir joyning ish vaqti, menyusi, fotosuratlari va aloqa ma'lumotlari muntazam yangilanadi.",
          bullets: [
            "Tumanlar va lokatsiya bo'yicha tezkor saralash",
            "Haqiqiy tashrif buyuruvchilarning fotosuratlari",
            "To'g'ridan-to'g'ri telefon va Telegram havolalari"
          ],
          badge: "Tasdiqlangan Joylar",
          metricLabel: "Katalog yangilanishi",
          metricValue: "Har kuni"
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
            "Gurman AI tavsiyalarida ustunlik"
          ],
          badge: "Biznes O'sishi",
          metricLabel: "Mijozlar jalb qilish",
          metricValue: "3.2x"
        }
      ]
    },
    process: {
      badge: "Qanday ishlaydi",
      title: "G'oyadan yaxshi xotiragacha",
      subtitle: "Gurman rejangizni aniqlashtiradi, mos variantlarni ko'rsatadi va keyingi qadamni belgilaydi.",
      steps: [
        {
          number: "01",
          title: "Nimani rejalashtirayotganingizni ayting",
          description:
            "Katalog bo'ylab kerakli xizmatni qidiring yoki Gurman AI'ga o'zingiz istagan muhitni tasvirlab bering.",
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
      subtitle: "Manzildagi haqiqiy joylar — mehmonlarning haqiqiy sharhlari bilan.",
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
            "Gurman AI konsyerj tavsiyalarida ustunlik",
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
          highlight: "Gurman AI shunchaki mo'jiza!",
          content:
            "Kechki ovqat uchun tinch va mazali joy izlayotgandim. Gurman AI tavsiya qilgan qahvaxona kutganimdan ham a'lo chiqdi. Endi har dam olish kunlari faqat Manzil orqali joy tanlayman."
        },
        {
          name: "Dilnoza Karimova",
          role: "Kafe asoschisi",
          company: "Vanilla Lounge",
          avatar: "DK",
          rating: 5,
          highlight: "Mijozlar oqimi sezilarli oshdi",
          content:
            "Manzil platformasida ro'yxatdan o'tganimizdan so'ng, yangi mehmonlarimiz safi kengaydi. Ayniqsa yoshlar bizni Gurman AI orqali topib kelishayotganini aytishmoqda."
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
      subtitle: "Manzil platformasi va Gurman AI haqida eng ko'p beriladigan savollar.",
      items: [
        {
          question: "Manzil nima va u qanday xizmatlarni taqdim etadi?",
          answer:
            "Manzil — O'zbekistondagi eng yaxshi kafe, restoran, xizmat ko'rsatish markazlari va dam olish joylarini birlashtirgan zamonaviy shahar katalogi va AI konsyerj platformasidir."
        },
        {
          question: "Gurman AI tavsiyalari nimaga asoslanadi?",
          answer:
            "Gurman AI faqat Manzil katalogidagi haqiqiy joylar va ularga mehmonlar qoldirgan haqiqiy sharhlar tahliliga tayanadi. U hech qachon mavjud bo'lmagan joylarni o'ylab topmaydi."
        },
        {
          question: "Biznesimni Manzilga qo'shish bepulmi?",
          answer:
            "Ha! Asosiy tarifimiz doimiy bepul. Siz istalgan vaqtda biznes profilingizni yaratib, o'z joyingizni katalogga qo'shishingiz mumkin. Pro va Max imkoniyatlari tez orada taqdim etiladi."
        },
        {
          question: "Platforma qaysi tillarda ishlaydi?",
          answer:
            "Manzil va Gurman AI uch tilda: O'zbekcha (lotin), Ruscha va Inglizcha to'liq ravishda faoliyat yuritadi."
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
        "Gurman AI bilan vaqtingizni tejang, haqiqiy sharhlar asosida tanlang yoki o'z biznesingizni minglab yangi mijozlarga taniting.",
      primaryCta: "Katalogga o'tish",
      primaryHref: "/uz/discover",
      secondaryCta: "Biznesni qo'shish",
      secondaryHref: "/uz/business/register",
      perks: ["Tezkor & Oson", "Haqiqiy sharhlar", "100% bepul boshlash"]
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
        "Расскажите Gurman, что вы планируете. Он сравнит доступные места и поможет принять решение на основе данных каталога.",
      explore: "Начать планирование",
      how: "Чат с Gurman AI",
      chatName: "Gurman AI Консьерж",
      chatStatus: "Подбирает рекомендацию…",
      chatAi: "Здравствуйте! Какое место вы ищете? Подберу на основе настоящих отзывов и проверенных данных.",
      chatUser: "Нужно тихое, атмосферное место с хорошим кофе и десертами на субботний вечер.",
      microPerks: ["100% честные отзывы", "Живой каталог заведений", "Полностью бесплатно"]
    },
    benefits: {
      badge: "Преимущества",
      title: "От идеи до готового впечатления",
      subtitle:
        "Искусственный интеллект, проверенные отзывы и продуманный интерфейс экономят ваше время и помогают выбрать лучшее.",
      cards: [
        {
          icon: "sparkles",
          tag: "AI Консьерж",
          title: "Персональные советы от Gurman AI",
          description:
            "Опишите свои пожелания простыми словами — Gurman AI проанализирует реальные отзывы и подберёт идеальные варианты."
        },
        {
          icon: "verified",
          tag: "Достоверность",
          title: "Проверенные и честные отзывы",
          description:
            "Никаких накруток. Только настоящие оценки, впечатления и фотографии от реальных посетителей."
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
          metricValue: "85%"
        },
        {
          id: "catalog",
          label: "Умный каталог",
          title: "Лучшие локации Ташкента в одном месте",
          description:
            "Удобные фильтры по категориям, районам и рейтингам. График работы, актуальное меню, фотографии и контакты обновляются ежедневно.",
          bullets: [
            "Быстрая сортировка по районам и геолокации",
            "Честные фотографии от реальных гостей",
            "Прямые контакты и переход в Telegram"
          ],
          badge: "Проверенные места",
          metricLabel: "Обновление каталога",
          metricValue: "Ежедневно"
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
            "Приоритет в рекомендациях Gurman AI"
          ],
          badge: "Рост продаж",
          metricLabel: "Приток клиентов",
          metricValue: "3.2x"
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
          title: "Ищите сами или спросите Gurman AI",
          description:
            "Воспользуйтесь каталогом или опишите желаемую атмосферу нашему AI-консьержу.",
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
      subtitle: "Реальные места на Manzil — с настоящими отзывами гостей.",
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
            "Приоритетные рекомендации от Gurman AI",
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
      subtitle: "Всё, что нужно знать о платформе Manzil и возможностях Gurman AI.",
      items: [
        {
          question: "Что такое Manzil?",
          answer:
            "Manzil — это современная городская платформа и AI-консьерж для поиска лучших кафе, ресторанов, сервисов и мест отдыха в Узбекистане."
        },
        {
          question: "На чём строятся рекомендации Gurman AI?",
          answer:
            "Рекомендации формируются исключительно на базе реальных данных заведений и настоящих отзывов гостей из каталога Manzil. Искусственный интеллект не выдумывает несуществующие места."
        },
        {
          question: "Бесплатно ли добавлять бизнес на платформу?",
          answer:
            "Да, тариф Free полностью бесплатен. Расширенные возможности Pro и Max появятся позже."
        },
        {
          question: "Какие языки поддерживает сервис?",
          answer:
            "Платформа Manzil и Gurman AI полноценно работают на узбекском, русском и английском языках."
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
        "Экономьте время с Gurman AI, выбирайте по честным отзывам или зарегистрируйте свой бизнес на платформе уже сегодня.",
      primaryCta: "В каталог",
      primaryHref: "/ru/discover",
      secondaryCta: "Зарегистрировать бизнес",
      secondaryHref: "/ru/business/register",
      perks: ["Быстрый старт", "Честные отзывы", "100% бесплатно"]
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
        "Tell Gurman what you are planning. It compares available places and helps you decide using the catalogue's real data.",
      explore: "Start planning",
      how: "Chat with Gurman AI",
      chatName: "Gurman AI Concierge",
      chatStatus: "Generating real-time recommendation…",
      chatAi: "Hello! What kind of place are you looking for? I recommend based on authentic reviews and verified data.",
      chatUser: "Looking for a quiet, high-quality café with great coffee and desserts for Saturday evening.",
      microPerks: ["100% verified reviews", "Live catalog updates", "Completely free"]
    },
    benefits: {
      badge: "Benefits",
      title: "From one decision to a full experience",
      subtitle:
        "Intelligent AI guidance, verified community reviews, and an intuitive catalog save you time and help you find the best spots.",
      cards: [
        {
          icon: "sparkles",
          tag: "AI Concierge",
          title: "Personalized advice with Gurman AI",
          description:
            "Describe what you need in natural language — Gurman AI analyzes authentic guest feedback to deliver tailored options."
        },
        {
          icon: "verified",
          tag: "Authenticity",
          title: "100% verified local reviews",
          description:
            "No fake ratings. Only genuine opinions, photos, and ratings submitted by real visitors."
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
          metricValue: "85%"
        },
        {
          id: "catalog",
          label: "Smart Directory",
          title: "Tashkent's top venues in one place",
          description:
            "Effortless filtering by category, district, and ratings. Operating hours, current menus, photos, and contact info updated daily.",
          bullets: [
            "Fast district and geolocation filtering",
            "Authentic guest photo galleries",
            "Direct phone and Telegram shortcuts"
          ],
          badge: "Verified Places",
          metricLabel: "Catalog updates",
          metricValue: "Daily"
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
            "Priority placement in Gurman AI recommendations"
          ],
          badge: "Business Growth",
          metricLabel: "Customer reach",
          metricValue: "3.2x"
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
          title: "Tell Gurman what you are planning",
          description:
            "Browse categories or describe the vibe and preferences you want to our AI Concierge.",
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
      subtitle: "Real places on Manzil, with real reviews from guests.",
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
            "Priority Gurman AI Concierge recommendations",
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
      subtitle: "Everything you need to know about Manzil and Gurman AI.",
      items: [
        {
          question: "What is Manzil?",
          answer:
            "Manzil is Uzbekistan's premier local discovery platform and AI concierge, connecting people with top verified dining, leisure, and service establishments."
        },
        {
          question: "How does Gurman AI generate suggestions?",
          answer:
            "Gurman AI analyzes real business data and authentic customer reviews from the Manzil directory. It never fabricates non-existent venues."
        },
        {
          question: "Is it free to list my business?",
          answer:
            "Yes. The Free tier is available at no cost. Expanded Pro and Max capabilities will be introduced later."
        },
        {
          question: "What languages are supported?",
          answer:
            "The entire Manzil experience and Gurman AI natively support Uzbek (Latin), Russian, and English."
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
        "Save time with Gurman AI, discover genuine local spots, or list your business for thousands of new customers.",
      primaryCta: "Explore Catalog",
      primaryHref: "/en/discover",
      secondaryCta: "Register Business",
      secondaryHref: "/en/business/register",
      perks: ["Instant Start", "Verified Reviews", "100% Free to Begin"]
    }
  }
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return landing[locale] ?? landing.uz;
}
