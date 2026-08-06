import type { Locale } from "@manzil/shared";
import { formatReviewCount, newRatingLabel } from "../../lib/format";
import { Icon } from "./icons";

/**
 * The one canonical rating treatment (D3): tertiary-orange filled star,
 * average to one decimal, localized pluralized review count. A business with
 * `reviewCount === 0` renders the localized "New" chip and NEVER "0.0 ★" —
 * discover.spec.ts welds this rule to `.home-card__rating`, so consumers pass
 * their weld class through `className`.
 */
export function RatingLine({
  avgRating,
  reviewCount,
  locale,
  className,
  showCount = true
}: {
  avgRating: number;
  reviewCount: number;
  locale: Locale;
  className?: string;
  /** false renders the bare star + average (image-overlay chips). */
  showCount?: boolean;
}) {
  const base = className ? `vm-rating ${className}` : "vm-rating";

  if (reviewCount === 0) {
    return <span className={`${base} vm-rating--new`}>{newRatingLabel(locale)}</span>;
  }

  return (
    <span className={base}>
      <Icon className="vm-rating__star" name="star_filled" size={16} />
      <span className="vm-rating__value">{avgRating.toFixed(1)}</span>
      {showCount ? (
        <span className="vm-rating__count">({formatReviewCount(reviewCount, locale)})</span>
      ) : null}
    </span>
  );
}
