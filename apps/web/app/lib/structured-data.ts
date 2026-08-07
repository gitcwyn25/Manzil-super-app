import type { Business, Locale, Review } from "@manzil/shared";
import {
  absoluteUrl,
  BRAND,
  canonicalUrl,
  CRUMB_LABEL,
  PUBLIC_CONTACT,
  ROUTE_SEO,
  SITE_NAME,
  SITE_URL,
  type CrumbKey
} from "./seo";

/**
 * schema.org graph builders.
 *
 * Honesty rule (binding, project-wide): every field here is either read from
 * real API data or is a stable fact about the product. Nothing is estimated,
 * rounded up, or invented. When a value is absent the property is omitted
 * rather than defaulted — an omitted `aggregateRating` costs a rich-result
 * star; a fabricated one is a lie to both users and Google.
 */

export type JsonLdNode = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const ORG_DESCRIPTION: Record<Locale, string> = {
  uz: "Manzil — Toshkentdagi bizneslarni topish, sharhlar va Gurman AI concierge platformasi.",
  ru: "Manzil — платформа для поиска бизнесов Ташкента, отзывов и AI-консьержа Gurman.",
  en: "Manzil is a Tashkent business directory with real reviews and the Gurman AI concierge."
};

/**
 * Publisher entity. `sameAs` lists only channels the company actually
 * operates and already publishes in the site footer — no speculative social
 * profiles, which is what usually poisons an Organization node.
 */
export function organizationSchema(locale: Locale): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: BRAND.name,
    url: SITE_URL,
    description: ORG_DESCRIPTION[locale],
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icons/icon-512.png"),
      width: 512,
      height: 512
    },
    email: PUBLIC_CONTACT.email,
    telephone: PUBLIC_CONTACT.telephone,
    sameAs: [PUBLIC_CONTACT.telegram],
    knowsLanguage: ["uz", "ru", "en"],
    areaServed: {
      "@type": "City",
      name: BRAND.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: BRAND.city,
        addressCountry: BRAND.country
      }
    }
  };
}

/**
 * WebSite node with the SearchAction that lets a search engine offer a
 * sitelinks search box. The target is the real discover route — it already
 * reads `?q=` server-side, so the action resolves to a working page rather
 * than a decorative declaration.
 */
export function websiteSchema(locale: Locale): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl(locale, "/discover")}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList from locale-relative paths. */
export function breadcrumbSchema(locale: Locale, crumbs: Crumb[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(locale, crumb.path)
    }))
  };
}

/**
 * BreadcrumbList built from route keys, so the label and the URL of a trail
 * step can never disagree with the route they point at. `leaf` is for dynamic
 * pages whose last crumb is a record name (a business, a list, an occasion).
 */
export function routeBreadcrumb(
  locale: Locale,
  keys: CrumbKey[],
  leaf?: Crumb
): JsonLdNode {
  const trail: Crumb[] = keys.map((key) => ({
    name: CRUMB_LABEL[key][locale],
    path: ROUTE_SEO[key].path
  }));

  return breadcrumbSchema(locale, leaf ? [...trail, leaf] : trail);
}

/** ItemList for a curated collection page (community list, occasion). */
export function itemListSchema(
  locale: Locale,
  name: string,
  items: Array<{ name: string; slug: string }>
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: canonicalUrl(locale, `/businesses/${item.slug}`)
    }))
  };
}

/**
 * LocalBusiness for a claimed or listed place.
 *
 * Deliberately omitted, with reasons:
 * - `openingHours` / `openingHoursSpecification` — the API stores hours as one
 *   free-form string ("09:00–23:00, dam olish kunlari 10:00 dan"). Parsing it
 *   into a day/time schema would be guessing, and a wrong schedule is worse
 *   than none.
 * - `aggregateRating` when `reviewCount` is 0 — a 0-review rating is not a
 *   rating. Google also rejects it.
 * - `priceRange` is the real `$`/`$$`/`$$$` tier the catalogue stores; no
 *   currency amounts are implied because none are recorded.
 */
export function localBusinessSchema({
  business,
  locale,
  reviews,
  images
}: {
  business: Business;
  locale: Locale;
  reviews: Review[];
  images: string[];
}): JsonLdNode {
  const url = canonicalUrl(locale, `/businesses/${business.slug}`);

  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: business.name,
    url,
    description: business.description[locale] ?? business.description.uz,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressCountry: BRAND.country
    },
    priceRange: business.priceTier,
    isPartOf: { "@id": WEBSITE_ID }
  };

  if (business.lat != null && business.lng != null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: business.lat,
      longitude: business.lng
    };
  }

  if (business.phone) {
    node.telephone = business.phone;
  }

  if (images.length > 0) {
    node.image = images.map((image) =>
      image.startsWith("http") ? image : absoluteUrl(image)
    );
  }

  if (business.reviewCount > 0 && business.avgRating > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: business.avgRating,
      reviewCount: business.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  const publishedReviews = reviews.filter((review) => review.rating > 0).slice(0, 10);
  if (publishedReviews.length > 0) {
    node.review = publishedReviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: review.text,
      datePublished: review.createdAt,
      inLanguage: review.locale
    }));
  }

  return node;
}
