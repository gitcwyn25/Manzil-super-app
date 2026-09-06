"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import type { Locale } from "@manzil/shared";
import "./features-01.css";

type FeatureId = "overview" | "services" | "marketing" | "customers" | "bookings";
type FeatureIconName = "overview" | "services" | "marketing" | "customers" | "bookings";

type Feature = {
  id: FeatureId;
  title: string;
  description: string;
  icon: FeatureIconName;
  image: string;
  width: number;
  height: number;
};

type FeatureContent = {
  badge: string;
  title: string;
  subtitle: string;
  ariaLabel: string;
  features: Feature[];
};

const ASSET_ROOT = "/originkit/manzil-business";

const FEATURE_ASSETS: Record<FeatureId, Pick<Feature, "image" | "width" | "height">> = {
  overview: { image: `${ASSET_ROOT}/overview.png`, width: 1222, height: 856 },
  services: { image: `${ASSET_ROOT}/services-prices.png`, width: 1280, height: 672 },
  marketing: { image: `${ASSET_ROOT}/marketing.png`, width: 1280, height: 672 },
  customers: { image: `${ASSET_ROOT}/customers.png`, width: 1280, height: 672 },
  bookings: { image: `${ASSET_ROOT}/bookings.png`, width: 1222, height: 856 }
};

function feature(
  id: FeatureId,
  title: string,
  description: string,
  icon: FeatureIconName
): Feature {
  return { id, title, description, icon, ...FEATURE_ASSETS[id] };
}

