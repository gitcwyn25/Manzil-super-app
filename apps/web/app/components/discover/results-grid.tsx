"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import { useState } from "react";
import { BusinessCard } from "../business-card";
import { Reveal, RevealStagger } from "../motion/reveal";
import { TagChip } from "../vm/chips";
import { RatingLine } from "../vm/rating-line";

/** Client-side chunking: /search returns everything, no pagination exists. */
const CHUNK_SIZE = 9;

/**
 * The promoted first result: a horizontal split card. With the default
 * "Recommended" ordering the first result genuinely is the top
 * recommendation, so promoting it is an honest editorial rule (the search
 * payload has no featured flag — api-map gap). The mock's "Hot Deal" pill,
 * review quote and reviewer avatar are cut: no deals entity, and list
 * payloads carry no reviews join.
 */
function FeaturedResultCard({
  business,
  categoryLabel,
  locale
}: {
  business: BusinessPlatform;
  categoryLabel?: string;
  locale: Locale;
}) {
  const description = business.description[locale] ?? business.description.uz;

  return (
    <article className="vm-featured-card card-interactive">
      <a className="vm-featured-card__link" href={`/${locale}/businesses/${business.slug}`}>
        <span className="vm-featured-card__media">
          {business.coverPhotoUrl ? (
            <img
              alt=""
              className="vm-featured-card__img"
              loading="lazy"
              src={business.coverPhotoUrl}
            />
          ) : (
            <span aria-hidden="true" className="vm-featured-card__initial">
              {business.name.charAt(0)}
            </span>
          )}
        </span>
        <span className="vm-featured-card__body">
          <span className="vm-featured-card__head">
            <span className="vm-featured-card__name">{business.name}</span>
            <RatingLine
              avgRating={business.avgRating}
              className="vm-featured-card__rating"
              locale={locale}
              reviewCount={business.reviewCount}
            />
          </span>
          {description ? <span className="vm-featured-card__desc">{description}</span> : null}
          <span className="vm-featured-card__tags">
            {categoryLabel ? <TagChip>{categoryLabel}</TagChip> : null}
            {business.priceTier ? <TagChip>{business.priceTier}</TagChip> : null}
            {business.district ? <TagChip>{business.district}</TagChip> : null}
          </span>
        </span>
      </a>
    </article>
  );
}

/**
 * The filtered-state results: promoted first card, then the standard grid in
 * client-side chunks with an honest Load More that hides itself when
 * everything is shown. The list arrives already filtered and sorted from the
 * server, so the first chunk is complete in the HTML without JS.
 */
export function ResultsGrid({
  businesses,
  categoryNames,
  loadMoreLabel,
  locale
}: {
  businesses: BusinessPlatform[];
  categoryNames: Record<string, string>;
  loadMoreLabel: string;
  locale: Locale;
}) {
  // Promote only when there is a real field behind it — with one or two
  // results a "featured" treatment would just be noise.
  const featured = businesses.length >= 3 ? businesses[0] : null;
  const rest = featured ? businesses.slice(1) : businesses;

  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const visible = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;

  return (
    <div className="vm-results">
      {featured ? (
        <Reveal variant="fade-up">
          <FeaturedResultCard
            business={featured}
            categoryLabel={categoryNames[featured.categorySlug]}
            locale={locale}
          />
        </Reveal>
      ) : null}

      <RevealStagger className="vm-results-grid" start={80} step={80} variant="scale-in">
        {visible.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </RevealStagger>

      {hasMore ? (
        <button
          className="vm-load-more"
          onClick={() => setVisibleCount((count) => count + CHUNK_SIZE)}
          type="button"
        >
          {loadMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
