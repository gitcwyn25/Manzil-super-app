"use client";

import type { Locale } from "@manzil/shared";

interface Landmark {
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  image: string;
  badge: Record<Locale, string>;
}

const TASHKENT_LANDMARKS: Landmark[] = [
  {
    title: {
      uz: "Chorsu Bozori",
      ru: "Базар Чорсу",
      en: "Chorsu Bazaar"
    },
    subtitle: {
      uz: "Asriy moviy gumbaz ostidagi sharqona bozor muhiti va milliy lazzatlar.",
      ru: "Колоритный восточный базар под куполом с многовековой историей.",
      en: "Iconic blue-domed bazaar filled with traditional spices and street food."
    },
    image: "/discover/sky-chorsu.jpg",
    badge: {
      uz: "Qadimiy Bozor",
      ru: "История",
      en: "Historic Market"
    }
  },
  {
    title: {
      uz: "Hazrati Imom Majmuasi",
      ru: "Комплекс Хазрати Имам",
      en: "Hazrati Imam Complex"
    },
    subtitle: {
      uz: "Usmon Qur'oni saqlanadigan asriy ma'naviy va me'moriy markaz.",
      ru: "Духовный центр Ташкента, где хранится древний Коран Усмана.",
      en: "Spiritual epicenter of Tashkent and home to the ancient Quran of Uthman."
    },
    image: "/discover/tashkent-madrasah.png",
    badge: {
      uz: "Ma'naviy Meros",
      ru: "Наследие",
      en: "UNESCO Heritage"
    }
  },
  {
    title: {
      uz: "Temuriylar Tarixi Muzeyi",
      ru: "Музей Истории Тимуридов",
      en: "Amir Timur Museum"
    },
    subtitle: {
      uz: "Moviy gumbaz va Amir Temur saltanatining nodir eksponatlari.",
      ru: "Уникальные артефакты эпохи Темуридов в сердце столицы.",
      en: "Architectural dome housing rare artifacts of the Timurid dynasty."
    },
    image: "/discover/temur-museum.png",
    badge: {
      uz: "Muzey & San'at",
      ru: "Музей",
      en: "Culture & Arts"
    }
  },
  {
    title: {
      uz: "Toshkent Metropoliteni",
      ru: "Ташкентский Метрополитен",
      en: "Tashkent Metro"
    },
    subtitle: {
      uz: "Sharqning birinchi va eng go'zal marmar ustunli yerosti saroyi.",
      ru: "Шедевр подземной архитектуры с мраморными колоннами и мозаикой.",
      en: "Central Asia's first subway, famed for marble columns and blue mosaics."
    },
    image: "/discover/tashkent-metro.png",
    badge: {
      uz: "Arxitektura",
      ru: "Метро",
      en: "Underground Art"
    }
  }
];

export function ExploreTashkentCompact({ locale }: { locale: Locale }) {
  return (
    <section className="explore-tashkent-compact container" aria-label="Toshkent madaniyati va merosi">
      <div className="explore-tashkent-compact__header">
        <div>
          <div className="explore-tashkent-compact__eyebrow">
            <span>🏛️</span>
            <span>{locale === "uz" ? "Poytaxt nafasi" : locale === "ru" ? "Атмосфера столицы" : "Explore Tashkent"}</span>
          </div>
          <h2 className="explore-tashkent-compact__title">
            {locale === "uz"
              ? "Toshkentning unutilmas ramzlari"
              : locale === "ru"
              ? "Знаковые места Ташкента"
              : "Iconic Landmarks & Soul of Tashkent"}
          </h2>
        </div>
        <p className="explore-tashkent-compact__desc">
          {locale === "uz"
            ? "Zamonaviy shahar hayoti va 2200 yillik qadimiy Ipak yo'li merosi uyg'unlashgan go'shalar."
            : locale === "ru"
            ? "Гармония современного ритма мегаполиса и 2200-летней истории Шёлкового пути."
            : "A blend of cosmopolitan life and over 2,200 years of Silk Road heritage."}
        </p>
      </div>

      <div className="explore-tashkent-compact__grid">
        {TASHKENT_LANDMARKS.map((item, idx) => (
          <div key={idx} className="landmark-card">
            <div className="landmark-card__media">
              <img alt={item.title[locale] ?? item.title.en} className="landmark-card__img" loading="lazy" src={item.image} />
              <div className="landmark-card__overlay" />
              <span className="landmark-card__badge">{item.badge[locale] ?? item.badge.en}</span>
            </div>
            <div className="landmark-card__body">
              <h3 className="landmark-card__name">{item.title[locale] ?? item.title.en}</h3>
              <p className="landmark-card__desc">{item.subtitle[locale] ?? item.subtitle.en}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
