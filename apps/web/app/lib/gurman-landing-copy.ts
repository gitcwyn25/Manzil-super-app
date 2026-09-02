import type { Locale } from "@manzil/shared";
import type { GurmanHeroCopy } from "../components/gurman-hero";

export type GurmanLandingStep = {
  number: string;
  title: string;
  body: string;
};

export type GurmanLandingCard = {
  eyebrow: string;
  title: string;
  body: string;
};

export type GurmanLandingCopy = {
  hero: GurmanHeroCopy;
  intro: {
    eyebrow: string;
    title: string;
    body: string;
    steps: GurmanLandingStep[];
  };
  trust: {
    eyebrow: string;
    title: string;
    body: string;
    cards: GurmanLandingCard[];
  };
  example: {
    eyebrow: string;
    title: string;
    body: string;
    requestLabel: string;
    request: string;
    resultLabel: string;
    result: string;
    reasonLabel: string;
    reason: string;
    note: string;
  };
  capability: {
    eyebrow: string;
    title: string;
    body: string;
    liveLabel: string;
    live: string[];
    roadmapLabel: string;
    roadmap: string[];
  };
  cta: {
    eyebrow: string;
    title: string;
    body: string;
    button: string;
  };
};

const COPY: Record<Locale, GurmanLandingCopy> = {
  uz: {
    hero: {
      badge: "Gurman AI · Ishonchli tavsiyalar",
      titleLine1: "Shahardagi keyingi",
      titleLine2: "rejangizni toping.",
      subtitle:
        "Nima qilmoqchi ekaningizni ayting — Gurman Manzil katalogidagi haqiqiy joylarni siz uchun saralaydi va nima uchun mosligini tushuntiradi.",
      inputLabel: "Rejangizni yozing",
      inputPlaceholder: "Masalan: 4 kishiga sokin kafe, 300 000 so'mgacha",
      cta: "Gurman bilan boshlash",
      ctaHref: "#gurman-workstation",
      trustReviews: "Haqiqiy sharhlar",
      trustPlaces: "Real katalogdagi joylar",
      waitlistCta: "Kelajakdagi imkoniyatlar",
      bento: {
        brandTitle: "Gurman",
        brandHint: "Shahar hamrohingiz",
        askTitle: "Niyatni ayting",
        askHint: "Oddiy tilda yozing",
        reviewsTitle: "Dalilga tayanadi",
        reviewsHint: "Mavjud ma'lumotlar va sharhlar",
        placesTitle: "Tanlov sizniki",
        placesHint: "Mos joylarni ko'ring"
      }
    },
    intro: {
      eyebrow: "Gurman qanday ishlaydi",
      title: "Qidiruvdan ko'ra ko'proq: qaror qabul qilishga yordam.",
      body:
        "Siz yuzlab kartochkalarni ochib chiqishingiz shart emas. Istagingizni oddiy tilda yozing, Gurman esa Manzil katalogidagi ma'lumotlar asosida mos variantlarni ajratib beradi.",
      steps: [
        { number: "01", title: "Niyatni ayting", body: "Kategoriya emas, nima qilmoqchi ekaningizni yozing: uchrashuv, oilaviy kechki ovqat yoki ish uchun sokin joy." },
        { number: "02", title: "Haqiqiy ma'lumotlar tekshiriladi", body: "Gurman Manzil katalogidagi mavjud bizneslar va tasdiqlangan sharhlarga tayanadi." },
        { number: "03", title: "Mos joylar ajratiladi", body: "So'rovingizga mos keladigan joylar tanlanadi — nom va havola katalogdagi real yozuvdan olinadi." },
        { number: "04", title: "Sababi ko'rsatiladi", body: "Har bir tavsiya nima uchun mos kelganini qisqa va tushunarli sabab bilan ko'rsatadi." }
      ]
    },
    trust: {
      eyebrow: "Ishonch birinchi o'rinda",
      title: "Gurman bilmagan narsasini o'ylab topmaydi.",
      body:
        "Manzilning AI yondashuvi chiroyli javobdan oldin ishonchni qo'yadi. Tavsiya real biznesga bog'lanadi, yo'q ma'lumot esa mavjuddek ko'rsatilmaydi.",
      cards: [
        { eyebrow: "Real yozuvlar", title: "Tavsiya katalogdan boshlanadi", body: "Gurman faqat Manzil katalogida mavjud va ommaga ko'rinadigan bizneslarni tavsiya qilish uchun ishlaydi." },
        { eyebrow: "Tushunarli sabab", title: "Har bir tanlovni tekshiring", body: "Tavsiya kartasida joyning so'rovingizga nima sababdan mos kelgani ko'rsatiladi." },
        { eyebrow: "Siz nazorat qilasiz", title: "Tanlov sizniki bo'lib qoladi", body: "Gurman variantlarni qisqartiradi va tushuntiradi. Yakuniy tanlov, bog'lanish yoki tashrif sizning qo'lingizda." }
      ]
    },
    example: {
      eyebrow: "Misol tariqasida",
      title: "Gurman javobni qanday tushuntiradi",
      body: "Bu statik misol Gurman tavsiyasining shaklini ko'rsatadi. Haqiqiy natijalar katalogdagi mavjud ma'lumotlarga bog'liq.",
      requestLabel: "Sizning so'rovingiz",
      request: "4 kishiga sokin kafe, suhbatlashish uchun qulay, 300 000 so'mgacha",
      resultLabel: "Gurman javobi",
      result: "Sizning guruhingiz va byudjetingiz uchun sokin muhitdagi joylarni ajratdim.",
      reasonLabel: "Nega tavsiya qilindi?",
      reason: "Sokin muhit va kichik guruh uchun mos tavsif",
      note: "Misol · real natija katalogdagi joriy ma'lumotlarga qarab o'zgaradi"
    },
    capability: {
      eyebrow: "Bugun va keyin",
      title: "Hozirgi imkoniyatlar aniq. Kelajak ham shaffof.",
      body: "Gurman bosqichma-bosqich rivojlanadi. Biz ishlayotgan imkoniyatlarni mavjud funksiyalardan alohida ko'rsatamiz.",
      liveLabel: "Hozir mavjud",
      live: ["Tabiiy tildagi so'rovlar", "Manzil katalogidagi real joylar", "Tavsiya uchun qisqa sabab", "O'zbek, rus va ingliz tillari", "Joy profilini ko'rish va saqlash"],
      roadmapLabel: "Yo'lda",
      roadmap: ["Tayyor voqea paketlari", "Bronlarni muvofiqlashtirish", "Birgalikda rejalashtirish", "Saqlanadigan afzalliklar va xotira"]
    },
    cta: {
      eyebrow: "Sinab ko'ring",
      title: "Keyingi rejangizni Gurmanga ayting.",
      body: "Oddiy so'zlar bilan yozing. Gurman sizni haqiqiy joylar va aniqroq tanlovlarga olib boradi.",
      button: "Ish maydoniga o'tish"
    }
  },
  ru: {
    hero: {
      badge: "Gurman AI · Доверительные рекомендации",
      titleLine1: "Найдите свой следующий",
      titleLine2: "план в городе.",
      subtitle:
        "Расскажите, что хотите сделать — Gurman подберёт реальные места из каталога Manzil и объяснит, почему они подходят.",
      inputLabel: "Опишите свой план",
      inputPlaceholder: "Например: тихое кафе для 4 человек до 300 000 сум",
      cta: "Начать с Gurman",
      ctaHref: "#gurman-workstation",
      trustReviews: "Настоящие отзывы",
      trustPlaces: "Реальные места из каталога",
      waitlistCta: "Возможности в будущем",
      bento: {
        brandTitle: "Gurman",
        brandHint: "Ваш городской помощник",
        askTitle: "Опишите задачу",
        askHint: "Пишите своими словами",
        reviewsTitle: "Основан на фактах",
        reviewsHint: "Доступные данные и отзывы",
        placesTitle: "Вы решаете",
        placesHint: "Смотрите подходящие места"
      }
    },
    intro: {
      eyebrow: "Как работает Gurman",
      title: "Не просто поиск: помощь в выборе.",
      body:
        "Вам не нужно открывать сотни карточек. Опишите желание обычными словами, а Gurman выделит подходящие варианты на основе каталога Manzil.",
      steps: [
        { number: "01", title: "Опишите намерение", body: "Напишите, что хотите сделать: свидание, семейный ужин или тихое место для работы." },
        { number: "02", title: "Проверяются реальные данные", body: "Gurman опирается на доступные бизнесы каталога Manzil и одобренные отзывы." },
        { number: "03", title: "Выделяются подходящие места", body: "Названия и ссылки берутся из существующих записей каталога, а не придумываются моделью." },
        { number: "04", title: "Причина остаётся видимой", body: "Каждая рекомендация сопровождается коротким объяснением, почему она подходит." }
      ]
    },
    trust: {
      eyebrow: "Доверие прежде всего",
      title: "Gurman не придумывает то, чего не знает.",
      body:
        "В Manzil доверие важнее эффектного ответа. Рекомендация привязана к реальному бизнесу, а отсутствующие данные не выдаются за существующие.",
      cards: [
        { eyebrow: "Реальные записи", title: "Рекомендация начинается с каталога", body: "Gurman рекомендует только существующие и публично видимые бизнесы из каталога Manzil." },
        { eyebrow: "Понятная причина", title: "Проверяйте каждый выбор", body: "В карточке видно, почему место подходит под ваш запрос." },
        { eyebrow: "Вы контролируете выбор", title: "Решение остаётся за вами", body: "Gurman сокращает список и объясняет варианты. Вы сами решаете, куда обратиться или пойти." }
      ]
    },
    example: {
      eyebrow: "Пример",
      title: "Как Gurman объясняет ответ",
      body: "Этот статичный пример показывает форму рекомендации. Реальные результаты зависят от актуальных данных каталога.",
      requestLabel: "Ваш запрос",
      request: "Тихое кафе для 4 человек, чтобы поговорить, до 300 000 сум",
      resultLabel: "Ответ Gurman",
      result: "Я выделил места с тихой атмосферой, подходящие вашей компании и бюджету.",
      reasonLabel: "Почему рекомендовано?",
      reason: "Тихая атмосфера и описание подходит для небольшой компании",
      note: "Пример · реальные результаты зависят от текущих данных каталога"
    },
    capability: {
      eyebrow: "Сегодня и дальше",
      title: "Текущие возможности ясны. Будущее — тоже.",
      body: "Gurman развивается постепенно. Мы отделяем доступные функции от тех, которые находятся в работе.",
      liveLabel: "Доступно сейчас",
      live: ["Запросы на естественном языке", "Реальные места из каталога Manzil", "Короткая причина рекомендации", "Узбекский, русский и английский", "Просмотр и сохранение места"],
      roadmapLabel: "В планах",
      roadmap: ["Готовые пакеты для поводов", "Координация бронирований", "Совместное планирование", "Сохранённые предпочтения и память"]
    },
    cta: {
      eyebrow: "Попробуйте",
      title: "Расскажите Gurman о своём следующем плане.",
      body: "Пишите обычными словами. Gurman поможет перейти от запроса к реальным местам и более уверенному выбору.",
      button: "Открыть рабочее пространство"
    }
  },
  en: {
    hero: {
      badge: "Gurman AI · Evidence-led recommendations",
      titleLine1: "Find your next",
      titleLine2: "city plan.",
      subtitle:
        "Tell Gurman what you want to do — it surfaces real places from the Manzil catalogue and explains why they fit.",
      inputLabel: "Describe your plan",
      inputPlaceholder: "For example: a quiet café for 4 people under 300,000 UZS",
      cta: "Start with Gurman",
      ctaHref: "#gurman-workstation",
      trustReviews: "Real reviews",
      trustPlaces: "Real catalogue places",
      waitlistCta: "What comes next",
      bento: {
        brandTitle: "Gurman",
        brandHint: "Your city companion",
        askTitle: "Describe the intent",
        askHint: "Write naturally",
        reviewsTitle: "Evidence-led",
        reviewsHint: "Available data and reviews",
        placesTitle: "You decide",
        placesHint: "See the places that fit"
      }
    },
    intro: {
      eyebrow: "How Gurman works",
      title: "More than search: help making a confident choice.",
      body:
        "You should not have to open hundreds of cards. Describe what you want in natural language, and Gurman will narrow the options using the Manzil catalogue.",
      steps: [
        { number: "01", title: "Describe the intent", body: "Say what you are trying to do: a date, a family dinner, or a quiet place to work." },
        { number: "02", title: "Check real information", body: "Gurman relies on available Manzil businesses and approved reviews." },
        { number: "03", title: "Surface suitable places", body: "Names and links come from existing catalogue records, not from a model inventing identities." },
        { number: "04", title: "Keep the reason visible", body: "Each recommendation includes a short explanation of why it fits your request." }
      ]
    },
    trust: {
      eyebrow: "Trust first",
      title: "Gurman does not make up what it does not know.",
      body:
        "Manzil puts trust before impressive-sounding answers. A recommendation is tied to a real business, and missing information is not presented as fact.",
      cards: [
        { eyebrow: "Real records", title: "Recommendations start in the catalogue", body: "Gurman is designed to recommend only existing, publicly visible businesses from the Manzil catalogue." },
        { eyebrow: "Clear reason", title: "Inspect every choice", body: "The recommendation card shows why a place fits your request." },
        { eyebrow: "You stay in control", title: "The decision remains yours", body: "Gurman narrows and explains the options. You decide whether to contact or visit a place." }
      ]
    },
    example: {
      eyebrow: "Example",
      title: "How Gurman explains an answer",
      body: "This static example shows the shape of a recommendation. Actual results depend on current catalogue data.",
      requestLabel: "Your request",
      request: "A quiet café for 4 people to talk, under 300,000 UZS",
      resultLabel: "Gurman's answer",
      result: "I narrowed this to places with a quieter atmosphere that fit your group and budget.",
      reasonLabel: "Why recommended?",
      reason: "Quiet atmosphere and a description suited to a small group",
      note: "Example · actual results depend on current catalogue data"
    },
    capability: {
      eyebrow: "Today and next",
      title: "What exists now is clear. So is what comes next.",
      body: "Gurman is developing in stages. We separate available capabilities from the ones still being built.",
      liveLabel: "Available now",
      live: ["Natural-language requests", "Real places from the Manzil catalogue", "A short recommendation reason", "Uzbek, Russian, and English", "View and save a place"],
      roadmapLabel: "On the roadmap",
      roadmap: ["Ready-made occasion packages", "Booking coordination", "Collaborative planning", "Saved preferences and memory"]
    },
    cta: {
      eyebrow: "Try it",
      title: "Tell Gurman about your next plan.",
      body: "Write naturally. Gurman helps move you from a request to real places and a more confident choice.",
      button: "Open the workspace"
    }
  }
};

export function getGurmanLandingCopy(locale: Locale): GurmanLandingCopy {
  return COPY[locale];
}
