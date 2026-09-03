import { SITE_URL } from "../lib/seo";

/**
 * /llms.txt — the llmstxt.org convention: a single Markdown file that tells an
 * answer engine what this site is, what is on it, and where the canonical
 * pages live, without making it infer all of that from rendered HTML.
 *
 * This path used to have no route and fell through to `/[locale]`, which
 * answered HTTP 500 in production.
 *
 * Everything below is a statement about the product that is true today. It
 * deliberately says what Manzil does *not* do yet (no bookings, no mobile app,
 * Tashkent only) — an answer engine that repeats an overclaim damages trust
 * far more than one that repeats an accurate limitation.
 */

export const revalidate = 86400;

const BODY = `# Manzil

> Manzil is a business directory for Tashkent, Uzbekistan. People find cafés, restaurants, salons and services through real listings and real customer reviews. The site is trilingual: Uzbek (default), Russian and English.

Every page exists at three locale-prefixed URLs: \`/uz/...\` (canonical default), \`/ru/...\` and \`/en/...\`. Replace the locale prefix to get the same page in another language.

## What Manzil is

- A directory of real businesses in Tashkent, each with an address, price tier, category, and customer reviews.
- A business console where owners claim their listing, reply to reviews, and manage their profile.

## What Manzil is not (as of this writing)

- Not a booking or reservation platform — the site does not take bookings.
- Not a delivery service.
- Not available outside Tashkent. Other cities are a waitlist, not a live product.
- Not a published mobile app yet.

## Core pages

- [Home](${SITE_URL}/uz): featured businesses and the Manzil catalogue.
- [Discover](${SITE_URL}/uz/discover): searchable, filterable catalogue of every listed business. Accepts \`?q=\` for a text query and \`?category=\` for a category slug.
- [Community lists](${SITE_URL}/uz/lists): place collections curated by people in Tashkent.
- [Occasions](${SITE_URL}/uz/occasions): places grouped by what they are for — birthdays, dates, family dinners.

## Business detail pages

- URL shape: \`${SITE_URL}/{locale}/businesses/{slug}\`
- Each carries schema.org \`LocalBusiness\` JSON-LD with the real name, description, street address, price tier, and — only when the data exists — coordinates, telephone, photos, aggregate rating and individual reviews.
- Ratings and review counts are never present unless at least one real review exists.
- Opening hours are stored as one free-form string and are shown on the page, but are deliberately not published as structured \`openingHours\`, because parsing them into a schedule would be guesswork.

## For business owners

- [Manzil Business](${SITE_URL}/uz/business): what the owner-facing product does.
- [Pricing](${SITE_URL}/uz/business/pricing): Starter, Growth and Premium plans.

## Machine-readable

- [Sitemap](${SITE_URL}/sitemap.xml)
- [robots.txt](${SITE_URL}/robots.txt) — AI crawlers are explicitly allowed.

## Not for indexing

Authenticated surfaces (\`/{locale}/dashboard\`, \`/{locale}/admin\`, \`/{locale}/profile\`, sign-in and sign-up, business registration) contain per-user data and are disallowed in robots.txt.

## Contact

- Telegram: https://t.me/manzilbiz_bot
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}