const CONTENT: Record<Locale, FeatureContent> = {
  uz: {
    badge: "Biznes vositalari",
    title: "Biznesingizni Manzilda aniqroq boshqaring",
    subtitle:
      "Profil, xizmatlar, marketing va mijozlar oqimini bitta ishonchli ish maydonida ko‘ring.",
    ariaLabel: "Biznes imkoniyatlari",
    features: [
      feature(
        "overview",
        "Umumiy ko‘rinish",
        "Bugungi tashriflar, tushum va faollikni bir ekranda ko‘ring.",
        "overview"
      ),
      feature(
        "services",
        "Xizmatlar va narxlar",
        "Xizmatlaringiz, narx oralig‘ingiz va eng ko‘p buyurtma qilinadigan takliflaringizni yangilang.",
        "services"
      ),
      feature(
        "marketing",
        "Marketing",
        "Aksiyalar va yangiliklarni biznes kontekstini yo‘qotmasdan e’lon qiling.",
        "marketing"
      ),
      feature(
        "customers",
        "Mijozlar",
        "Yakunlangan bronlar va qayd etilgan roziliklar asosida foydali mijozlar ko‘rinishini yarating.",
        "customers"
      ),
      feature(
        "bookings",
        "Bronlar",
        "Telefon va joyida qabul qilingan bronlarni bitta ishonchli joyda saqlang.",
        "bookings"
      )
    ]
  },
  ru: {
    badge: "Инструменты для бизнеса",
    title: "Управляйте бизнесом в Manzil понятнее",
    subtitle:
      "Профиль, услуги, маркетинг и поток клиентов — в одном надёжном рабочем пространстве.",
    ariaLabel: "Возможности для бизнеса",
    features: [
      feature(
        "overview",
        "Обзор бизнеса",
        "Смотрите посещения, выручку и активность за день на одном экране.",
        "overview"
      ),
      feature(
        "services",
        "Услуги и цены",
        "Обновляйте список услуг, диапазоны цен и самые востребованные предложения.",
        "services"
      ),
      feature(
        "marketing",
        "Маркетинг",
        "Публикуйте акции и новости, сохраняя контекст вашего бизнеса.",
        "marketing"
      ),
      feature(
        "customers",
        "Клиенты",
        "Формируйте полезное представление о клиентах по завершённым бронированиям и согласиям.",
        "customers"
      ),
      feature(
        "bookings",
        "Бронирования",
        "Храните телефонные и офлайн-бронирования в одном надёжном месте.",
        "bookings"
      )
    ]
  },
  en: {
    badge: "Business tools",
    title: "Run your business with more clarity",
    subtitle:
      "See your profile, services, marketing, and customer activity in one reliable workspace.",
    ariaLabel: "Business capabilities",
    features: [
      feature(
        "overview",
        "Business overview",
        "See visits, revenue, and activity in one clear view.",
        "overview"
      ),
      feature(
        "services",
        "Services & prices",
        "Keep your public services, price ranges, and best-booked offers up to date.",
        "services"
      ),
      feature(
        "marketing",
        "Marketing",
        "Publish promotions and updates without losing the business context.",
        "marketing"
      ),
      feature(
        "customers",
        "Customers",
        "Build a useful customer view from completed bookings and recorded consent.",
        "customers"
      ),
      feature(
        "bookings",
        "Bookings",
        "Keep phone and walk-in bookings in one reliable place.",
        "bookings"
      )
    ]
  }
};

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const common = {
    fill: "none",
    height: 24,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: 24
  };

  if (name === "overview") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect height="17" rx="2" width="18" x="3" y="4" />
        <path d="M7 15v-3M12 15V8M17 15v-5" />
      </svg>
    );
  }

  if (name === "services") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" />
        <path d="m4 12 8 3.5 8-3.5M4 16.5 12 20l8-3.5" />
      </svg>
    );
  }

  if (name === "marketing") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="m4 11 16-5v10L4 14v-3Z" />
        <path d="M9.5 15.5 8 19h3l1.5-3M20 9v4" />
      </svg>
    );
  }

  if (name === "customers") {
    return (
      <svg aria-hidden="true" {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5M16 5.5a3 3 0 0 1 0 5.8M16 14.7c2.4.1 3.9 1.5 4.5 4.3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <rect height="16" rx="2" width="17" x="3.5" y="5" />
      <path d="M7 3v4M17 3v4M3.5 10h17M7.5 14h3M7.5 17h6" />
    </svg>
  );
}

function FeatureTabVisual({ feature, active }: { feature: Feature; active: boolean }) {
  return (
    <>
      <span className="manzil-features-01__icon-box">
        <FeatureIcon name={feature.icon} />
      </span>
      <span className="manzil-features-01__tab-copy">
        <span className="manzil-features-01__tab-title">{feature.title}</span>
        <span className={`manzil-features-01__tab-description${active ? " is-active" : ""}`}>
          {feature.description}
        </span>
      </span>
    </>
  );
}

export default function Features01({ locale }: { locale: Locale }) {
  const content = CONTENT[locale] ?? CONTENT.uz;
  const [activeId, setActiveId] = useState<FeatureId>("overview");
  const activeFeature = content.features.find((item) => item.id === activeId) ?? content.features[0];

  const selectFeature = (id: FeatureId) => setActiveId(id);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = content.features.findIndex((item) => item.id === activeId);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % content.features.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + content.features.length) % content.features.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = content.features.length - 1;
    } else {
      return;
    }

    const nextId = content.features[nextIndex].id;
    selectFeature(nextId);
    requestAnimationFrame(() => document.getElementById(`manzil-feature-tab-${nextId}`)?.focus());
  };

  return (
    <section className="manzil-features-01" id="features" aria-labelledby="manzil-features-01-heading">
      <div className="manzil-features-01__frame">
        <div className="manzil-features-01__background" aria-hidden="true" />
        <div className="manzil-features-01__content">
          <header className="manzil-features-01__header">
            <span className="manzil-features-01__badge">{content.badge}</span>
            <h2 id="manzil-features-01-heading">{content.title}</h2>
            <p>{content.subtitle}</p>
          </header>

          <div className="manzil-features-01__shell">
            <div
              aria-label={content.ariaLabel}
              aria-orientation="vertical"
              className="manzil-features-01__tabs"
              onKeyDown={handleTabKeyDown}
              role="tablist"
            >
              {content.features.map((feature) => {
                const active = activeId === feature.id;
                return (
                  <button
                    aria-controls="manzil-feature-preview"
                    aria-selected={active}
                    className={`manzil-features-01__tab${active ? " is-active" : ""}`}
                    id={`manzil-feature-tab-${feature.id}`}
                    key={feature.id}
                    onClick={() => selectFeature(feature.id)}
                    role="tab"
                    tabIndex={active ? 0 : -1}
                    type="button"
                  >
                    <FeatureTabVisual active={active} feature={feature} />
                  </button>
                );
              })}
            </div>

            <div
              aria-labelledby={`manzil-feature-tab-${activeFeature.id}`}
              className="manzil-features-01__preview"
              id="manzil-feature-preview"
              role="tabpanel"
            >
              <div aria-hidden="true" className="manzil-features-01__preview-dots" />
              <div className="manzil-features-01__preview-image" key={activeFeature.id}>
                <Image
                  alt={activeFeature.title}
                  className="manzil-features-01__image"
                  height={activeFeature.height}
                  priority={activeFeature.id === "overview"}
                  sizes="(max-width: 1023px) 92vw, 640px"
                  src={activeFeature.image}
                  width={activeFeature.width}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
