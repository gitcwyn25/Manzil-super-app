import type { BusinessPlatform, Locale } from "@manzil/shared";
import { formatReviewCount } from "../lib/format";
import { BadgeRow } from "./badge-chip";
import { SaveBusinessButton } from "./follow-actions";
import { LiveStatusPill } from "./live-status-pill";
import { QualityScoreCompact } from "./quality-score-card";
import { PriceTierBadge } from "./vm/price-tier-badge";
import { RatingLine } from "./vm/rating-line";

export function BusinessCard({
  business,
  locale,
  compact = false
}: {
  business: BusinessPlatform;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "business-card compact" : "business-card"}>
      <a href={`/${locale}/businesses/${business.slug}`} aria-label={`${business.name} profilini ochish`}>
        <div className={`business-photo photo-block photo-${business.photo}`}>
          {business.coverPhotoUrl ? (
            <img
              alt=""
              className="business-photo__cover"
              loading="lazy"
              src={business.coverPhotoUrl}
            />
          ) : null}
          <span className="save-action-wrap">
            <SaveBusinessButton businessSlug={business.slug} locale={locale} />
          </span>
          {/* The overlay chip carries the bare star + average; the count (or
              the localized "New" state at 0 reviews) is RatingLine's rule. */}
          <span className="rating-badge">
            <RatingLine
              avgRating={business.avgRating}
              locale={locale}
              reviewCount={business.reviewCount}
              showCount={false}
            />
          </span>
          {business.liveStatus ? (
            <span className="live-badge is-live">
              <LiveStatusPill compact locale={locale} status={business.liveStatus} />
            </span>
          ) : (
            <span className="status-chip">{business.tags[0]}</span>
          )}
        </div>
        <div className="business-body">
          <h3>{business.name}</h3>
          <p className="business-meta">
            {business.district} · {business.description[locale] ?? business.description.uz}
          </p>
          <BadgeRow badges={business.badges} limit={compact ? 2 : 3} locale={locale} />
          <div className="business-footer">
            <PriceTierBadge tier={business.priceTier} variant="plain" />
            {business.qualityScore ? (
              <QualityScoreCompact locale={locale} score={business.qualityScore} />
            ) : business.reviewCount > 0 ? (
              <span>{formatReviewCount(business.reviewCount, locale)}</span>
            ) : null}
          </div>
        </div>
      </a>
    </article>
  );
}
