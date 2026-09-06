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

export type ManzilStoryCopy = {
  title: string;
  subtitle: string;
  discover: {
    eyebrow: string;
    context: string;
    districtOne: string;
    districtTwo: string;
    placeName: string;
    placeMeta: string;
    chipOne: string;
    chipTwo: string;
    tag: string;
    title: string;
    description: string;
  };
  care: {
    eyebrow: string;
    context: string;
    kicker: string;
    planTitle: string;
    avatar: string;
    service: string;
    preferredTimeLabel: string;
    preferredTime: string;
    simplePlan: string;
    simplePlanNote: string;
    tag: string;
    title: string;
    description: string;
  };
  trust: {
    eyebrow: string;
    context: string;
    kicker: string;
    placeName: string;
    quote: string;
    location: string;
    verdict: string;
    tag: string;
    title: string;
    description: string;
  };
  share: {
    eyebrow: string;
    context: string;
    avatar: string;
    name: string;
    handle: string;
    statement: string;
    chips: string[];
    tabs: string[];
    placeName: string;
    verdict: string;
    tag: string;
    title: string;
    description: string;
  };
};

export type GurmanHowItWorksStage =
  | {
      id: "intent";
      kind: "intent";
      number: string;
      label: string;
      title: string;
      description: string;
      visualLabel: string;
      fields: Array<{ label: string; value: string }>;
    }
  | {
      id: "constraints";
      kind: "constraints";
      number: string;
      label: string;
      title: string;
      description: string;
      groups: Array<{ label: string; tone: "must" | "prefer"; items: string[] }>;
    }
  | {
      id: "evidence";
      kind: "evidence";
      number: string;
      label: string;
      title: string;
      description: string;
      visualLabel: string;
      note: string;
      items: Array<{
        label: string;
        status: string;
        tone: "supported" | "unknown";
      }>;
    }
  | {
      id: "decision";
      kind: "decision";
      number: string;
      label: string;
      title: string;
      description: string;
      visualLabel: string;
      decisionLabel: string;
      decisionStatus: string;
      candidates: Array<{
        label: string;
        status: string;
        tone: "suppressed" | "ranked" | "alternative";
      }>;
    }
  | {
      id: "language";
      kind: "language";
      number: string;
      label: string;
      title: string;
      description: string;
      visualLabel: string;
      pipeline: string[];
      ruleLine: string;
    };

export type GurmanHowItWorksCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  truthLabel: string;
  carouselLabel: string;
  stepLabel: string;
  ofLabel: string;
  previousLabel: string;
  nextLabel: string;
  finishLabel: string;
  stageNavigationLabel: string;
  requestLabel: string;
  request: string;
  waitlistCta: string;
  discoverCta: string;
  signature: {
    label: string;
    lineOne: string;
    lineTwo: string;
  };
  stages: GurmanHowItWorksStage[];
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
  features: string[];
  cta: string;
  ctaHref: string;
};

