import type { Locale } from "@manzil/shared";

export const FOUNDER_PROFILE = {
  name: "Sunnatilla Tursunov",
  path: "/founders/sunnatilla-tursunov",
  image: "/founders/sunnatilla.jpg",
  linkedIn: "https://www.linkedin.com/in/sunnatilla-tursunov",
  university: "Tashkent State University of Economics",
  mastersUniversity: "University of World Economy and Diplomacy",
  publication: {
    title: "Challenges and Prospects for Expanding Access to Promising Foreign Labor Markets for Citizens of Uzbekistan",
    url: "https://www.gejournal.net/index.php/IJSSIR/article/view/2706",
    coauthor: "Farkhod Abdurakhmonov",
    journal: "International Journal of Social Science & Interdisciplinary Research",
    published: "2025-06-29",
    citation: "14(06), 275–290"
  },
  coverage: [
    {
      url: "https://tsue.uz/oz/news/tdiu-talabalari-ozbekistonning-qator-xorijiy-elchixonalarida-amaliyot-otab-xalqaro-tajribaga-ega-bolishmoqda",
      title: {
        uz: "TDIU talabalarining xorijdagi amaliyoti",
        ru: "Зарубежная практика студентов ТГЭУ",
        en: "International internships for TSUE students"
      }
    },
    {
      url: "https://tsue.uz/oz/news/tdiu-vakillari-uxan-universiteti-yozgi-maktab-dasturida-ishtirok-etmoqda",
      title: {
        uz: "Uxan universitetidagi yozgi maktab",
        ru: "Летняя школа Уханьского университета",
        en: "Wuhan University summer school"
      }
    }
  ]
} as const;

type FounderCopy = {
  title: string;
  description: string;
  role: string;
  bio: string;
  founders: string;
  linkedIn: string;
  onThisPage: string;
  startupTitle: string;
  startupBody: string;
  explore: string;
  educationTitle: string;
  currentStudies: string;
  educationBody: string;
  graduation: string;
  researchTitle: string;
  researchBody: string;
  coauthor: string;
  publicationDate: string;
  readResearch: string;
  coverageTitle: string;
  coverageBody: string;
  readCoverage: string;
};

