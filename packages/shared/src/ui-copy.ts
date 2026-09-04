import type { Locale } from "./locales";
import { localize, type LocalizedText } from "./locales";

const L = (uz: string, ru: string, en: string): LocalizedText => ({ uz, ru, en });

export function getUiCopy(locale: Locale) {
  return {
    brand: {
      tagline: localize(L("O'zbekistondagi mahalliy hayot platformasi", "Платформа локальной жизни Узбекистана", "Uzbekistan local lifestyle platform"), locale),
      city: localize(L("Toshkent", "Ташкент", "Tashkent"), locale)
    },
    nav: {
      feed: localize(L("Feed", "Лента", "Feed"), locale),
      discover: localize(L("Kashfiyot", "Поиск", "Discover"), locale),
      concierge: localize(L("Concierge", "Concierge", "Concierge"), locale),
      lists: localize(L("Ro'yxatlar", "Списки", "Lists"), locale),
      profile: localize(L("Profil", "Профиль", "Profile"), locale),
      business: localize(L("Biznes", "Бизнес", "Business"), locale),
      search: localize(L("Izlash", "Поиск", "Search"), locale),
      signIn: localize(L("Kirish", "Войти", "Sign in"), locale)
    },
    home: {
      kicker: localize(L("Manzil · Toshkent", "Manzil · Ташкент", "Manzil · Tashkent"), locale),
      title: localize(L("Bugun nima qilamiz?", "Что делаем сегодня?", "What are we doing today?"), locale),
      subtitle: localize(
        L(
          "Trendlar, do'stlar tavsiyasi, voqealar va AI badge'lar — bitta lifestyle feed.",
          "Тренды, рекомендации друзей, поводы и AI-бейджи — в одной ленте.",
          "Trends, friend picks, occasions, and AI badges — one lifestyle feed."
        ),
        locale
      ),
      statsViews: localize(L("Bugungi ko'rishlar", "Просмотры сегодня", "Views today"), locale),
      statsBookmarks: localize(L("Bookmarklar", "Закладки", "Bookmarks"), locale),
      statsFriends: localize(L("Do'st faolligi", "Активность друзей", "Friend activity"), locale),
      communityKicker: localize(L("Jamiyat", "Сообщество", "Community"), locale),
      communityTitle: localize(L("Do'stlaringiz nima qilyapti", "Что делают ваши друзья", "What your friends are up to"), locale),
      listsKicker: localize(L("Ro'yxatlar", "Списки", "Lists"), locale),
      listsTitle: localize(L("Jamiyat tomonidan tanlangan", "Выбор сообщества", "Curated by the community"), locale),
      allLists: localize(L("Barcha ro'yxatlar", "Все списки", "All lists"), locale),
      businessKicker: localize(L("Biznes egalari", "Для бизнеса", "Business owners"), locale),
      businessTitle: localize(L("Listingni bepul oling. Pro va Max keyin.", "Бесплатный профиль. Pro и Max позже.", "Claim your listing free. Pro and Max later."), locale),
      businessBody: localize(
        L("Free bepul. Analytics, menyu va AI javoblar Pro rejada.", "Free бесплатно. Аналитика, меню и AI-ответы в Pro.", "Free is free. Analytics, menu, and AI replies are in Pro."),
        locale
      ),
      businessCta: localize(L("Biznes rejalarini ko'rish", "Тарифы для бизнеса", "View business plans"), locale)
    },
    search: {
      kicker: localize(L("Kashfiyot", "Поиск", "Discover"), locale),
      title: localize(L("Joylarni qidiring", "Найдите места", "Search places"), locale),
      subtitle: localize(
        L("Restoran, qahva, xizmat yoki tuman nomi bo'yicha qidiring.", "Ищите по ресторанам, кафе, услугам или району.", "Search by restaurant, café, service, or district."),
        locale
      ),
      queryLabel: localize(L("Qidiruv", "Поиск", "Search"), locale),
      queryPlaceholder: localize(L("Masalan: osh yoki Yunusobod", "Например: плов или Юнусабад", "e.g. plov or Yunusobod"), locale),
      categoryLabel: localize(L("Kategoriya", "Категория", "Category"), locale),
      allCategories: localize(L("Hammasi", "Все", "All"), locale),
      filter: localize(L("Filtrlash", "Фильтр", "Filter"), locale),
      results: (count: number) =>
        localize(L(`${count} ta natija`, `${count} результатов`, `${count} results`), locale),
      listView: localize(L("Ro'yxat", "Список", "List"), locale),
      mapView: localize(L("Xarita", "Карта", "Map"), locale),
      emptyTitle: localize(L("Natija topilmadi", "Ничего не найдено", "No results found"), locale),
      emptyBody: localize(L("Boshqa qidiruv so'zi yoki kategoriya tanlang.", "Попробуйте другой запрос или категорию.", "Try another query or category."), locale),
      whatLabel: localize(L("Nima qidiryapsiz?", "Что ищете?", "What are you looking for?"), locale),
      whatPlaceholder: localize(L("Masalan: osh, qahva, go'zallik", "Например: плов, кофе, красота", "e.g. plov, coffee, beauty"), locale),
      whereLabel: localize(L("Hudud", "Район", "Area"), locale),
      submit: localize(L("Natijalarni ko'rish", "Показать результаты", "Show results"), locale)
    },
    occasions: {
      kicker: localize(L("Voqealar", "Поводы", "Occasions"), locale),
      title: localize(L("Nima uchun ochyapsiz?", "Какой повод?", "What's the occasion?"), locale),
      all: localize(L("Hammasi", "Все", "All"), locale),
      pageTitle: localize(L("Qaysi voqea uchun qidiryapsiz?", "Какой повод вы ищете?", "Which occasion are you planning?"), locale),
      // Trust audit (Epic 00): this line used to end with "Hozir mock rejimda"
      // / "Сейчас mock-режим" — an internal engineering state printed to
      // visitors on a public page. The limitation it was trying to convey is
      // real and worth stating; "mock mode" is not the way to state it.
      pageBody: localize(
        L(
          "Har bir voqea uchun katalogdagi haqiqiy joylar. To'liq paketlar tavsiyasi hali tayyor emas.",
          "Для каждого повода — реальные места из каталога. Подбор полных пакетов пока не готов.",
          "Real listed places for each occasion. Full package recommendations are not ready yet."
        ),
        locale
      ),
      packageKicker: localize(L("Voqea paketi", "Пакет повода", "Occasion package"), locale),
      recommended: localize(L("Tavsiya etilgan joylar", "Рекомендуемые места", "Recommended places"), locale),
      view: localize(L("Ko'rish", "Смотреть", "View"), locale)
    },
    lists: {
      kicker: localize(L("Jamiyat ro'yxatlari", "Списки сообщества", "Community lists"), locale),
      title: localize(L("Odamlar tomonidan yig'ilgan eng yaxshi joylar", "Лучшие места от людей", "Best places curated by people"), locale),
      body: localize(
        L("Ro'yxatlarni kuzatish va o'zingiznikini yaratish keyingi bosqichda.", "Подписка и создание списков — в следующей фазе.", "Follow and create lists coming in the next phase."),
        locale
      ),
      followers: localize(L("kuzatuvchi", "подписчиков", "followers"), locale)
    },
    profile: {
      reviews: localize(L("sharh", "отзывов", "reviews"), locale),
      saved: localize(L("saqlangan", "сохранено", "saved"), locale),
      photos: localize(L("rasm", "фото", "photos"), locale),
      followers: localize(L("kuzatuvchi", "подписчиков", "followers"), locale),
      following: localize(L("kuzatilmoqda", "подписок", "following"), locale),
      achievementsKicker: localize(L("Yutuqlar", "Достижения", "Achievements"), locale),
      achievementsTitle: localize(L("Food Explorer va undan keyingi badge'lar", "Food Explorer и следующие бейджи", "Food Explorer and beyond"), locale),
      savedKicker: localize(L("Saqlangan joylar", "Сохранённые места", "Saved places"), locale),
      savedTitle: localize(L("Keyinroq qaytish uchun", "Для возврата позже", "For coming back later"), locale),
      savedEmptyTitle: localize(L("Hali saqlangan joylar yo'q", "Пока нет сохранённых мест", "No saved places yet"), locale),
      savedEmptyBody: localize(L("Feed yoki discover bo'limidan ☆ tugmasini bosing.", "Нажмите ☆ в ленте или поиске.", "Tap ☆ in the feed or discover section."), locale),
      followingKicker: localize(L("Kuzatilayotgan odamlar", "Подписки", "Following"), locale),
      followingTitle: localize(L("Social discovery", "Социальное открытие", "Social discovery"), locale),
      activityKicker: localize(L("Faollik", "Активность", "Activity"), locale),
      activityTitle: localize(L("Jamiyatdan so'nggi yangiliklar", "Последнее от сообщества", "Latest from the community"), locale),
      earned: localize(L("Olingan", "Получено", "Earned"), locale),
      locked: localize(L("Qulflangan", "Заблокировано", "Locked"), locale)
    },
    concierge: {
      kicker: localize(L("AI Concierge", "AI Concierge", "AI Concierge"), locale),
      title: localize(L("Tabiiy tilda so'rang", "Спросите естественно", "Ask naturally"), locale),
      subtitle: localize(
        L(
          "\"5 soat ishlaydigan sokin kafe\" yoki \"4 kishi uchun 300,000 so'm\" deb so'rang — Gurman AI Manzil katalogidan mos joy taklif qiladi.",
          "Спросите, например, «тихое кафе на 5 часов» или «300 000 сум на 4 человека» — Gurman AI подберёт места из каталога Manzil.",
          "Ask things like \"quiet café for 5 hours\" or \"300,000 UZS for 4 people\" — Gurman AI will suggest real places from Manzil's catalog."
        ),
        locale
      ),
      welcome: localize(
        L(
          "Salom! Men Manzil AI Concierge. Budget, muhit yoki voqea ayting — joy tavsiya qilaman.",
          "Привет! Я Manzil AI Concierge. Назовите бюджет, атмосферу или повод — подберу место.",
          "Hi! I'm Manzil AI Concierge. Tell me your budget, vibe, or occasion and I'll suggest places."
        ),
        locale
      ),
      placeholder: localize(
        L("Masalan: ish uchun sokin kafe", "Например: тихое кафе для работы", "e.g. quiet café for work"),
        locale
      ),
      send: localize(L("Yuborish", "Отправить", "Send"), locale),
      thinking: localize(L("O'ylayapman...", "Думаю...", "Thinking..."), locale),
      unavailable: localize(
        L(
          "Gurman AI hozircha javob bera olmayapti. Birozdan so'ng qayta urinib ko'ring.",
          "Gurman AI сейчас не может ответить. Попробуйте ещё раз чуть позже.",
          "Gurman AI can't answer right now. Please try again in a little while."
        ),
        locale
      ),
      assistantName: localize(L("Manzil Concierge", "Manzil Concierge", "Manzil Concierge"), locale),
      statusReady: localize(
        L("Savolingizga tayyor", "Готов к вашему вопросу", "Ready for your question"),
        locale
      ),
      panelTitle: localize(
        L("Gurman AI nima qila oladi", "Что умеет Gurman AI", "What Gurman AI can do"),
        locale
      ),
      panelRealTitle: localize(L("Faqat haqiqiy joylar", "Только реальные места", "Only real places"), locale),
      panelRealBody: localize(
        L(
          "Har bir tavsiya Manzil katalogidagi mavjud biznesga havola bo'ladi.",
          "Каждая рекомендация — ссылка на реальный бизнес из каталога Manzil.",
          "Every suggestion links to a real business in Manzil's catalog."
        ),
        locale
      ),
      panelReviewsTitle: localize(
        L("Sharhlarga asoslanadi", "Опирается на отзывы", "Grounded in reviews"),
        locale
      ),
      panelReviewsBody: localize(
        L(
          "Gurman AI foydalanuvchilarning haqiqiy sharhlari va reytinglariga tayanadi.",
          "Gurman AI опирается на настоящие отзывы и рейтинги пользователей.",
          "Gurman AI draws on real user reviews and ratings."
        ),
        locale
      ),
      panelLangTitle: localize(
        L("Uch tilda ishlaydi", "Работает на трёх языках", "Works in three languages"),
        locale
      ),
      panelLangBody: localize(
        L(
          "O'zbek, rus yoki ingliz tilida yozing — javob shu tilda qaytadi.",
          "Пишите на узбекском, русском или английском — ответ придёт на том же языке.",
          "Write in Uzbek, Russian, or English — the answer comes back in the same language."
        ),
        locale
      ),
      panelNote: localize(
        L(
          "Gurman hozircha tayyor paketlar tuzmaydi va bron qilmaydi. U joy tavsiya qiladi — tanlov sizniki.",
          "Gurman пока не составляет готовые пакеты и не бронирует. Он советует места — выбор за вами.",
          "Gurman doesn't assemble ready-made packages or make bookings yet. It recommends places — the choice is yours."
        ),
        locale
      )
    },
    pricing: {
      kicker: localize(L("Biznes egalari", "Для бизнеса", "Business owners"), locale),
      title: localize(L("Free, Pro, Max", "Free, Pro, Max", "Free, Pro, Max"), locale),
      body: localize(
        L("Birinchi daromad manbai — biznes obunalari. Hozir marketing sahifasi, keyin to'lov.", "Первый доход — подписки для бизнеса. Сейчас маркетинг, оплата позже.", "First revenue — business subscriptions. Marketing page now, payments later."),
        locale
      ),
      freeStart: localize(L("Bepul boshlash", "Начать бесплатно", "Start free"), locale),
      comingSoon: localize(L("Tez orada", "Скоро", "Coming soon"), locale)
    },
    business: {
      profileKicker: localize(L("Biznes profili", "Профиль бизнеса", "Business profile"), locale),
      reviews: localize(L("ta sharh", "отзывов", "reviews"), locale),
      verified: localize(L("Tasdiqlangan", "Подтверждён", "Verified"), locale),
      unclaimed: localize(L("Claim qilinmagan", "Не заявлен", "Unclaimed"), locale),
      aiSummaryKicker: localize(L("AI xulosa", "AI-резюме", "AI summary"), locale),
      qualityKicker: localize(L("Quality Score", "Quality Score", "Quality Score"), locale),
      qualityNote: localize(L("Reytingdan chuqurroq baholash", "Глубже, чем звёзды", "Deeper than star ratings"), locale),
      reviewsKicker: localize(L("Sharhlar", "Отзывы", "Reviews"), locale),
      reviewsTitle: localize(L("Foydalanuvchilar fikri", "Мнение пользователей", "What users say"), locale),
      writeKicker: localize(L("Sharh yozish", "Написать отзыв", "Write a review"), locale),
      writeTitle: localize(L("Tajriba bilan bo'lishing", "Поделитесь опытом", "Share your experience"), locale),
      writeBody: localize(L("Sharh yozish uchun tizimga kiring. Har bir biznesga bitta sharh qoldirish mumkin.", "Войдите, чтобы оставить отзыв. Один отзыв на каждый бизнес.", "Sign in to leave a review. One review per business."), locale),
      writeSignIn: localize(L("Sharh yozish uchun avval tizimga kiring.", "Сначала войдите, чтобы оставить отзыв.", "Sign in first to leave a review."), locale),
      writeWait: localize(L("Bir soniya kuting…", "Секунду…", "One moment…"), locale),
      // Was "Claim flow" in Uzbek — an internal flow name, rendered uppercase
      // as a section label on a public page. Every locale now names the thing
      // the visitor is being offered, not the engineering step.
      claimKicker: localize(L("Egalik so'rovi", "Заявка", "Claim"), locale),
      claimTitle: localize(L("Bu sizning biznesingizmi?", "Это ваш бизнес?", "Is this your business?"), locale),
      claimBody: localize(
        L("Profilga egalik huquqini oling, rasmlar va ish vaqtini yangilang, sharhlarga javob bering.", "Заявите профиль, обновите фото и часы, отвечайте на отзывы.", "Claim the profile, update photos and hours, reply to reviews."),
        locale
      ),
      friendsVisited: localize(L("do'st tashrif buyurgan", "друзей посетили", "friends visited"), locale),
      bookmarks: localize(L("bookmark", "закладок", "bookmarks"), locale),
      ordersToday: localize(L("buyurtma bugun", "заказов сегодня", "orders today"), locale),
      viewsPerMonth: localize(L("ko'rish / oy", "просмотров / мес", "views / month"), locale),
      bookmarksToday: localize(L("bookmark bugun", "закладок сегодня", "bookmarks today"), locale),
      trending: localize(L("trendda", "в тренде", "trending"), locale),
      addressLabel: localize(L("Manzil", "Адрес", "Address"), locale),
      phoneLabel: localize(L("Telefon", "Телефон", "Phone"), locale),
      hoursLabel: localize(L("Ish vaqti", "Часы работы", "Hours"), locale),
      experienceFeed: localize(L("Tajriba lentasi", "Лента впечатлений", "Experience Feed"), locale),
      photoCount: (count: number) =>
        localize(
          L(`${count} ta rasm`, `${count} фото`, count === 1 ? "1 photo" : `${count} photos`),
          locale
        ),
      askGurman: localize(
        L("Gurman mobil navbatiga qo'shiling", "Вступить в лист ожидания Gurman", "Join the Gurman mobile waitlist"),
        locale
      ),
      share: localize(L("Ulashish", "Поделиться", "Share"), locale),
      shareCopied: localize(L("Havola nusxalandi", "Ссылка скопирована", "Link copied"), locale),
      getDirections: localize(L("Yo'nalish olish", "Проложить маршрут", "Get directions"), locale),
      infoTitle: localize(L("Biznes ma'lumotlari", "Информация о бизнесе", "Business info"), locale),
      highlightsTitle: localize(L("Imkoniyatlar", "Особенности", "Highlights"), locale),
      qualityMetrics: {
        reviewQuality: localize(L("Sharh sifati", "Качество отзывов", "Review quality"), locale),
        freshness: localize(L("Yangiligi", "Актуальность", "Freshness"), locale),
        popularity: localize(L("Mashhurlik", "Популярность", "Popularity"), locale),
        returnVisitors: localize(L("Qaytish", "Возвраты", "Return visits"), locale),
        responseSpeed: localize(L("Javob tezligi", "Скорость ответа", "Response speed"), locale),
        photoQuality: localize(L("Rasm sifati", "Качество фото", "Photo quality"), locale)
      }
    },
    actions: {
      follow: localize(L("Kuzatish", "Подписаться", "Follow"), locale),
      following: localize(L("Kuzatilmoqda", "Подписаны", "Following"), locale),
      followList: localize(L("Kuzatish", "Подписаться", "Follow"), locale),
      followingList: localize(L("Saqlangan ro'yxat", "Список сохранён", "Saved list"), locale),
      save: localize(L("Saqlash", "Сохранить", "Save"), locale),
      saved: localize(L("Saqlangan", "Сохранено", "Saved"), locale)
    },
    footer: {
      discover: localize(L("Kashfiyot", "Поиск", "Discover"), locale),
      business: localize(L("Biznes tariflari", "Тарифы", "Business plans"), locale),
      profile: localize(L("Profil", "Профиль", "Profile"), locale),
      concierge: localize(L("Concierge", "Concierge", "Concierge"), locale)
    },
    reviewsList: {
      emptyTitle: localize(L("Hali sharh yo'q", "Пока нет отзывов", "No reviews yet"), locale),
      emptyBody: localize(
        L("Bu listing uchun birinchi foydali sharhni qoldiring.", "Оставьте первый полезный отзыв.", "Be the first to leave a helpful review."),
        locale
      ),
      businessReply: localize(L("Biznes javobi", "Ответ бизнеса", "Business reply"), locale),
      helpful: localize(L("foydali", "полезно", "helpful"), locale),
      verifiedVisit: localize(L("Tasdiqlangan tashrif", "Подтверждённый визит", "Verified visit"), locale)
    },
    mobile: {
      homeTitle: localize(L("Bugun nima qilamiz?", "Что делаем сегодня?", "What are we doing today?"), locale),
      homeSubtitle: localize(
        L("Trendlar, do'stlar va voqealar — bitta lifestyle feed.", "Тренды, друзья и поводы — одна лента.", "Trends, friends, and occasions — one feed."),
        locale
      ),
      friendActivity: localize(L("Do'stlar faolligi", "Активность друзей", "Friend activity"), locale),
      continueDiscover: localize(L("Kashfiyotni davom ettirish", "Продолжить поиск", "Continue discovering"), locale),
      searchTitle: localize(L("Kashfiyot", "Поиск", "Discover"), locale),
      searchPlaceholder: localize(L("Joy qidiring...", "Искать места...", "Search places..."), locale),
      loading: localize(L("Yuklanmoqda...", "Загрузка...", "Loading..."), locale),
      achievements: localize(L("Yutuqlar", "Достижения", "Achievements"), locale),
      savedPlaces: localize(L("Saqlangan joylar", "Сохранённые места", "Saved places"), locale),
      followingPeople: localize(L("Kuzatilayotgan odamlar", "Подписки", "Following"), locale)
    }
  };
}

export type UiCopy = ReturnType<typeof getUiCopy>;
