"use client";

import type { Locale } from "@manzil/shared";
import { useRouter } from "next/navigation";

export type SortKey = "recommended" | "rating";

// Only the two honest options ship (D11): "Recommended" orders by
// qualityScore-then-rating, "Highest rated" by rating — both client-side.
// The mock's "Distance" is cut: geolocation is disabled by Permissions-Policy.
const COPY: Record<string, { label: string; recommended: string; rating: string }> = {
  uz: { label: "Saralash:", recommended: "Tavsiya etilgan", rating: "Eng yuqori baho" },
  ru: { label: "Сортировка:", recommended: "Рекомендуемые", rating: "Высокий рейтинг" },
  en: { label: "Sort by:", recommended: "Recommended", rating: "Highest rated" }
};

/**
 * "Sort by:" + chromeless primary-colored select in the results header.
 * Changing it re-navigates with the full current filter set preserved, so the
 * server re-renders the refined list (hidden below sm, per the mock).
 */
export function SortSelect({
  category,
  locale,
  minRating,
  price,
  query,
  sort
}: {
  category: string;
  locale: Locale;
  minRating?: number;
  price?: string;
  query: string;
  sort: SortKey;
}) {
  const t = COPY[locale] ?? COPY.uz;
  const router = useRouter();

  function apply(value: string) {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (category !== "all") {
      params.set("category", category);
    }
    if (price) {
      params.set("price", price);
    }
    if (minRating) {
      params.set("minRating", String(minRating));
    }
    if (value === "rating") {
      params.set("sort", value);
    }
    router.push(`/${locale}/discover?${params.toString()}`);
  }

  return (
    <label className="vm-sort d-none d-sm-inline-flex">
      <span className="vm-sort__label">{t.label}</span>
      <select
        className="vm-sort__select"
        defaultValue={sort}
        onChange={(event) => apply(event.target.value)}
      >
        <option value="recommended">{t.recommended}</option>
        <option value="rating">{t.rating}</option>
      </select>
    </label>
  );
}