export const FOUNDER_COPY: Record<Locale, FounderCopy> = {
  en: {
    title: "Sunnatilla Tursunov | Founder of Manzil Group",
    description: "Sunnatilla Tursunov, founder of Manzil Group and master's student in World Economy at the University of World Economy and Diplomacy. TSUE graduate.",
    role: "Founder of Manzil Group",
    bio: "Sunnatilla Tursunov is the founder of Manzil Group, a startup developing a personal assistant for discovering local businesses and services in Tashkent based on people's preferences. He is currently pursuing a master's degree in World Economy at the University of World Economy and Diplomacy. He completed his undergraduate degree in World Economy and International Economic Relations at Tashkent State University of Economics in July 2026. His published research examines international labor markets and opportunities for citizens of Uzbekistan.",
    founders: "Meet the founders",
    linkedIn: "Connect on LinkedIn",
    onThisPage: "On this page",
    startupTitle: "Building Manzil Group",
    startupBody: "From cafes to car services, Manzil Group is developing a personal assistant to help people find places and services that fit their preferences. It is designed for residents exploring their own neighborhoods, visitors to Tashkent, and anyone looking for a local business in an unfamiliar part of the city.",
    explore: "Explore Manzil",
    educationTitle: "Education",
    currentStudies: "Currently pursuing a master's degree in World Economy at the University of World Economy and Diplomacy.",
    educationBody: "Completed an undergraduate degree in World Economy and International Economic Relations at Tashkent State University of Economics in July 2026.",
    graduation: "July 2026",
    researchTitle: "Published research",
    researchBody: "This co-authored study examines overseas employment opportunities for Uzbek citizens, including migration trends, bilateral labor agreements, and vocational preparation.",
    coauthor: "Co-authored with",
    publicationDate: "29 June 2025",
    readResearch: "Read the research article",
    coverageTitle: "University coverage",
    coverageBody: "Official university articles shared by Sunnatilla Tursunov documenting international learning and internship programs.",
    readCoverage: "Read on the TSUE website"
  },
  uz: {
    title: "Sunnatilla Tursunov | Manzil Group asoschisi",
    description: "Sunnatilla Tursunov — Manzil Group asoschisi, Jahon iqtisodiyoti va diplomatiya universitetining Jahon iqtisodiyoti magistratura yo‘nalishi talabasi, TDIU bitiruvchisi.",
    role: "Manzil Group asoschisi",
    bio: "Sunnatilla Tursunov — Manzil Group asoschisi. Startap odamlarning shaxsiy afzalliklariga mos ravishda Toshkentdagi mahalliy biznes va xizmatlarni topishga yordam beradigan shaxsiy yordamchini ishlab chiqmoqda. U hozirda Jahon iqtisodiyoti va diplomatiya universitetida Jahon iqtisodiyoti yo‘nalishi bo‘yicha magistraturada tahsil olmoqda. 2026-yil iyul oyida Toshkent davlat iqtisodiyot universitetining Jahon iqtisodiyoti va xalqaro iqtisodiy munosabatlar yo‘nalishini tamomlagan. Uning chop etilgan tadqiqoti xalqaro mehnat bozorlari va O‘zbekiston fuqarolari uchun imkoniyatlarga bag‘ishlangan.",
    founders: "Asoschilar bilan tanishing",
    linkedIn: "LinkedIn orqali bog‘lanish",
    onThisPage: "Sahifa bo‘limlari",
    startupTitle: "Manzil Group ustida ishlash",
    startupBody: "Kafelardan tortib avtoservislargacha — Manzil Group odamlarga o‘z afzalliklariga mos joy va xizmatlarni topishda yordam beradigan shaxsiy yordamchini ishlab chiqmoqda. U o‘z mahallasini o‘rganayotgan aholi, Toshkent mehmonlari va shaharning notanish hududida mahalliy biznes izlayotganlar uchun mo‘ljallangan.",
    explore: "Manzilni kashf eting",
    educationTitle: "Ta’lim",
    currentStudies: "Hozirda Jahon iqtisodiyoti va diplomatiya universitetida Jahon iqtisodiyoti yo‘nalishi bo‘yicha magistraturada tahsil olmoqda.",
    educationBody: "2026-yil iyul oyida Toshkent davlat iqtisodiyot universitetining Jahon iqtisodiyoti va xalqaro iqtisodiy munosabatlar yo‘nalishini tamomlagan.",
    graduation: "2026-yil iyul",
    researchTitle: "Chop etilgan tadqiqot",
    researchBody: "Hammualliflikdagi ushbu tadqiqot O‘zbekiston fuqarolarining xorijda ish bilan band bo‘lish imkoniyatlarini, jumladan migratsiya tendensiyalari, ikki tomonlama mehnat shartnomalari va kasbiy tayyorgarlikni o‘rganadi.",
    coauthor: "Hammuallif",
    publicationDate: "2025-yil 29-iyun",
    readResearch: "Ilmiy maqolani o‘qish",
    coverageTitle: "Universitet xabarlari",
    coverageBody: "Sunnatilla Tursunov ulashgan xalqaro ta’lim va amaliyot dasturlari haqidagi universitetning rasmiy maqolalari.",
    readCoverage: "TDIU saytida o‘qish"
  },
  ru: {
    title: "Sunnatilla Tursunov | Основатель Manzil Group",
    description: "Sunnatilla Tursunov — основатель Manzil Group, магистрант по мировой экономике Университета мировой экономики и дипломатии и выпускник ТГЭУ.",
    role: "Основатель Manzil Group",
    bio: "Sunnatilla Tursunov — основатель Manzil Group, стартапа, который разрабатывает персонального помощника для поиска местных компаний и услуг в Ташкенте с учётом предпочтений человека. Сейчас он обучается в магистратуре по направлению «Мировая экономика» в Университете мировой экономики и дипломатии. В июле 2026 года он завершил обучение по направлению «Мировая экономика и международные экономические отношения» в Ташкентском государственном экономическом университете. Его опубликованное исследование посвящено международным рынкам труда и возможностям для граждан Узбекистана.",
    founders: "Познакомиться с основателями",
    linkedIn: "Связаться в LinkedIn",
    onThisPage: "На этой странице",
    startupTitle: "Создание Manzil Group",
    startupBody: "От кафе до автосервисов — Manzil Group разрабатывает персонального помощника, который помогает находить места и услуги с учётом предпочтений человека. Он предназначен для жителей, изучающих свой район, гостей Ташкента и тех, кто ищет местные компании в незнакомой части города.",
    explore: "Открыть Manzil",
    educationTitle: "Образование",
    currentStudies: "Сейчас обучается в магистратуре по направлению «Мировая экономика» в Университете мировой экономики и дипломатии.",
    educationBody: "В июле 2026 года завершил обучение по направлению «Мировая экономика и международные экономические отношения» в Ташкентском государственном экономическом университете.",
    graduation: "Июль 2026",
    researchTitle: "Опубликованное исследование",
    researchBody: "Исследование, подготовленное в соавторстве, рассматривает возможности трудоустройства граждан Узбекистана за рубежом, включая миграционные тенденции, двусторонние трудовые соглашения и профессиональную подготовку.",
    coauthor: "Соавтор",
    publicationDate: "29 июня 2025 года",
    readResearch: "Прочитать научную статью",
    coverageTitle: "Публикации университета",
    coverageBody: "Официальные статьи университета о международных образовательных программах и стажировках, которыми поделился Sunnatilla Tursunov.",
    readCoverage: "Читать на сайте ТГЭУ"
  }
};
