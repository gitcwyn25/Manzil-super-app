"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BusinessCard } from "./business-card";
import { useUserPreferences } from "./user-preferences-provider";

export function SavedBusinessesSection({
  locale,
  businesses
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
}) {
  const copy = getUiCopy(locale);
  const { savedBusinessSlugs, ready } = useUserPreferences();
  const saved = businesses.filter((business) => savedBusinessSlugs.includes(business.slug));

  if (!ready) {
    return null;
  }

  if (saved.length === 0) {
    return (
      <div className="empty-state">
        <h3>{copy.profile.savedEmptyTitle}</h3>
        <p>{copy.profile.savedEmptyBody}</p>
      </div>
    );
  }

  return (
    <div className="business-grid">
      {saved.map((business) => (
        <BusinessCard business={business} key={business.id} locale={locale} />
      ))}
    </div>
  );
}
