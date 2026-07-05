import type { Locale } from "@manzil/shared";
import { API_BASE_URL } from "./api-base-url";

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
    const res = await fetch(`${API_BASE_URL}/plans`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const payload = await res.json();
    return (payload.data?.plans ?? []) as ApiPlan[];
  } catch {
    return [];
  }
}

/** Formats a UZS amount with locale-appropriate grouping (e.g. "399 000 so'm"). */
export function formatPrice(amount: number, currency: string, locale: Locale): string {
  const grouped = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(amount);
  const unit = currency === "UZS" ? (locale === "ru" ? "сум" : locale === "en" ? "UZS" : "so'm") : currency;
  return `${grouped} ${unit}`;
}
