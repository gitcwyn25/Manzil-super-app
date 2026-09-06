import type { Locale } from "@manzil/shared";

/**
 * Copy for the business-facing website (landing, dashboard, admin shell).
 * The consumer experience lives in the mobile apps; the web is the portal
 * for business owners and platform admins.
 */
const copy = {
  uz: {
    nav: {
      home: "Bosh sahifa",
      pricing: "Narxlar",
      forBusiness: "Biznes uchun",
      discover: "Kashf eting",
      concierge: "Katalog",
      events: "Tadbirlar",
      dashboard: "Kabinet",
      admin: "Admin",
      getApp: "Ilovani yuklab olish",
      signIn: "Kirish"
    },
    hero: {
      badge: "Manzil Biznes Platformasi",
      title1: "Biznesingizni",
      title2: "Manzil’da boshqaring",
      subtitle:
        "Toshkentdagi minglab mijozlar biznesingizni Manzil ilovasida topadi. Listinggizni tasdiqlang, sharhlarga javob bering va obro'ingizni bitta kabinetdan boshqaring.",
      ctaPrimary: "Biznesni tasdiqlash",
      ctaSecondary: "Kabinetga kirish",
      trustLine: "Bepul boshlang — kredit karta talab qilinmaydi"
    },
    stats: {
      title: "Platforma raqamlarda",
      businesses: "Ro'yxatdagi bizneslar",
      reviews: "Haqiqiy sharhlar",
      views: "Oylik ko'rishlar",
      cities: "Shaharlar"
    },
    features: {
      kicker: "Nima uchun Manzil",
      title: "Biznes egalari uchun to'liq nazorat",
      items: [
        {
          title: "Listingni tasdiqlang",
          text: "Biznesingiz egaligini tasdiqlab, ma'lumotlarni o'zingiz boshqaring."
        },
        {
          title: "Sharhlarga javob",
          text: "Har bir mijoz sharhiga rasmiy egasi sifatida javob qaytaring."
        },
        {
          title: "Jonli statistika",
          text: "Ko'rishlar, saqlashlar va reyting dinamikasini kuzating."
        },
        {
          title: "Tasdiqlangan nishon",
          text: "Verified belgisi mijozlar ishonchini oshiradi."
        },
        {
          title: "Foto galereya",
          text: "Professional suratlar bilan profilingizni jonlantiring."
        },
        {
          title: "Ish vaqti va aloqa",
          text: "Manzil, telefon va ish soatlarini yangilab turing."
        },
        {
          title: "Moderatsiya himoyasi",
          text: "Spam va soxta sharhlar admin jamoasi tomonidan nazorat qilinadi."
        },
        {
          title: "Premium imkoniyatlar",
          text: "Tez orada: reklama joylashuvi va kengaytirilgan analitika."
        }
      ]
    },
    how: {
      kicker: "Qanday ishlaydi",
      title: "3 qadamda boshlang",
      steps: [
        { title: "Ro'yxatdan o'ting", text: "Clerk orqali xavfsiz kirish — 1 daqiqa." },
        { title: "Biznesingizni tasdiqlang", text: "Listingni toping va egalik so'rovini yuboring." },
        { title: "Boshqaring va o'sing", text: "Admin tasdiqlagach, kabinet to'liq ochiladi." }
      ]
    },
    app: {
      kicker: "Mijozlaringiz qayerda?",
      title: "Mijozlar Manzil ilovasida",
      subtitle:
        "iOS va Android ilovalarimiz mijozlarga yaqin-atrofdagi eng yaxshi joylarni topishga yordam beradi. Biznesingiz o'sha yerda ko'rinsin.",
      ios: "App Store",
      android: "Google Play",
      soon: "Tez kunda do'konlarda"
    },
    adminBand: {
      kicker: "Platforma nazorati",
      title: "Adminlar uchun boshqaruv markazi",
      text: "Claim navbati, kontent moderatsiyasi, kategoriyalar va butun ma'lumotlar bazasi — hammasi bitta konsolda.",
      cta: "Admin konsoli"
    },
    footer: {
      tagline: "O'zbekiston biznes platformasi",
      product: "Mahsulot",
      forOwners: "Biznes egalari uchun",
      pricing: "Narxlar",
      dashboard: "Kabinet",
      platform: "Platforma",
      admin: "Admin konsoli",
      status: "API holati",
      apps: "Mobil ilovalar",
      rights: "Barcha huquqlar himoyalangan.",
      otherCities: "Boshqa shaharlar",
      contact: "Bog'lanish",
      telegram: "Telegram bot"
    },
    dashboard: {
      title: "Biznes kabineti",
      welcome: "Xush kelibsiz",
      signInPrompt: "Kabinetga kirish uchun tizimga kiring",
      signInText: "Biznes ma'lumotlaringiz va sharhlarni boshqarish uchun hisobingizga kiring.",
      yourBusinesses: "Sizning bizneslaringiz",
      noBusinesses: "Hali tasdiqlangan biznesingiz yo'q",
      noBusinessesText:
        "Biznesingiz Manzil bazasida bo'lsa, uni tasdiqlang. Admin ko'rib chiqqach, kabinet ochiladi.",
      claimCta: "Biznesni tasdiqlash",
      recentReviews: "So'nggi sharhlar",
      noReviews: "Hozircha sharhlar yo'q.",
      reply: "Javob berish",
      replyPlaceholder: "Mijozga rasmiy javobingiz...",
      replySubmit: "Javobni yuborish",
      replied: "Egasining javobi",
      status: "Holat",
      rating: "Reyting",
      reviewsCount: "sharh"
    }
  },
  ru: {
    nav: {
      home: "Главная",
      pricing: "Тарифы",
      forBusiness: "Для бизнеса",
      discover: "Найти",
      concierge: "Каталог",
      events: "События",
      dashboard: "Кабинет",
      admin: "Админ",
      getApp: "Скачать приложение",
      signIn: "Войти"
    },
    hero: {
      badge: "Бизнес-платформа Manzil",
      title1: "Управляйте бизнесом",
      title2: "на платформе Manzil",
      subtitle:
        "Тысячи клиентов в Ташкенте находят ваш бизнес в приложении Manzil. Подтвердите листинг, отвечайте на отзывы и управляйте репутацией из одного кабинета.",
      ctaPrimary: "Подтвердить бизнес",
      ctaSecondary: "Войти в кабинет",
      trustLine: "Начните бесплатно — банковская карта не нужна"
    },
    stats: {
      title: "Платформа в цифрах",
      businesses: "Бизнесов в базе",
      reviews: "Настоящих отзывов",
      views: "Просмотров в месяц",
      cities: "Городов"
    },
    features: {
      kicker: "Почему Manzil",
      title: "Полный контроль для владельцев",
      items: [
        { title: "Подтвердите листинг", text: "Докажите владение и управляйте данными сами." },
        { title: "Ответы на отзывы", text: "Отвечайте каждому клиенту как официальный владелец." },
        { title: "Живая статистика", text: "Просмотры, сохранения и динамика рейтинга." },
        { title: "Значок Verified", text: "Подтверждённый статус повышает доверие клиентов." },
        { title: "Фотогалерея", text: "Оживите профиль профессиональными фото." },
        { title: "Часы и контакты", text: "Обновляйте адрес, телефон и часы работы." },
        { title: "Защита модерацией", text: "Спам и фейковые отзывы контролирует команда админов." },
        { title: "Премиум-возможности", text: "Скоро: рекламные места и расширенная аналитика." }
      ]
    },
    how: {
      kicker: "Как это работает",
      title: "Начните за 3 шага",
      steps: [
        { title: "Зарегистрируйтесь", text: "Безопасный вход через Clerk — 1 минута." },
        { title: "Подтвердите бизнес", text: "Найдите листинг и отправьте заявку на владение." },
        { title: "Управляйте и растите", text: "После одобрения админом кабинет открыт полностью." }
      ]
    },
    app: {
      kicker: "Где ваши клиенты?",
      title: "Клиенты — в приложении Manzil",
      subtitle:
        "Наши приложения для iOS и Android помогают клиентам находить лучшие места рядом. Пусть ваш бизнес будет там.",
      ios: "App Store",
      android: "Google Play",
      soon: "Скоро в сторах"
    },
    adminBand: {
      kicker: "Контроль платформы",
      title: "Центр управления для админов",
      text: "Очередь заявок, модерация контента, категории и вся база данных — в одной консоли.",
      cta: "Админ-консоль"
    },
    footer: {
      tagline: "Бизнес-платформа Узбекистана",
      product: "Продукт",
      forOwners: "Владельцам бизнеса",
      pricing: "Тарифы",
      dashboard: "Кабинет",
      platform: "Платформа",
      admin: "Админ-консоль",
      status: "Статус API",
      apps: "Мобильные приложения",
      rights: "Все права защищены.",
      otherCities: "Другие города",
      contact: "Связаться",
      telegram: "Telegram-бот"
    },
    dashboard: {
      title: "Бизнес-кабинет",
      welcome: "Добро пожаловать",
      signInPrompt: "Войдите, чтобы открыть кабинет",
      signInText: "Авторизуйтесь, чтобы управлять данными бизнеса и отзывами.",
      yourBusinesses: "Ваши бизнесы",
      noBusinesses: "У вас пока нет подтверждённого бизнеса",
      noBusinessesText:
        "Если ваш бизнес есть в базе Manzil — подтвердите владение. После проверки админом кабинет откроется.",
      claimCta: "Подтвердить бизнес",
      recentReviews: "Последние отзывы",
      noReviews: "Отзывов пока нет.",
      reply: "Ответить",
      replyPlaceholder: "Ваш официальный ответ клиенту...",
      replySubmit: "Отправить ответ",
      replied: "Ответ владельца",
      status: "Статус",
      rating: "Рейтинг",
      reviewsCount: "отзывов"
    }
  },
  en: {
    nav: {
      home: "Home",
      pricing: "Pricing",
      forBusiness: "For business",
      discover: "Discover",
      concierge: "Catalogue",
      events: "Events",
      dashboard: "Dashboard",
      admin: "Admin",
      getApp: "Get the app",
      signIn: "Sign in"
    },
    hero: {
      badge: "Manzil Business Platform",
      title1: "Run your business",
      title2: "on Manzil",
      subtitle:
        "Thousands of customers in Tashkent discover your business in the Manzil app. Claim your listing, respond to reviews, and manage your reputation from one dashboard.",
      ctaPrimary: "Claim your business",
      ctaSecondary: "Open dashboard",
      trustLine: "Start free — no credit card required"
    },
    stats: {
      title: "The platform in numbers",
      businesses: "Businesses listed",
      reviews: "Real reviews",
      views: "Monthly views",
      cities: "Cities"
    },
    features: {
      kicker: "Why Manzil",
      title: "Full control for business owners",
      items: [
        { title: "Claim your listing", text: "Verify ownership and manage your data yourself." },
        { title: "Reply to reviews", text: "Answer every customer as the official owner." },
        { title: "Live analytics", text: "Track views, saves, and rating dynamics." },
        { title: "Verified badge", text: "Verified status builds customer trust." },
        { title: "Photo gallery", text: "Bring your profile to life with professional photos." },
        { title: "Hours & contacts", text: "Keep address, phone, and hours up to date." },
        { title: "Moderation shield", text: "Spam and fake reviews are policed by the admin team." },
        { title: "Premium features", text: "Coming soon: promoted placement and deeper analytics." }
      ]
    },
    how: {
      kicker: "How it works",
      title: "Get started in 3 steps",
      steps: [
        { title: "Create an account", text: "Secure sign-in with Clerk — takes a minute." },
        { title: "Claim your business", text: "Find your listing and submit an ownership request." },
        { title: "Manage and grow", text: "Once an admin approves, your dashboard unlocks." }
      ]
    },
    app: {
      kicker: "Where are your customers?",
      title: "Customers live in the Manzil app",
      subtitle:
        "Our iOS and Android apps help customers find the best places nearby. Make sure your business is there.",
      ios: "App Store",
      android: "Google Play",
      soon: "Coming soon to the stores"
    },
    adminBand: {
      kicker: "Platform control",
      title: "A command center for admins",
      text: "Claim queue, content moderation, categories, and the entire database — in one console.",
      cta: "Admin console"
    },
    footer: {
      tagline: "Uzbekistan's business platform",
      product: "Product",
      forOwners: "For business owners",
      pricing: "Pricing",
      dashboard: "Dashboard",
      platform: "Platform",
      admin: "Admin console",
      status: "API status",
      apps: "Mobile apps",
      rights: "All rights reserved.",
      otherCities: "Other cities",
      contact: "Contact",
      telegram: "Telegram bot"
    },
    dashboard: {
      title: "Business dashboard",
      welcome: "Welcome",
      signInPrompt: "Sign in to open your dashboard",
      signInText: "Log in to manage your business data and reviews.",
      yourBusinesses: "Your businesses",
      noBusinesses: "No verified business yet",
      noBusinessesText:
        "If your business is in the Manzil database, claim it. Your dashboard unlocks after admin review.",
      claimCta: "Claim your business",
      recentReviews: "Recent reviews",
      noReviews: "No reviews yet.",
      reply: "Reply",
      replyPlaceholder: "Your official response to the customer...",
      replySubmit: "Send reply",
      replied: "Owner's reply",
      status: "Status",
      rating: "Rating",
      reviewsCount: "reviews"
    }
  }
};

export type BusinessCopy = (typeof copy)["uz"];

export function getBusinessCopy(locale: Locale): BusinessCopy {
  return copy[locale] ?? copy.uz;
}
