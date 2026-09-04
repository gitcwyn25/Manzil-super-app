import type { Locale } from "@manzil/shared";
import { API_BASE_URL } from "./api-base-url";
import { fetchWithTimeout } from "./fetch-with-timeout";

export type ApiPlan = {
  tier: "free" | "pro" | "max";
  name: { uz: string; ru: string; en: string };
  priceMonthly: number;
  priceYearly: number | null;
  currency: string;
  photoLimit: number | null;
  staffLimit: number;
  locationLimit: number;
  features: Array<{ key: string; label: { uz: string; ru: string; en: string }; included: boolean }>;
};

/**
 * Dynamic plan catalogue — pricing is set by admins and served by the API.
 * Revalidates every 60s so admin price edits propagate without a redeploy.
 * Returns [] on failure; callers fall back to static copy.
 */
export async function getPlans(): Promise<ApiPlan[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/plans`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const payload = await res.json();
    return (payload.data?.plans ?? []) as ApiPlan[];
  } catch {
    return [];
  }
}

/**
 * An entitlement key rendered where a human-readable label belongs — e.g.
 * `crm.segments`. Some plan-feature rows in production carry a key but no
 * label, and the API falls back to the key, which then appears verbatim in the
 * Pro and Max columns of the public pricing table in all three languages.
 */
const ENTITLEMENT_KEY = /^[a-z0-9]+(\.[a-z0-9_]+)+$/;

/**
 * Labels for the entitlement keys observed leaking into production. These name
 * capabilities that genuinely exist in the CRM API (`crm.controller.ts` guards
 * `crm.segments` and `crm.campaigns`), so this is a translation of a real
 * feature, not an invented one.
 */
const FEATURE_LABEL_FALLBACK: Record<string, { uz: string; ru: string; en: string }> = {
  "crm.segments": {
    uz: "Mijozlar segmentatsiyasi",
    ru: "Сегментация клиентов",
    en: "Customer segmentation"
  },
  "crm.loyalty": {
    uz: "Sodiqlik dasturi",
    ru: "Программа лояльности",
    en: "Loyalty programme"
  },
  "crm.campaigns": {
    uz: "Mijozlarga kampaniyalar",
    ru: "Кампании для клиентов",
    en: "Customer campaigns"
  }
};

/**
 * Resolves a plan feature to display text, or `null` when it cannot be shown
 * honestly.
 *
 * Dropping a row is deliberate and is the safe direction: a pricing table with
 * one fewer line reads as a shorter plan, while a pricing table containing
 * `crm.loyalty` reads as an unfinished product. Never invent a label for an
 * unrecognised key — if a new entitlement leaks, it disappears from the table
 * until someone gives it real copy.
 */
export function planFeatureLabel(
  feature: { key?: string; label: { uz: string; ru?: string; en?: string } },
  locale: Locale
): string | null {
  const raw = (feature.label?.[locale] ?? feature.label?.uz ?? "").trim();

  if (raw && !ENTITLEMENT_KEY.test(raw)) {
    return raw;
  }

  // Matched by key when the caller has one, otherwise by the leaked key text
  // itself — the label *is* the key in exactly the broken case this handles.
  const fallback =
    (feature.key ? FEATURE_LABEL_FALLBACK[feature.key] : undefined) ?? FEATURE_LABEL_FALLBACK[raw];
  return fallback ? fallback[locale] : null;
}

/** Formats a UZS amount with locale-appropriate grouping (e.g. "399 000 so'm"). */
export function formatPrice(amount: number, currency: string, locale: Locale): string {
  const grouped = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(amount);
  const unit = currency === "UZS" ? (locale === "ru" ? "сум" : locale === "en" ? "UZS" : "so'm") : currency;
  return `${grouped} ${unit}`;
}
