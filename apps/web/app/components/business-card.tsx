import type { BusinessPlatform, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BadgeRow } from "./badge-chip";
import { SaveBusinessButton } from "./follow-actions";
import { LiveStatusPill } from "./live-status-pill";
import { QualityScoreCompact } from "./quality-score-card";

export function BusinessCard({
  business,
  locale,
  compact = false
}: {
  business: BusinessPlatform;
  locale: Locale;
  compact?: boolean;
}) {
  const copy = getUiCopy(locale);

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
          <span className="rating-badge">
            <span className="star-gold" aria-hidden="true">★</span>
            {business.avgRating} ({business.reviewCount})
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
            <strong>{business.priceTier}</strong>
            {business.qualityScore ? (
              <QualityScoreCompact locale={locale} score={business.qualityScore} />
            ) : (
              <span>{business.reviewCount} {copy.business.reviews}</span>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}
