import type { Locale } from "@manzil/shared";

/**
 * Shared i18n formatting helpers for the Vibrant Marketplace kit (task K).
 *
 * Everything here is pure and locale-driven: no fetches, no fabricated data.
 * Prices exist in the product only as UZS sums the API supplies (D7) — there
 * is no currency conversion and no invented amounts.
 */

/** BCP-47 tags fed to Intl.* constructors; the bare tag rides second so an
 *  ICU build without the regional variant still negotiates the language. */
const INTL_LOCALES: Record<Locale, string[]> = {
  uz: ["uz-Latn-UZ", "uz"],
  ru: ["ru-RU", "ru"],
  en: ["en-US", "en"]
};

export function intlLocale(locale: Locale): string[] {
  return INTL_LOCALES[locale] ?? INTL_LOCALES.uz;
}

/** Grouped integer formatting: 12000 -> "12 000" (uz/ru) / "12,000" (en). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

/** Compact notation for large counts: 1200 -> "1.2K" / "1,2 тыс." */
export function formatCompactNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

// The som suffix is written out per locale rather than delegated to
// Intl's currency display: ICU builds disagree on the UZS symbol
// ("soʻm"/"UZS"/"сум."), and product copy pins one spelling per locale.
const UZS_SUFFIX: Record<Locale, string> = {
  uz: "so'm",
  ru: "сум",
  en: "UZS"
};

/** UZS money line: 250000 -> "250 000 so'm" (NBSP before the suffix). */
export function formatUzs(amount: number, locale: Locale): string {
  return `${formatNumber(amount, locale)} ${UZS_SUFFIX[locale]}`;
}

export type PluralForms = {
  one: string;
  few?: string;
  many?: string;
  other: string;
};

/**
 * CLDR plural selection with a Russian-shaped form set: `few` covers 2-4,
 * `many` covers 5-20/0. Uzbek and English only ever hit `one`/`other`.
 * Missing categories fall back to `other`.
 */
export function selectPlural(count: number, forms: PluralForms, locale: Locale): string {
  const category = new Intl.PluralRules(intlLocale(locale)).select(count);
  if (category === "one") {
    return forms.one;
  }
  if (category === "few") {
    return forms.few ?? forms.other;
  }
  if (category === "many") {
    return forms.many ?? forms.other;
  }
  return forms.other;
}

// Review-count nouns. Uzbek counts with the invariant "ta sharh"; Russian
// declines отзыв; English pluralizes with -s. Matches the shipped copy in
// @manzil/shared ui-copy ("ta sharh"/"отзывов"/"reviews").
const REVIEW_FORMS: Record<Locale, PluralForms> = {
  uz: { one: "ta sharh", other: "ta sharh" },
  ru: { one: "отзыв", few: "отзыва", many: "отзывов", other: "отзыва" },
  en: { one: "review", other: "reviews" }
};

/** "1 ta sharh" / "3 отзыва" / "12 reviews" — count included. */
export function formatReviewCount(count: number, locale: Locale): string {
  return `${formatNumber(count, locale)} ${selectPlural(count, REVIEW_FORMS[locale], locale)}`;
}

// A brand-new business has no rating; "0.0" would read as a bad score
// rather than an absent one (D3, discover.spec.ts weld).
const NEW_RATING_LABEL: Record<Locale, string> = {
  uz: "Yangi",
  ru: "Новый",
  en: "New"
};

export function newRatingLabel(locale: Locale): string {
  return NEW_RATING_LABEL[locale] ?? NEW_RATING_LABEL.uz;
}

const RELATIVE_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" }
];

/**
 * Localized relative time for review/booking timestamps:
 * "3 kun oldin" / "3 дня назад" / "3 days ago". Empty string on an
 * unparseable date — callers render nothing rather than "Invalid Date".
 */
export function formatRelativeTime(date: string | Date, locale: Locale, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const formatter = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  let duration = (target.getTime() - now.getTime()) / 1000;

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "";
}