export type CleverPricingCopy = {
  title: string;
  subtitle: string;
  featuresLabel: string;
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
  contactCta: string;
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
  story: ManzilStoryCopy;
  gurmanHowItWorks: GurmanHowItWorksCopy;
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
    story: {
      title: "Shahringizdagi hayot bir joyda",
      subtitle:
        "Yangi joylarni kashf eting, kundalik ehtiyojlaringizni bir joyda hal qiling, haqiqiy odamlar tajribasi asosida tanlang va o‘z hikoyalaringizni ulashing.",
      discover: {
        eyebrow: "Discover",
        context: "Toshkent · near you",
        districtOne: "Yunusobod",
        districtTwo: "Chilonzor",
        placeName: "Qorasuv Courtyard",
        placeMeta: "Quiet coffee · Yunusobod",
        chipOne: "Coffee",
        chipTwo: "12 min from you",
        tag: "Kashf etish",
        title: "Yashirin maskanlarni kashf eting",
        description: "Siz bilmagan, ammo yoningizda bo‘lgan joylarni toping."
      },
      care: {
        eyebrow: "Everyday care",
        context: "Mobile concept",
        kicker: "Your next plan",
        planTitle: "Find a barber",
        avatar: "S",
        service: "Classic cut",
        preferredTimeLabel: "Preferred time",
        preferredTime: "Saturday · 16:30",
        simplePlan: "A simple plan",
        simplePlanNote: "Choose what works for you",
        tag: "Kundalik ehtiyojlar",
        title: "Kundalik ehtiyojlaringizni bir joyda hal qiling",
        description: "Sartarosh va boshqa mahalliy xizmatlarni bir ilovada toping, tanlang va rejalang."
      },
      trust: {
        eyebrow: "Human experience",
        context: "Illustrative preview",
        kicker: "A place to remember",
        placeName: "Qorasuv Courtyard",
        quote: "“Quiet, warm, and worth a slower morning.”",
        location: "Yunusobod",
        verdict: "Worth the visit",
        tag: "Haqiqiy tajriba",
        title: "Haqiqiy tajribalar asosida tanlang",
        description: "Suratlar, sharhlar va odamlarning shaxsiy fikrlari orqali joy sizga mosligini tushuning."
      },
      share: {
        eyebrow: "John Doe’s story",
        context: "Illustrative profile",
        avatar: "JD",
        name: "John Doe",
        handle: "@johndoe · Manzil story",
        statement: "Found a place worth returning to.",
        chips: ["Local finds", "Tashkent", "Worth the visit"],
        tabs: ["Stories", "Places", "Saved"],
        placeName: "Qorasuv Courtyard",
        verdict: "Worth the visit",
        tag: "Hikoyalar",
        title: "John Doe hikoyasi",
        description: "Joy, suratlar va shaxsiy fikr bilan o‘z shahar hikoyangizni ulashing."
      }
    },
    gurmanHowItWorks: {
      eyebrow: "GURMAN ALGORITMI",
      title: "U shunchaki javob bermaydi. U amalda nima mumkinligini aniqlaydi.",
      subtitle:
        "Gurman inson niyatini aniq vazifaga aylantirish, uni mahalliy dalillar va haqiqiy cheklovlar bilan tekshirish hamda faktlar asosida reja tuzish uchun yaratilmoqda. Til modeli oxirida ishlaydi — qaror qabul qilish uchun emas, uni tushuntirish uchun.",
      truthLabel: "Ko‘rib chiqish · Mobil Gurman",
      carouselLabel: "Bitta so‘rov · besh bosqich",
      stepLabel: "Bosqich",
      ofLabel: "dan",
      previousLabel: "Oldingi bosqich",
      nextLabel: "Keyingi bosqich",
      finishLabel: "Yakunlandi",
      stageNavigationLabel: "Gurman bosqichlari",
      requestLabel: "Misol vazifa · konsept preview",
      request: "Juma kuni Yunusobod yaqinida olti kishi uchun sokin tug‘ilgan kun kechasi rejalashtiring. Budjetimdan oshmasin.",
      waitlistCta: "Mobil Gurman navbatiga qo‘shiling",
      discoverCta: "Haqiqiy joylarni ko‘rish",
      signature: {
        label: "Asosiy qoida",
        lineOne: "Model ifodalaydi.",
        lineTwo: "Algoritm qaror qiladi.",
      },
      stages: [
        {
          id: "intent",
          kind: "intent",
          number: "01",
          label: "NIYATNI KOMPILYATSIYA QILISH",
          title: "Bir jumla vazifaga aylanadi.",
          description:
            "Gurman so‘rovni shunchaki kalit so‘zlar to‘plami deb qabul qilmaydi. U maqsad, odamlar, vaqt, joy, sabab, budjet ma’nosi va ochiq savollarni ajratadi.",
          visualLabel: "Tuzilgan vazifa",
          fields: [
            { label: "Maqsad", value: "Tug‘ilgan kun kechasi" },
            { label: "Odamlar", value: "6 kishi" },
            { label: "Vaqt", value: "Juma oqshomi" },
            { label: "Hudud", value: "Yunusobod" },
            { label: "Sabab", value: "Tug‘ilgan kun" },
            { label: "Budjet", value: "Maqsadli oraliq · maksimum aytilmagan" },
            { label: "Yetishmaydi", value: "Aniq vaqt · joriy mavjudlik" },
          ],
        },
        {
          id: "constraints",
          kind: "constraints",
          number: "02",
          label: "QOIDALARNI ANIQLASH",
          title: "Majburiy shartlar afzalliklardan farq qiladi.",
          description:
            "Amalga oshadigan reja vaqt, sig‘im va yo‘nalishga mos kelishi kerak. Sokin muhit, taom turi, budjet va kayfiyat variantlarni tartiblashga yordam beradi — agar siz ulardan birini majburiy qilmasangiz.",
          groups: [
            { label: "MAJBURİY BAJARILADI", tone: "must", items: ["Vaqt oralig‘i", "Haqiqiy sig‘im", "Yo‘l masofasi"] },
            { label: "USTUVORLIK BERILADI", tone: "prefer", items: ["Sokin muhit", "Budjet maqsadi", "Oilaga mos xizmat"] },
          ],
        },
        {
          id: "evidence",
          kind: "evidence",
          number: "03",
          label: "DALILLARNI TEKSHIRISH",
          title: "Har bir da’voning manbasi bo‘lishi kerak.",
          description:
            "Haqiqiy listing uning joriy mavjudligi, xizmat sifati yoki aynan shu so‘rovga mosligini avtomatik isbotlamaydi. Ishonch va bo‘shliqlar ko‘rinib turadi.",
          visualLabel: "Dalil va ishonch",
          note: "Yetishmayotgan ma’lumot yashirilmaydi.",
          items: [
            { label: "Listing identifikatsiyasi", status: "Tasdiqlangan", tone: "supported" },
            { label: "Xizmat dalili", status: "Yangi · qo‘llab-quvvatlangan", tone: "supported" },
            { label: "Olti kishilik sig‘im", status: "Noma’lum · aniqlash kerak", tone: "unknown" },
            { label: "Yo‘lga mosligi", status: "Qo‘llab-quvvatlangan", tone: "supported" },
            { label: "Narx", status: "Ko‘rsatilmagan", tone: "unknown" },
            { label: "Xulq-atvor ishonchi", status: "So‘rovga bog‘liq", tone: "unknown" },
          ],
        },
        {
          id: "decision",
          kind: "decision",
          number: "04",
          label: "QARORNI HISOBLASH",
          title: "Algoritm amalga oshadigan variantni tanlaydi.",
          description:
            "Gurman imkonsiz variantlarni chiqarib tashlaydi, qolganlarini tartiblaydi, nima uchun mosligini qayd etadi va dalil yoki mavjudlik to‘liq bo‘lmaganda muqobillarni saqlab qoladi.",
          visualLabel: "Qaror izi",
          decisionLabel: "Qaror holati",
          decisionStatus: "Qoralama reja · bron qilinmagan",
          candidates: [
            { label: "Nomzod A", status: "Yashirildi · xulq-atvor dalili kerak", tone: "suppressed" },
            { label: "Nomzod B", status: "Tartiblandi · sig‘imni aniqlash kerak", tone: "ranked" },
            { label: "Nomzod C", status: "Muqobil · budjet farqi ko‘rsatilgan", tone: "alternative" },
          ],
        },
        {
          id: "language",
          kind: "language",
          number: "05",
          label: "OXIRIDA IFODALASH",
          title: "Til modeli bo‘sh sahifadan emas, qarordan boshlaydi.",
          description:
            "Algoritm nomzodlar, dalillar, cheklovlar, xavflar va muqobillarni hisoblagandan keyingina til qatlami tuzilgan qarorni tabiiy javobga aylantiradi.",
          visualLabel: "Qaror paketi",
          pipeline: ["Qaror paketi", "Ruxsat etilgan da’volar", "Dalil bo‘shliqlari", "Tanlangan variantlar", "Xavflar va muqobillar", "Tabiiy til javobi"],
          ruleLine: "Model ifodalaydi. Algoritm qaror qiladi.",
        },
      ],
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
      title: "Har qanday biznes uchun mos rejalar",
      subtitle: "Kompaniyangizni Manzil katalogiga qo'shing va maqsadli auditoriyani jalb qiling.",
      featuresLabel: "Kiritilgan imkoniyatlar:",
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
          cta: "Try for Free",
          ctaHref: "/uz/business/register"
        },
        {
          id: "pro",
          name: "Pro",
          tagline: "Ko'proq mijoz jalb qilish va o'z sohasida yetakchi bo'lish uchun.",
          price: "",
          period: "",
          features: [
            "Free tarifidagi barcha imkoniyatlar",
            "Tasdiqlangan 'Verified' ko'k nishon",
            "Qidiruv natijalarida yuqori o'rinlar",
            "Katalogdagi ustuvor ko'rinish",
            "Cheksiz fotosuratlar va menyu",
            "Batafsil ko'rishlar tahlili (Analytics)"
          ],
          cta: "Try Pro",
          ctaHref: "/uz/business/register?plan=pro"
        },
        {
          id: "max",
          name: "Max",
          tagline: "Tarmoqli restoranlar va yirik xizmat ko'rsatuvchilar uchun.",
          price: "",
          period: "",
          features: [
            "Pro rejasidagi barcha imkoniyatlar",
            "Bosh sahifada maxsus banner joylashuvi",
            "Eksklyuziv promo-aksiyalar e'loni",
            "Bir nechta filiallarni yagona boshqarish",
            "Shaxsiy menejer va 24/7 qo'llab-quvvatlash",
            "Shaxsiy brending va foto-suratga olish"
          ],
          cta: "Try Max",
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
      contactCta: "Bog'lanish",
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
    story: {
      title: "Вся жизнь вашего города — в одном месте",
      subtitle:
        "Открывайте новые места, решайте повседневные задачи в одном месте, выбирайте на основе реального опыта людей и делитесь своими историями.",
      discover: {
        eyebrow: "Discover",
        context: "Ташкент · рядом с вами",
        districtOne: "Юнусабад",
        districtTwo: "Чиланзар",
        placeName: "Qorasuv Courtyard",
        placeMeta: "Тихий кофе · Юнусабад",
        chipOne: "Кофе",
        chipTwo: "12 мин от вас",
        tag: "Открывайте",
        title: "Находите места, о которых не знали",
        description: "Открывайте места рядом, которые легко пропустить."
      },
      care: {
        eyebrow: "Повседневные задачи",
        context: "Мобильная концепция",
        kicker: "Ваш следующий план",
        planTitle: "Найти барбера",
        avatar: "S",
        service: "Классическая стрижка",
        preferredTimeLabel: "Удобное время",
        preferredTime: "Суббота · 16:30",
        simplePlan: "Простой план",
        simplePlanNote: "Выберите подходящий вариант",
        tag: "Повседневные задачи",
        title: "Решайте повседневные задачи в одном месте",
        description: "Находите, выбирайте и планируйте услуги рядом — от барбера до других локальных сервисов."
      },
      trust: {
        eyebrow: "Опыт людей",
        context: "Иллюстративный предпросмотр",
        kicker: "Место, которое запомнится",
        placeName: "Qorasuv Courtyard",
        quote: "«Тихо, тепло и стоит не торопить утро».",
        location: "Юнусабад",
        verdict: "Стоит посетить",
        tag: "Реальный опыт",
        title: "Выбирайте на основе реального опыта",
        description: "Понимайте, подходит ли вам место, через фотографии, отзывы и личные впечатления людей."
      },
      share: {
        eyebrow: "История John Doe",
        context: "Иллюстративный профиль",
        avatar: "JD",
        name: "John Doe",
        handle: "@johndoe · история Manzil",
        statement: "Нашёл место, куда хочется вернуться.",
        chips: ["Местные находки", "Ташкент", "Стоит посетить"],
        tabs: ["Истории", "Места", "Сохранённые"],
        placeName: "Qorasuv Courtyard",
        verdict: "Стоит посетить",
        tag: "Истории",
        title: "История John Doe",
        description: "Делитесь своей городской историей — местом, фотографиями и личным мнением."
      }
    },
    gurmanHowItWorks: {
      eyebrow: "АЛГОРИТМ GURMAN",
      title: "Он не просто отвечает. Он определяет, что действительно возможно.",
      subtitle:
        "Gurman создаётся, чтобы превращать человеческое намерение в структурированную задачу, проверять её по локальным данным и реальным ограничениям и предлагать план только тогда, когда его подтверждают факты. Языковая модель работает в конце — чтобы объяснить решение, а не принять его.",
      truthLabel: "Предпросмотр · мобильный Gurman",
      carouselLabel: "Один запрос · пять этапов",
      stepLabel: "Этап",
      ofLabel: "из",
      previousLabel: "Предыдущий этап",
      nextLabel: "Следующий этап",
      finishLabel: "Готово",
      stageNavigationLabel: "Этапы Gurman",
      requestLabel: "Пример задачи · концепт",
      request: "Спланируйте тихий праздничный ужин на шестерых в эту пятницу рядом с Юнусабадом. Уложитесь в мой бюджет.",
      waitlistCta: "Встать в очередь на мобильный Gurman",
      discoverCta: "Посмотреть реальные места",
      signature: {
        label: "Главное правило",
        lineOne: "Модель формулирует.",
        lineTwo: "Алгоритм принимает решение.",
      },
      stages: [
        {
          id: "intent",
          kind: "intent",
          number: "01",
          label: "СОБРАТЬ НАМЕРЕНИЕ",
          title: "Фраза становится задачей.",
          description:
            "Gurman не воспринимает запрос как набор ключевых слов. Он выделяет цель, людей, время, место, повод, смысл бюджета и нерешённые вопросы.",
          visualLabel: "Структурированная задача",
          fields: [
            { label: "Цель", value: "Праздничный ужин" },
            { label: "Люди", value: "6 человек" },
            { label: "Время", value: "Пятничный вечер" },
            { label: "Район", value: "Юнусабад" },
            { label: "Повод", value: "День рождения" },
            { label: "Бюджет", value: "Целевой диапазон · максимум не указан" },
            { label: "Не хватает", value: "Точное время · наличие сейчас" },
          ],
        },
        {
          id: "constraints",
          kind: "constraints",
          number: "02",
          label: "РАЗОБРАТЬ ПРАВИЛА",
          title: "Обязательное — не то же самое, что предпочтение.",
          description:
            "Рабочий план должен учитывать время, вместимость и маршрут. Тихая атмосфера, кухня, бюджет и настроение помогают ранжировать варианты — если вы не сделали их обязательными.",
          groups: [
            { label: "ДОЛЖНО СОБЛЮДАТЬСЯ", tone: "must", items: ["Временное окно", "Реальная вместимость", "Расстояние в пути"] },
            { label: "ОПТИМИЗИРОВАТЬ", tone: "prefer", items: ["Тихая атмосфера", "Целевой бюджет", "Сервис для семьи"] },
          ],
        },
        {
          id: "evidence",
          kind: "evidence",
          number: "03",
          label: "ПРОВЕРИТЬ ДАННЫЕ",
          title: "У каждого утверждения должен быть источник.",
          description:
            "Настоящая карточка места не доказывает его текущую доступность, стабильный сервис или соответствие именно этому запросу. Доверие и пробелы остаются видимыми.",
          visualLabel: "Данные и доверие",
          note: "Недостающие данные не скрываются.",
          items: [
            { label: "Идентичность карточки", status: "Проверено", tone: "supported" },
            { label: "Данные об услуге", status: "Свежие · подтверждены", tone: "supported" },
            { label: "Вместимость на шестерых", status: "Неизвестно · уточнить", tone: "unknown" },
            { label: "Подходит по маршруту", status: "Подтверждено", tone: "supported" },
            { label: "Цена", status: "Не указана", tone: "unknown" },
            { label: "Поведенческая уверенность", status: "Зависит от запроса", tone: "unknown" },
          ],
        },
        {
          id: "decision",
          kind: "decision",
          number: "04",
          label: "ВЫЧИСЛИТЬ РЕШЕНИЕ",
          title: "Алгоритм выбирает то, что выполнимо.",
          description:
            "Gurman отсеивает невозможное, ранжирует оставшееся, фиксирует причины соответствия и сохраняет альтернативы, если данных или наличия недостаточно.",
          visualLabel: "След решения",
          decisionLabel: "Состояние решения",
          decisionStatus: "Черновик плана · не забронировано",
          candidates: [
            { label: "Кандидат A", status: "Скрыт · нужны поведенческие данные", tone: "suppressed" },
            { label: "Кандидат B", status: "В рейтинге · вместимость уточняется", tone: "ranked" },
            { label: "Кандидат C", status: "Альтернатива · показана разница в бюджете", tone: "alternative" },
          ],
        },
        {
          id: "language",
          kind: "language",
          number: "05",
          label: "СНАЧАЛА РЕШЕНИЕ, ПОТОМ СЛОВА",
          title: "Языковая модель получает решение, а не пустую страницу.",
          description:
            "Только после расчёта кандидатов, данных, ограничений, рисков и альтернатив языковой слой превращает структурированное решение в естественный ответ.",
          visualLabel: "Пакет решения",
          pipeline: ["Пакет решения", "Допустимые утверждения", "Пробелы в данных", "Выбранные варианты", "Риски и альтернативы", "Ответ на естественном языке"],
          ruleLine: "Модель формулирует. Алгоритм принимает решение.",
        },
      ],
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
      title: "Гибкие тарифные планы для любого масштаба",
      subtitle: "Разместите компанию на платформе Manzil и привлекайте новых клиентов.",
      featuresLabel: "Возможности тарифа:",
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
          price: "",
          period: "",
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
          price: "",
          period: "",
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
      contactCta: "Связаться",
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
    story: {
      title: "Your city life, all in one place",
      subtitle:
        "Discover new places, handle everyday needs in one place, choose from real human experiences, and share your own stories.",
      discover: {
        eyebrow: "Discover",
        context: "Tashkent · near you",
        districtOne: "Yunusabad",
        districtTwo: "Chilanzar",
        placeName: "Qorasuv Courtyard",
        placeMeta: "Quiet coffee · Yunusabad",
        chipOne: "Coffee",
        chipTwo: "12 min from you",
        tag: "Discover",
        title: "Find places you did not know were nearby",
        description: "Find the places near you that are easy to miss."
      },
      care: {
        eyebrow: "Everyday care",
        context: "Mobile concept",
        kicker: "Your next plan",
        planTitle: "Find a barber",
        avatar: "S",
        service: "Classic cut",
        preferredTimeLabel: "Preferred time",
        preferredTime: "Saturday · 16:30",
        simplePlan: "A simple plan",
        simplePlanNote: "Choose what works for you",
        tag: "Everyday needs",
        title: "Handle everyday needs in one place",
        description: "Find, choose, and plan a barber or other local service in one app."
      },
      trust: {
        eyebrow: "Human experience",
        context: "Illustrative preview",
        kicker: "A place to remember",
        placeName: "Qorasuv Courtyard",
        quote: "“Quiet, warm, and worth a slower morning.”",
        location: "Yunusabad",
        verdict: "Worth the visit",
        tag: "Human experience",
        title: "Choose from real experiences",
        description: "Use photos, reviews, and personal perspectives to understand whether a place fits you."
      },
      share: {
        eyebrow: "John Doe’s story",
        context: "Illustrative profile",
        avatar: "JD",
        name: "John Doe",
        handle: "@johndoe · Manzil story",
        statement: "Found a place worth returning to.",
        chips: ["Local finds", "Tashkent", "Worth the visit"],
        tabs: ["Stories", "Places", "Saved"],
        placeName: "Qorasuv Courtyard",
        verdict: "Worth the visit",
        tag: "Stories",
        title: "John Doe’s story",
        description: "Share your city story with a place, photos, and a personal point of view."
      }
    },
    gurmanHowItWorks: {
      eyebrow: "THE GURMAN ALGORITHM",
      title: "It doesn’t just answer. It works out what can actually happen.",
      subtitle:
        "Gurman is being built to turn a human intention into a structured mission, test it against local evidence and real constraints, and return a plan only when the facts support it. The language model comes last — to explain the decision, not to make it.",
      truthLabel: "Preview · Mobile Gurman",
      carouselLabel: "One request · five layers",
      stepLabel: "Step",
      ofLabel: "of",
      previousLabel: "Previous stage",
      nextLabel: "Next stage",
      finishLabel: "Finished",
      stageNavigationLabel: "Gurman stages",
      requestLabel: "Example mission · concept preview",
      request: "Plan a quiet birthday dinner for six this Friday near Yunusabad. Keep it within my budget.",
      waitlistCta: "Join the mobile waitlist",
      discoverCta: "Explore real places",
      signature: {
        label: "The signature rule",
        lineOne: "The model phrases.",
        lineTwo: "The algorithm decides.",
      },
      stages: [
        {
          id: "intent",
          kind: "intent",
          number: "01",
          label: "COMPILE THE INTENTION",
          title: "A sentence becomes a mission.",
          description:
            "Gurman does not treat the request as a bag of keywords. It extracts the goal, people, time, place, occasion, budget meaning, and unresolved questions.",
          visualLabel: "Structured mission",
          fields: [
            { label: "Goal", value: "Birthday dinner" },
            { label: "People", value: "6" },
            { label: "Time", value: "Friday evening" },
            { label: "Area", value: "Yunusabad" },
            { label: "Occasion", value: "Birthday" },
            { label: "Budget", value: "Target range · maximum not stated" },
            { label: "Missing", value: "Exact time · current availability" },
          ],
        },
        {
          id: "constraints",
          kind: "constraints",
          number: "02",
          label: "RESOLVE THE RULES",
          title: "Must-haves are not the same as preferences.",
          description:
            "A feasible plan must fit the time, capacity, and route. Quiet atmosphere, cuisine, budget target, and mood help Gurman rank the options — unless you make one of them non-negotiable.",
          groups: [
            { label: "MUST SATISFY", tone: "must", items: ["Time window", "Genuine capacity", "Travel distance"] },
            { label: "OPTIMIZE FOR", tone: "prefer", items: ["Quiet atmosphere", "Budget target", "Family-friendly service"] },
          ],
        },
        {
          id: "evidence",
          kind: "evidence",
          number: "03",
          label: "TEST THE EVIDENCE",
          title: "Every claim needs a source.",
          description:
            "A real listing does not automatically prove current availability, reliable service, or a good fit for this particular request. Evidence gaps stay visible.",
          visualLabel: "Evidence and trust",
          note: "Missing information remains part of the result.",
          items: [
            { label: "Listing identity", status: "Verified", tone: "supported" },
            { label: "Service evidence", status: "Recent · supported", tone: "supported" },
            { label: "Capacity for six", status: "Unknown · confirm", tone: "unknown" },
            { label: "Travel fit", status: "Supported", tone: "supported" },
            { label: "Price", status: "Not provided", tone: "unknown" },
            { label: "Behavioral confidence", status: "Query-dependent", tone: "unknown" },
          ],
        },
        {
          id: "decision",
          kind: "decision",
          number: "04",
          label: "COMPUTE THE DECISION",
          title: "The algorithm chooses what is feasible.",
          description:
            "Gurman filters impossible options, ranks the remaining candidates, records why they fit, and preserves alternatives when evidence or availability is incomplete.",
          visualLabel: "Decision trace",
          decisionLabel: "Decision state",
          decisionStatus: "Draft plan · not booked",
          candidates: [
            { label: "Candidate A", status: "Suppressed · behavioral evidence required", tone: "suppressed" },
            { label: "Candidate B", status: "Ranked · constraints fit · capacity to confirm", tone: "ranked" },
            { label: "Candidate C", status: "Alternative · budget delta shown", tone: "alternative" },
          ],
        },
        {
          id: "language",
          kind: "language",
          number: "05",
          label: "SPEAK LAST",
          title: "The language model gets a decision — not a blank page.",
          description:
            "Only after the algorithm has computed the candidates, evidence, constraints, risks, and alternatives does the language layer turn that structured decision into a natural answer.",
          visualLabel: "Decision package",
          pipeline: ["Decision package", "Allowed claims", "Evidence gaps", "Selected options", "Risks and alternatives", "Natural-language response"],
          ruleLine: "The model phrases. The algorithm decides.",
        },
      ],
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
      title: "Flexible plans for businesses of all sizes",
      subtitle: "Showcase your business on Manzil and attract new high-intent local clients.",
      featuresLabel: "Included features:",
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
          price: "",
          period: "",
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
          price: "",
          period: "",
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
      contactCta: "Have questions? Contact us.",
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
