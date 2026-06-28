import type { BusinessBadge, Locale } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

export function BadgeChip({
  badge,
  locale,
  compact = false
}: {
  badge: BusinessBadge;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <span className={compact ? "badge-chip compact" : "badge-chip"}>
      <span aria-hidden="true">{badge.emoji}</span>
      {pickLocalized(badge.label, locale)}
    </span>
  );
}

export function BadgeRow({
  badges,
  locale,
  limit = 4
}: {
  badges?: BusinessBadge[];
  locale: Locale;
  limit?: number;
}) {
  if (!badges?.length) {
    return null;
  }

  return (
    <div className="badge-row">
      {badges.slice(0, limit).map((badge) => (
        <BadgeChip badge={badge} compact key={badge.slug} locale={locale} />
      ))}
    </div>
  );
}
