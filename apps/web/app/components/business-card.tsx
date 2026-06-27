import type { Business, Locale } from "@manzil/shared";

export function BusinessCard({ business, locale }: { business: Business; locale: Locale }) {
  return (
    <article className="business-card">
      <a href={`/${locale}/businesses/${business.slug}`} aria-label={`${business.name} profilini ochish`}>
        <div className={`business-photo photo-block photo-${business.photo}`}>
          <span className="rating-badge">
            {business.avgRating} ({business.reviewCount})
          </span>
          <span className="status-chip">{business.tags[0]}</span>
        </div>
        <div className="business-body">
          <h3>{business.name}</h3>
          <p className="business-meta">
            {business.district} - {business.description[locale] ?? business.description.uz}
          </p>
          <div className="business-footer">
            <strong>{business.priceTier}</strong>
            <span>{business.reviewCount} sharh</span>
          </div>
        </div>
      </a>
    </article>
  );
}
