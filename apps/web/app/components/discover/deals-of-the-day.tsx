"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import { OfferCarousel, type Offer } from "@/components/ui/offer-carousel";
import { pickLocalized } from "../../lib/locale-text";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  restaurants: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
  cafes: "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800",
  beauty: "https://images.pexels.com/photos/3738368/pexels-photo-3738368.jpeg?auto=compress&cs=tinysrgb&w=800",
  auto: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  repairs: "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=800",
  resort: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800",
  entertainment: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=800",
  shopping: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800"
};

function resolveImage(business: BusinessPlatform) {
  return business.coverPhotoUrl?.trim() || CATEGORY_FALLBACK_IMAGES[business.categorySlug] || CATEGORY_FALLBACK_IMAGES.restaurants;
}

function getTag(locale: Locale) {
  return locale === "uz" ? "Bugungi tanlov" : locale === "ru" ? "Выбор дня" : "Today's pick";
}

function getTagline(locale: Locale) {
  return locale === "uz"
    ? "Bugun sinab ko'rishga arziydigan mahalliy maskanlar"
    : locale === "ru"
    ? "Местные места, которые стоит попробовать сегодня"
    : "Local places worth trying today";
}

function toOffer(business: BusinessPlatform, locale: Locale): Offer {
  const imageSrc = resolveImage(business);
  const description = pickLocalized(business.description, locale) || business.name;

  return {
    id: business.id || business.slug,
    imageSrc,
    imageAlt: business.name,
    tag: getTag(locale),
    title: business.name,
    description,
    brandLogoSrc: imageSrc,
    brandName: business.district || "Manzil",
    href: "/" + locale + "/businesses/" + business.slug
  };
}

export function DealsOfTheDay({
  businesses,
  locale
}: {
  businesses: BusinessPlatform[];
  locale: Locale;
}) {
  const offers = businesses.slice(0, 5).map((business) => toOffer(business, locale));

  if (offers.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="deals-of-the-day-title"
      className="deals-of-the-day container"
    >
      <div className="deals-of-the-day__header">
        <div>
          <div className="deals-of-the-day__eyebrow">
            <span aria-hidden="true">🏷️</span>
            <span>{getTag(locale)}</span>
          </div>
          <h2 className="deals-of-the-day__title" id="deals-of-the-day-title">
            Deals of the day
          </h2>
        </div>
        <p className="deals-of-the-day__tagline">{getTagline(locale)}</p>
      </div>

      <OfferCarousel aria-label="Deals of the day" offers={offers} />
    </section>
  );
}
