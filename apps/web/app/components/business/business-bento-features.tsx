"use client";

import type { Locale } from "@manzil/shared";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

const BENTO_COPY: Record<
  Locale,
  {
    badge: string;
    title: string;
    subtitle: string;
    cards: {
      tag: string;
      title: string;
      desc: string;
      icon: "storefront" | "sparkles" | "verified" | "chart";
      metric: string;
      metricLabel: string;
    }[];
  }
> = {
  uz: {
    badge: "Biznes Imkoniyatlari",
    title: "Mijozlar oqimi va brend obro'sini oshirish",
    subtitle: "Manzil Biznes Portali sizga mijozlarni jalb qilish va biznesni boshqarish uchun zamonaviy vositalarni taqdim etadi.",
    cards: [
      {
        tag: "Listing Nazorati",
        title: "Biznesingizni rasman tasdiqlang",
        desc: "Kompaniya ma'lumotlari, ish vaqti, menyu, fotosuratlar va telefon raqamlarini o'zingiz to'g'ridan-to'g'ri yangilang.",
        icon: "storefront",
        metric: "01",
        metricLabel: "O'zingiz boshqaring"
      },
      {
        tag: "AI Konsyerj",
        title: "Gurman AI tavsiyalarida ustunlik",
        desc: "Gurman AI foydalanuvchilarga joy tavsiya qilganda sizning tasdiqlangan profilingiz va sharhlaringiz birinchi o'rinda chiqadi.",
        icon: "sparkles",
        metric: "02",
        metricLabel: "Haqiqiy ma'lumotlar"
      },
      {
        tag: "Obro' Himoyasi",
        title: "Sharhlarga rasmiy egasi sifatida javob bering",
        desc: "Mijozlar fikrini qabul qiling, savollarga tezkor javob yo'llang va yuksak xizmat ko'rsatish madaniyatini namoyish eting.",
        icon: "verified",
        metric: "03",
        metricLabel: "Ochiq muloqot"
      },
      {
        tag: "Chuqur Analitika",
        title: "Mijozlar qiziqishini real vaqtda kuzating",
        desc: "Profil ko'rishlar, yo'nalish olishlar, telefon qo'ng'iroqlari va eng faol kunlar haqida batafsil statistika oling.",
        icon: "chart",
        metric: "04",
        metricLabel: "Real faollik"
      }
    ]
  },
  ru: {
    badge: "Возможности для бизнеса",
    title: "Привлекайте клиентов и укрепляйте репутацию",
    subtitle: "Бизнес-портал Manzil предоставляет передовые инструменты для продвижения и управления профилем компании.",
    cards: [
      {
        tag: "Контроль профиля",
        title: "Официально подтвердите компанию",
        desc: "Обновляйте график работы, фотографии, меню и контактные данные в режиме реального времени.",
        icon: "storefront",
        metric: "01",
        metricLabel: "Вы управляете"
      },
      {
        tag: "AI-консьерж",
        title: "Приоритет в рекомендациях Gurman AI",
        desc: "При поиске мест искусственный интеллект рекомендует верифицированные компании с высоким рейтингом в первую очередь.",
        icon: "sparkles",
        metric: "02",
        metricLabel: "Реальные данные"
      },
      {
        tag: "Репутация",
        title: "Отвечайте на отзывы гостей официально",
        desc: "Повышайте лояльность клиентов, оперативно реагируя на отзывы и демонстрируя высокий стандарт сервиса.",
        icon: "verified",
        metric: "03",
        metricLabel: "Открытый диалог"
      },
      {
        tag: "Аналитика",
        title: "Отслеживайте статистику просмотров",
        desc: "Получайте детальные отчеты по просмотрам, маршрутам, звонкам и пиковым часам активности гостей.",
        icon: "chart",
        metric: "04",
        metricLabel: "Реальная активность"
      }
    ]
  },
  en: {
    badge: "Business Features",
    title: "Drive local footfall and build brand trust",
    subtitle: "Manzil Business Portal equips you with modern tools to attract guests and manage your venue profile effortlessly.",
    cards: [
      {
        tag: "Listing Ownership",
        title: "Claim and verify your business",
        desc: "Keep opening hours, photo galleries, menus, and contact information accurately updated in real time.",
        icon: "storefront",
        metric: "01",
        metricLabel: "You stay in control"
      },
      {
        tag: "AI Concierge",
        title: "Priority Gurman AI recommendations",
        desc: "Gurman AI prioritizes verified venues with authentic ratings when suggesting places to local guests.",
        icon: "sparkles",
        metric: "02",
        metricLabel: "Real catalogue data"
      },
      {
        tag: "Reputation Shield",
        title: "Official responses to customer reviews",
        desc: "Build credibility and customer loyalty by responding directly to visitor feedback as the verified business owner.",
        icon: "verified",
        metric: "03",
        metricLabel: "Open responses"
      },
      {
        tag: "Deep Analytics",
        title: "Real-time engagement insights",
        desc: "Track profile impressions, navigation route requests, direct phone dials, and peak visitor activity.",
        icon: "chart",
        metric: "04",
        metricLabel: "Real activity"
      }
    ]
  }
};

export function BusinessBentoFeatures({ locale }: { locale: Locale }) {
  const copy = BENTO_COPY[locale] ?? BENTO_COPY.uz;

  return (
    <section className="clever-section bz-bento-section" id="features">
      <div className="container">
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="sparkles" size={14} />
              <span>{copy.badge}</span>
            </span>
          </Reveal>
          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="clever-heading">{copy.title}</h2>
          </Reveal>
          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-subheading">{copy.subtitle}</p>
          </Reveal>
        </div>

        <div className="clever-benefits__grid">
          {copy.cards.map((card, i) => (
            <Reveal as="div" delay={i * 90} key={card.tag} variant="fade-up">
              <div className="clever-card bz-bento-card">
                <div className="clever-card__head">
                  <div className="clever-icon-box">
                    <Icon name={card.icon} size={22} />
                  </div>
                  <div className="bz-bento-card__metric-box">
                    <span className="bz-bento-card__metric">{card.metric}</span>
                    <span className="bz-bento-card__metric-label">{card.metricLabel}</span>
                  </div>
                </div>

                <span className="clever-card__tag mb-2 d-inline-block">{card.tag}</span>
                <h3 className="clever-card__title">{card.title}</h3>
                <p className="clever-card__desc">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
