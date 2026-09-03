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
  intelligence: {
    eyebrow: string;
    title: string;
    body: string;
    layers: Array<{ number: string; title: string; body: string }>;
    pipeline: { label: string; steps: string[] };
    principles: GurmanLandingCard[];
    footer: string;
  };
  memory: {
    eyebrow: string;
    tiersLabel: string;
    title: string;
    body: string;
    philosophy: { label: string; title: string; body: string; items: string[] };
    tiers: Array<{ number: string; title: string; body: string }>;
    diagram: { label: string; layers: string[] };
    async: { label: string; title: string; body: string; cards: GurmanLandingCard[] };
    footer: string;
  };
  collaboration: {
    eyebrow: string;
    title: string;
    body: string;
    mediator: { label: string; title: string; body: string; points: string[] };
    flow: { label: string; steps: string[] };
    cards: GurmanLandingCard[];
    footer: string;
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
      howItWorksCta: "Qanday ishlaydi?",
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
    intelligence: {
      eyebrow: "Gurman Intelligence",
      title: "Bu chatbot emas. Bu Manzilning qaror qabul qilish qatlamidir.",
      body: "Manzil faqat ma'lumot ko'rsatmaydi — u ishonchli tanlovga yordam beradi. Gurman Intelligence bizneslar, xizmatlar, tajribalar va foydalanuvchi kontekstini bir tizimga bog'lab, niyatni real rejaga aylantirish uchun qurilmoqda.",
      layers: [
        { number: "01", title: "Xom marketplace ma'lumotlari", body: "Tekshirilgan bizneslar, xizmatlar, ish vaqti, mavjudlik, sharhlar va takliflar." },
        { number: "02", title: "AI Feature Store", body: "Band vaqtlar, narx barqarorligi va odatiy tashrif vaqti kabi hosila faktlar oldindan hisoblanadi." },
        { number: "03", title: "Knowledge Graph", body: "Biznes → xizmat → tajriba munosabatlarini ishonch, manba va vaqt bilan bog'laydi." },
        { number: "04", title: "Memory Engine", body: "Bugungi missiya kontekstini uzoq muddatli afzalliklardan alohida boshqaradi." },
        { number: "05", title: "Reasoning Engine", body: "Nomzodlarni siyosat, byudjet, vaqt, masofa va marshrut bo'yicha deterministik baholaydi." },
        { number: "06", title: "Conversational layer", body: "Qarorni o'zbek, rus yoki ingliz tilida, Gurman ovozida sodda tushuntiradi." }
      ],
      pipeline: {
        label: "Qaror qanday hosil bo'ladi",
        steps: ["So'rov", "Niyat", "Gibrid retrieval", "Reasoning", "Qaror", "Tool orchestrator", "LLM taqdimoti", "Javob"]
      },
      principles: [
        { eyebrow: "Qat'iy chegara", title: "LLM qaror qilmaydi", body: "Model ma'lumotlar bazasiga ega emas va xom entitylarni ko'rmaydi. U faqat tayyor Decision va Explanation obyektlarini tushuntiradi." },
        { eyebrow: "Shaffoflik", title: "Nega tanlanmadi?", body: "Confidence score masofa, byudjet va mavjudlikni ko'rsatadi. Tizim yopiq eshiklarni ham izohlaydi: yopiq, qimmat yoki ma'lumoti yetishmaydi." },
        { eyebrow: "Bitta intelligence, ikki ovoz", title: "Foydalanuvchi va biznes uchun", body: "Bir xil intelligence iste'molchiga tavsiya, biznes egasiga esa nima uchun tavsiya qilinmagani va nimani yaxshilash kerakligini tushuntiradi." },
        { eyebrow: "Multiplayer", title: "Guruhlar bilan rejalash", body: "Workspace birgalikda rejalashning markaziy obyektiga aylanadi: Gurman qarama-qarshi afzalliklarni birlashtirib, adolatli murosa taklif qiladi." },
        { eyebrow: "Dalilga asoslangan o'rganish", title: "Haqiqiy natijalar modelni yaxshilaydi", body: "Bron qilingan, o'zgartirilgan, e'tiborsiz qoldirilgan yoki sharhlangan tanlovlar kelajakdagi retrieval va reasoning uchun signalga aylanadi." }
      ],
      footer: "Bu arxitektura Gurmanni oddiy qidiruvdan shahar intelligence platformasiga aylantiradi. Ishonch — chiroyli javob emas, tekshiriladigan qaror izidir."
    },
    memory: {
      eyebrow: "Memory Model · Epic 05",
      tiersLabel: "Olti typed tier · olish ustuvorligi",
      title: "Gurman suhbatlarni emas, tuzilgan bilimni eslab qoladi.",
      body: "Xom chat tarixini modelga qayta uzatish o'rniga, Memory Engine foydalanuvchi kontekstini kuchli tiplarga ega MemoryObject shaklida boshqaradi. Shu tariqa Gurman har bir so'rovni sovuq start sifatida boshlamaydi.",
      philosophy: {
        label: "Falsafa",
        title: "Xom chat emas — tekshiriladigan kontekst",
        body: "Har bir xotira qaerdan kelgani, qanchalik ishonchli ekani va qachon eskirishi bilan saqlanadi.",
        items: ["memoryId · noyob identifikator", "source · aniq yoki xulq-atvordan olingan manba", "confidence · ishonchlilik darajasi", "retrievalPriority · qat'iy olish tartibi", "expires · createdAt · updatedAt · hayot sikli"]
      },
      tiers: [
        { number: "01", title: "WorkspaceTimeline", body: "Faol hamkorlik bosqichlari, vaqt jadvali va bronlar uchun real vaqt konteksti." },
        { number: "02", title: "MissionContext", body: "Bugungi vazifa: 6 mehmon, Yunusobod va 2,5 mln so'mlik tug'ilgan kun rejasi." },
        { number: "03", title: "RelationshipContext", body: "Guruh aloqalari, birgalikdagi afzalliklar va kelishilgan byudjet chegaralari." },
        { number: "04", title: "PreferenceContext", body: "Uzoq muddatli didlar: oshxona, sayohat radiusi, muhit va odatlar." },
        { number: "05", title: "BusinessContext", body: "Biznesning operatsion holati va foydalanuvchi tajribalaridan tuzilgan AI profili." },
        { number: "06", title: "MarketplaceContext", body: "Shahar va mahalla tendensiyalari: talab, tirbandlik yoki ob-havo signallari." }
      ],
      diagram: {
        label: "Intelligence ichidagi o'rni",
        layers: ["Conversational / LLM presentation", "Deterministic Reasoning Engine", "Memory Engine · 6 typed tiers", "Experience & Knowledge Graph", "Marketplace Intelligence / Feature Store", "Raw Marketplace Data"]
      },
      async: {
        label: "Asinxron o'rganish",
        title: "Xotira jonli oqimni sekinlashtirmaydi.",
        body: "Memory Engine qimmat hisob-kitoblarni foydalanuvchi kutayotgan paytda emas, platforma hodisalaridan keyin bajaradi.",
        cards: [
          { eyebrow: "Saqlangan xulosalar", title: "Har safar qayta o'qimaydi", body: "Mijoz profillari va biznes metrikalari oldindan umumlashtirilgan maydonlarda saqlanadi." },
          { eyebrow: "Relationship inference", title: "Odatlar checklistdan tug'ilmaydi", body: "Salon, manikyur va spa ketma-ket bron qilinsa, tizim beauty routine munosabatini xulosa qiladi." },
          { eyebrow: "Idempotent AI Jobs", title: "Hodisadan keyin yangilanadi", body: "ExperienceCompleted yoki ReviewAdded kabi hodisalar UpdateCustomerMemoryJob ni ishga tushiradi." }
        ]
      },
      footer: "Tuzilgan xotira Gurman uchun shaxsiylashtirishni aniq, auditable va doimiy qiladi: aytilgan afzalliklar ham, amaldagi xatti-harakatlar ham qaror uchun signalga aylanadi."
    },
    collaboration: {
      eyebrow: "Collaborative Workspace · Multiplayer",
      title: "Guruh rejasida Gurman oxirgi gapirgan odamga emas, kelishuvga xizmat qiladi.",
      body: "Haqiqiy hayotdagi rejalar bitta foydalanuvchiga tegishli emas. Workspace guruhning markaziy obyektiga aylanadi, Gurman esa turli did, byudjet va vaqtlarni faol mediator sifatida birlashtiradi.",
      mediator: {
        label: "Group Consensus Engine",
        title: "Gurman moderator sifatida",
        body: "Har bir ishtirokchining xohishi alohida ko'rinadi, lekin qaror guruhning umumiy cheklovlari asosida quriladi.",
        points: ["Yagona consensus vector", "Disagreement score · fikrlar qanchalik uzoq", "Murosalar xulosasi · nima saqlandi, nima o'zgardi", "Qattiq cheklovlar · vegetarian, seafood yo'q yoki byudjet chegarasi"]
      },
      flow: {
        label: "Guruh qarori qanday yetiladi",
        steps: ["Afzalliklarni birlashtirish", "Ziddiyatlarni ko'rsatish", "Murosani taklif qilish", "Ovozlarni yig'ish", "Rejani tayyor deb belgilash"]
      },
      cards: [
        { eyebrow: "Constraint negotiation", title: "Byudjetni jim o'rtalamaydi", body: "25, 40 va 70 dollarlik cheklovlar yashirilmaydi. Gurman konfliktni ko'rsatib, guruh o'rtacha byudjetiga mos aqlli variant taklif qiladi." },
        { eyebrow: "Voting Engine", title: "Har kimning ovozi ko'rinadi", body: "Like, skip, favorite, maybe yoki tasdiqlash orqali guruh fikri yig'iladi. To'y yoki korporativ reja uchun ovoz berish anonim yoki vaznli bo'lishi mumkin." },
        { eyebrow: "Readiness Engine", title: "Bron qilishga shoshilmaydi", body: "Ovozlar, byudjet tasdiqlari yoki restoran javobi kutilayotgan bo'lsa, reja not ready deb belgilanadi." },
        { eyebrow: "Time + space optimization", title: "Hamma uchun ishlaydigan nuqta", body: "Tizim barcha ishtirokchilarning bo'sh vaqtini kesishadi va umumiy yo'l vaqtini kamaytiradigan uchrashuv joyini hisoblaydi." },
        { eyebrow: "Replacement Engine", title: "Rad etilgan joy izoh bilan almashtiriladi", body: "Yangi variant nimani saqlagani, nimani olib tashlagani va nimani qo'shganini ochiq ko'rsatadi — masalan, narx kamaydi, rooftop qo'shildi." }
      ],
      footer: "Gurman guruhni bir xil fikrga majburlamaydi. U kelishmovchilikni ko'rinadigan qilib, eng yaxshi asoslangan murosaga olib boradi."
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
      howItWorksCta: "Как это работает?",
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
    intelligence: {
      eyebrow: "Gurman Intelligence",
      title: "Это не чат-бот. Это слой принятия решений Manzil.",
      body: "Manzil не просто показывает информацию — он помогает сделать уверенный выбор. Gurman Intelligence связывает бизнесы, услуги, впечатления и контекст пользователя, чтобы превращать намерение в реальный план.",
      layers: [
        { number: "01", title: "Исходные данные marketplace", body: "Проверенные бизнесы, услуги, часы работы, доступность, отзывы и предложения." },
        { number: "02", title: "AI Feature Store", body: "Производные факты — часы пик, стабильность цен и типичное время визита — считаются заранее." },
        { number: "03", title: "Knowledge Graph", body: "Связывает отношения «бизнес → услуга → впечатление» с доверием, источником и временем." },
        { number: "04", title: "Memory Engine", body: "Отделяет контекст текущей задачи от долгосрочных предпочтений пользователя." },
        { number: "05", title: "Reasoning Engine", body: "Детерминированно оценивает варианты по политике, бюджету, времени, расстоянию и маршруту." },
        { number: "06", title: "Conversational layer", body: "Объясняет принятое решение на узбекском, русском или английском — голосом Gurman." }
      ],
      pipeline: {
        label: "Как рождается решение",
        steps: ["Запрос", "Намерение", "Гибридный retrieval", "Reasoning", "Решение", "Tool orchestrator", "Презентация LLM", "Ответ"]
      },
      principles: [
        { eyebrow: "Жёсткая граница", title: "LLM не принимает решения", body: "Модель не имеет доступа к базе данных и сырым сущностям. Она объясняет только готовые объекты Decision и Explanation." },
        { eyebrow: "Прозрачность", title: "Почему не рекомендовано?", body: "Confidence score показывает влияние бюджета, расстояния и доступности. Система объясняет и отказы: закрыто, дорого или не хватает данных." },
        { eyebrow: "Один intelligence, два голоса", title: "Для пользователя и бизнеса", body: "Один intelligence даёт рекомендации пользователю, а владельцу объясняет, почему бизнес не попал в выбор и что улучшить." },
        { eyebrow: "Multiplayer", title: "Планирование для группы", body: "Workspace становится центром совместного планирования: Gurman объединяет разные предпочтения и предлагает честный компромисс." },
        { eyebrow: "Обучение на фактах", title: "Реальные результаты улучшают систему", body: "Забронированные, изменённые, проигнорированные и оценённые рекомендации становятся сигналами для будущего retrieval и reasoning." }
      ],
      footer: "Эта архитектура превращает Gurman из обычного поиска в платформу городской intelligence. Доверие — это не красивый ответ, а проверяемый след решения."
    },
    memory: {
      eyebrow: "Memory Model · Epic 05",
      tiersLabel: "Шесть типизированных уровней · приоритет извлечения",
      title: "Gurman запоминает не чаты, а структурированные знания.",
      body: "Вместо передачи сырых историй чата модели Memory Engine управляет контекстом пользователя в строго типизированных объектах MemoryObject. Поэтому каждый новый запрос не начинается с нуля.",
      philosophy: {
        label: "Философия",
        title: "Не сырой чат, а проверяемый контекст",
        body: "Каждая память хранится вместе с происхождением, уровнем уверенности и сроком действия.",
        items: ["memoryId · уникальный идентификатор", "source · явное высказывание или поведение", "confidence · уровень надёжности вывода", "retrievalPriority · заданный порядок извлечения", "expires · createdAt · updatedAt · жизненный цикл"]
      },
      tiers: [
        { number: "01", title: "WorkspaceTimeline", body: "Контекст активных этапов совместной работы, временной шкалы и бронирований в реальном времени." },
        { number: "02", title: "MissionContext", body: "Текущая задача: день рождения на 6 гостей в Юнусабаде с бюджетом 2,5 млн сум." },
        { number: "03", title: "RelationshipContext", body: "Социальные связи, общие предпочтения и согласованные ограничения группы." },
        { number: "04", title: "PreferenceContext", body: "Долгосрочные вкусы: кухня, радиус поездок, атмосфера и привычки." },
        { number: "05", title: "BusinessContext", body: "AI-профиль операционной реальности бизнеса, собранный из опыта пользователей." },
        { number: "06", title: "MarketplaceContext", body: "Городские и районные сигналы: спрос, пробки и локальные погодные изменения." }
      ],
      diagram: {
        label: "Место в Intelligence Architecture",
        layers: ["Conversational / LLM presentation", "Deterministic Reasoning Engine", "Memory Engine · 6 typed tiers", "Experience & Knowledge Graph", "Marketplace Intelligence / Feature Store", "Raw Marketplace Data"]
      },
      async: {
        label: "Асинхронное обучение",
        title: "Память не замедляет живой запрос.",
        body: "Memory Engine выполняет дорогие вычисления после событий платформы, а не пока пользователь ждёт ответа.",
        cards: [
          { eyebrow: "Сохранённые сводки", title: "Не перечитывает всё заново", body: "Профили клиентов и метрики бизнеса заранее сохраняются в обобщённых полях базы данных." },
          { eyebrow: "Relationship inference", title: "Привычки без анкет", body: "Если пользователь последовательно бронирует салон, маникюр и спа, система выводит связь beauty routine." },
          { eyebrow: "Idempotent AI Jobs", title: "Обновляется после события", body: "События ExperienceCompleted или ReviewAdded запускают UpdateCustomerMemoryJob." }
        ]
      },
      footer: "Структурированная память делает персонализацию Gurman точной, проверяемой и постоянной: и заявленные предпочтения, и реальные действия становятся сигналами для решения."
    },
    collaboration: {
      eyebrow: "Collaborative Workspace · Multiplayer",
      title: "В групповом плане Gurman служит консенсусу, а не последнему голосу.",
      body: "Реальные планы принадлежат не одному пользователю. Workspace становится центральным объектом группы, а Gurman как активный медиатор объединяет разные вкусы, бюджеты и расписания.",
      mediator: {
        label: "Group Consensus Engine",
        title: "Gurman как модератор",
        body: "Предпочтения каждого участника остаются видимыми, но решение строится на общих ограничениях группы.",
        points: ["Единый consensus vector", "Disagreement score · расстояние между мнениями", "Сводка компромиссов · что сохранено и изменено", "Жёсткие ограничения · вегетарианство, без морепродуктов или лимит бюджета"]
      },
      flow: {
        label: "Как группа приходит к решению",
        steps: ["Объединить предпочтения", "Показать конфликты", "Предложить компромисс", "Собрать голоса", "Отметить план готовым"]
      },
      cards: [
        { eyebrow: "Constraint negotiation", title: "Бюджет не усредняется молча", body: "Ограничения 25, 40 и 70 долларов не скрываются. Gurman показывает конфликт и предлагает вариант в среднем бюджете группы." },
        { eyebrow: "Voting Engine", title: "Каждый голос имеет значение", body: "Like, skip, favorite, maybe или явное одобрение помогают собрать мнение группы. Для свадьбы или корпоратива голосование может быть анонимным или взвешенным." },
        { eyebrow: "Readiness Engine", title: "Не торопится с бронированием", body: "Если ждём голоса, подтверждение бюджета или ответ ресторана, план получает статус not ready." },
        { eyebrow: "Time + space optimization", title: "Точка, удобная для всех", body: "Система пересекает свободное время участников и ищет место, минимизирующее общее время в пути." },
        { eyebrow: "Replacement Engine", title: "Замена объясняется", body: "Новый вариант показывает, что сохранилось, что убрали и что добавили — например, снизили цену и добавили крышу с музыкой." }
      ],
      footer: "Gurman не заставляет группу думать одинаково. Он делает разногласия видимыми и приводит к наиболее обоснованному компромиссу."
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
      howItWorksCta: "How it works",
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
    intelligence: {
      eyebrow: "Gurman Intelligence",
      title: "Not a chatbot. Manzil's decision-making layer.",
      body: "Manzil is not built to simply display information — it is built to help people choose with confidence. Gurman Intelligence connects businesses, services, experiences, and user context to turn intent into a real-world plan.",
      layers: [
        { number: "01", title: "Raw marketplace data", body: "Verified businesses, services, hours, availability, reviews, and promotions." },
        { number: "02", title: "AI Feature Store", body: "Derived facts such as peak hours, price stability, and typical visit times are computed ahead of time." },
        { number: "03", title: "Knowledge Graph", body: "Maps Business → Service → Experience relationships with confidence, provenance, and time." },
        { number: "04", title: "Memory Engine", body: "Separates the active mission — like today's birthday plan — from long-term preferences." },
        { number: "05", title: "Reasoning Engine", body: "Deterministically evaluates candidates against policy, budget, time, distance, and routing." },
        { number: "06", title: "Conversational layer", body: "Explains the decision in Uzbek, Russian, or English, using Gurman's voice." }
      ],
      pipeline: {
        label: "How a decision is formed",
        steps: ["Request", "Intent", "Hybrid retrieval", "Reasoning", "Decision", "Tool orchestrator", "LLM presentation", "Response"]
      },
      principles: [
        { eyebrow: "Strict boundary", title: "The LLM never decides", body: "The model has no direct access to databases or raw entities. It explains structured Decision and Explanation objects only." },
        { eyebrow: "Transparency", title: "Why was it excluded?", body: "Confidence scores expose budget, distance, and availability. The system can explain rejection too: closed, over budget, or missing data." },
        { eyebrow: "One intelligence, two voices", title: "For people and businesses", body: "The same intelligence recommends places to consumers and tells business owners why they were not recommended and what to improve." },
        { eyebrow: "Multiplayer", title: "Planning with a group", body: "The Workspace becomes the shared planning object: Gurman merges different preference vectors and proposes a structured compromise." },
        { eyebrow: "Evidence-driven learning", title: "Real outcomes improve the system", body: "Recommendations that are booked, changed, ignored, or reviewed become signals that refine future retrieval and reasoning." }
      ],
      footer: "This architecture turns Gurman from a search feature into a city intelligence platform. Trust is not a polished answer — it is a decision trail people can inspect."
    },
    memory: {
      eyebrow: "Memory Model · Epic 05",
      tiersLabel: "Six typed tiers · retrieval priority",
      title: "Gurman remembers structured knowledge, not raw chats.",
      body: "Instead of replaying raw chat histories into an LLM, the Memory Engine manages user context as strongly typed MemoryObjects. That means Gurman does not treat every request as a cold start.",
      philosophy: {
        label: "The philosophy",
        title: "Structured context, never raw chat",
        body: "Every memory is stored with its provenance, confidence, retrieval priority, and lifecycle.",
        items: ["memoryId · a unique identity", "source · explicit statement or observed behaviour", "confidence · reliability of the inference", "retrievalPriority · enforced retrieval order", "expires · createdAt · updatedAt · strict lifecycle"]
      },
      tiers: [
        { number: "01", title: "WorkspaceTimeline", body: "Real-time context for active collaborative steps, timelines, and bookings." },
        { number: "02", title: "MissionContext", body: "The immediate task: a birthday tomorrow for 6 guests near Yunusabad with a 2.5M UZS budget." },
        { number: "03", title: "RelationshipContext", body: "Social connections, group preference vectors, and shared budget limits." },
        { number: "04", title: "PreferenceContext", body: "Long-term tastes: cuisine, travel radius, atmosphere, and habits." },
        { number: "05", title: "BusinessContext", body: "An AI profile of a business's operational reality, built from customer experience." },
        { number: "06", title: "MarketplaceContext", body: "City and neighbourhood signals such as demand spikes, traffic, and weather." }
      ],
      diagram: {
        label: "Where memory sits in the architecture",
        layers: ["Conversational / LLM presentation", "Deterministic Reasoning Engine", "Memory Engine · 6 typed tiers", "Experience & Knowledge Graph", "Marketplace Intelligence / Feature Store", "Raw Marketplace Data"]
      },
      async: {
        label: "Asynchronous learning",
        title: "Memory never slows down the live request.",
        body: "The Memory Engine handles expensive computation after platform events, not while a person is waiting for an answer.",
        cards: [
          { eyebrow: "Stored summaries", title: "No dynamic history replay", body: "Customer profiles and business metrics are kept in pre-summarised database fields instead of rereading old logs." },
          { eyebrow: "Relationship inference", title: "Habits without checklists", body: "A repeated salon, nail, and spa sequence can become a stored beauty routine relationship." },
          { eyebrow: "Idempotent AI Jobs", title: "Update after the event", body: "Events such as ExperienceCompleted or ReviewAdded trigger UpdateCustomerMemoryJob asynchronously." }
        ]
      },
      footer: "Structured memory makes Gurman personalisation precise, auditable, and persistent: stated preferences and observed behaviour both become weighted signals for better decisions."
    },
    collaboration: {
      eyebrow: "Collaborative Workspace · Multiplayer",
      title: "For group plans, Gurman serves consensus — not the person who spoke last.",
      body: "Real-life plans do not belong to one user. The Workspace becomes the group's central object, while Gurman acts as an active mediator across different tastes, budgets, and schedules.",
      mediator: {
        label: "Group Consensus Engine",
        title: "Gurman as moderator",
        body: "Each person's preferences remain visible, but the decision is built around the group's shared constraints.",
        points: ["A unified consensus vector", "Disagreement score · how far opinions diverge", "A compromise summary · what stayed and what changed", "Hard constraints · vegetarian, no seafood, or budget limits"]
      },
      flow: {
        label: "How a group reaches a decision",
        steps: ["Aggregate preferences", "Surface conflicts", "Propose a compromise", "Collect votes", "Mark the plan ready"]
      },
      cards: [
        { eyebrow: "Constraint negotiation", title: "Budgets are not silently averaged", body: "Limits of $25, $40, and $70 remain visible. Gurman surfaces the conflict and proposes a smarter option around the group's average budget." },
        { eyebrow: "Voting Engine", title: "Every voice is trackable", body: "Like, skip, favorite, maybe, or explicit approval gathers the group's view. Wedding and corporate plans can use anonymous or weighted voting." },
        { eyebrow: "Readiness Engine", title: "It does not rush to book", body: "If votes, budget confirmations, or a restaurant response are still outstanding, the plan is marked not ready." },
        { eyebrow: "Time + space optimization", title: "A meeting point that works for everyone", body: "The system intersects everyone's availability and calculates a location that minimises total travel time." },
        { eyebrow: "Replacement Engine", title: "Replacements come with an explanation", body: "A new option shows what it kept, removed, and added — for example, lower cost while adding a rooftop and live music." }
      ],
      footer: "Gurman does not force a group to agree on everything. It makes disagreement visible and guides the group toward the best-grounded compromise."
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
