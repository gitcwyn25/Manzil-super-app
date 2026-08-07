import type { Locale } from "@manzil/shared";

/**
 * Localisation for strings the API produces in English regardless of the
 * requested locale.
 *
 * The API's business mapper substitutes the literal `"Hours not listed"` when a
 * listing has no opening-hours record
 * (`apps/api/.../database.repository.ts`). On the Uzbek business page that
 * renders as one English sentence in the middle of Uzbek copy — the trust
 * audit flagged it, and `apps/api` is owned by another workstream, so the fix
 * lands here: recognise the sentinel and say the same thing in the visitor's
 * language.
 *
 * This is translation of a known constant, not invention: when the API says it
 * has no hours, the page says it has no hours.
 */

const HOURS_NOT_LISTED = "Hours not listed";

const HOURS_UNKNOWN: Record<Locale, string> = {
  uz: "Ish vaqti ko'rsatilmagan",
  ru: "Часы работы не указаны",
  en: "Hours not listed"
};

export function formatHours(hours: string | null | undefined, locale: Locale): string {
  const value = (hours ?? "").trim();

  if (!value || value === HOURS_NOT_LISTED) {
    return HOURS_UNKNOWN[locale];
  }

  return value;
}

/** True when the API has real opening hours for this listing. */
export function hasRealHours(hours: string | null | undefined): boolean {
  const value = (hours ?? "").trim();
  return Boolean(value) && value !== HOURS_NOT_LISTED;
}
