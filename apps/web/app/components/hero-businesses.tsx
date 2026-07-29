"use client";

import type { Locale } from "@manzil/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeCard } from "../lib/api";

const SLIDE_MS = 5000;

/**
 * Deterministic cover per business.
 *
 * Businesses have no uploaded photography yet, so a slide's backdrop is derived
 * from its slug rather than picked at random: the same business keeps the same
 * cover across renders and between server and client, which a random pick would
 * not. Once real photos land this is the one function to replace.
 */
function coverIndex(slug: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
}

function categoryName(card: HomeCard, locale: Locale): string {
  return locale === "ru"
    ? card.category.nameRu
    : locale === "en"
      ? card.category.nameEn
      : card.category.nameUz;
}

export type HeroBusinessesCopy = {
  /** Screen-reader name for the carousel region. */
  regionLabel: string;
  /**
   * Screen-reader label for a dot, as a pattern containing {n}, e.g.
   * "Show business {n}". Deliberately a string rather than a formatting
   * function: this object is passed from a server component, and a function
   * cannot cross that boundary.
   */
  goToLabel: string;
  newLabel: string;
};

/**
 * The hero backdrop: real businesses, auto-advancing.
 *
 * This replaced an illustrated landscape. A discovery platform's first screen
 * should show its actual inventory — the illustration said nothing true about
 * what is on the platform, and the businesses do.
 *
 * Auto-advance stops on hover, on keyboard focus, when the tab is hidden, and
 * entirely under reduced-motion, where it becomes a manual carousel. Slides are
 * cross-faded rather than slid so the overlaid headline never appears to move.
 */
export function HeroBusinesses({
  businesses,
  locale,
  copy
}: {
  businesses: HomeCard[];
  locale: Locale;
  copy: HeroBusinessesCopy;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const advance = useCallback(() => {
    setIndex((current) => (current + 1) % businesses.length);
  }, [businesses.length]);

  useEffect(() => {
    if (businesses.length < 2 || paused || reducedRef.current) {
      return;
    }

    const id = window.setInterval(() => {
      // A background tab still fires intervals; advancing there burns through
      // every slide unseen, so the user returns to an arbitrary one.
      if (document.visibilityState === "visible") {
        advance();
      }
    }, SLIDE_MS);

    return () => window.clearInterval(id);
  }, [advance, businesses.length, paused]);

  if (businesses.length === 0) {
    return <div aria-hidden="true" className="hb-root hb-root--empty" />;
  }

  return (
    <div
      aria-label={copy.regionLabel}
      aria-roledescription="carousel"
      className="hb-root"
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="group"
    >
      {businesses.map((business, i) => (
        <a
          aria-hidden={i === index ? undefined : "true"}
          className={`hb-slide hb-cover-${coverIndex(business.slug, 6)}${i === index ? " is-active" : ""}`}
          href={`/${locale}/businesses/${business.slug}`}
          key={business.slug}
          tabIndex={i === index ? undefined : -1}
        >
          {business.coverPhotoUrl ? (
            <img
              alt=""
              className="hb-slide__cover-img"
              loading="lazy"
              src={business.coverPhotoUrl}
            />
          ) : null}
          <span className="hb-slide__meta">
            <span className="hb-slide__name">{business.name}</span>
            <span className="hb-slide__sub">
              {categoryName(business, locale)} · {business.district}
            </span>
            <span className="hb-slide__rating">
              {business.reviewCount > 0
                ? `${business.avgRating.toFixed(1)} ★ (${business.reviewCount})`
                : copy.newLabel}
            </span>
          </span>
        </a>
      ))}

      {businesses.length > 1 ? (
        <div className="hb-dots">
          {businesses.map((business, i) => (
            <button
              aria-current={i === index ? "true" : undefined}
              aria-label={copy.goToLabel.replace("{n}", String(i + 1))}
              className={i === index ? "hb-dot is-active" : "hb-dot"}
              key={business.slug}
              onClick={() => setIndex(i)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
