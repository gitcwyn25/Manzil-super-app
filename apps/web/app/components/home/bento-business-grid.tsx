import type { Locale } from "@manzil/shared";
import type { HomeCard } from "../../lib/api";
import { categoryName, HomeBusinessCard } from "../home-sections";
import { Reveal } from "../motion/reveal";
import { DealBadge } from "../vm/deal-badge";
import { Icon } from "../vm/icons";
import { PriceTierBadge } from "../vm/price-tier-badge";
import { RatingLine } from "../vm/rating-line";
import { SectionHeader } from "../vm/section-header";

export type BentoCopy = {
  title: string;
  subtitle: string;
  viewAll: string;
  /** Overlay badge on the large slot — rendered ONLY when featured===true. */
  featuredBadge: string;
  partnerTitle: string;
  partnerText: string;
  partnerCta: string;
};

/**
 * The large bento slot: a full-image card with a gradient scrim and the
 * overlay caption stack. Fed by `featured[0] ?? justJoined[0]` (D10) — the
 * badge renders only when the business really carries the featured flag, so
 * a fallback occupant is presented plainly, never dressed up as featured.
 *
 * Welds: `.home-card` on the anchor, `.home-card__rating` on the rating
 * (localized "New" at zero reviews — never "0.0"). The mock's description
 * line is dropped: HomeCard has no description field (api-map gap), and the
 * priceTier glyph is the only price signal (D7).
 */
function FeaturedBusinessCard({
  business,
  locale,
  featuredLabel
}: {
  business: HomeCard;
  locale: Locale;
  featuredLabel: string;
}) {
  return (
    <a
      className="home-card home-featured"
      href={`/${locale}/businesses/${business.slug}`}
    >
      <span aria-hidden="true" className="home-featured__media">
        {business.coverPhotoUrl ? (
          <img alt="" className="home-featured__img" loading="lazy" src={business.coverPhotoUrl} />
        ) : (
          <span className="home-featured__initial">{business.name.charAt(0)}</span>
        )}
      </span>
      <span aria-hidden="true" className="home-featured__scrim" />
      {business.featured ? (
        <DealBadge className="home-featured__flag" label={featuredLabel} variant="tint" />
      ) : null}
      <span className="home-featured__body">
        <span className="home-featured__tags">
          <span className="home-featured__chip">{categoryName(business.category, locale)}</span>
          <PriceTierBadge className="home-featured__price" tier={business.priceTier} variant="plain" />
          <RatingLine
            avgRating={business.avgRating}
            className="home-card__rating"
            locale={locale}
            reviewCount={business.reviewCount}
          />
        </span>
        <span className="home-featured__name">{business.name}</span>
        <span className="home-featured__meta">
          <Icon name="location" size={14} />
          {business.district}
        </span>
      </span>
    </a>
  );
}

/**
 * The owner-acquisition card: the whole card is the /business link, with a
 * button-styled span inside (an anchor cannot nest an anchor). Always
 * renders — it is the one bento slot that needs no data.
 */
function PartnerCtaCard({
  copy,
  locale,
  wide
}: {
  copy: BentoCopy;
  locale: Locale;
  wide?: boolean;
}) {
  return (
    <a
      className={wide ? "home-partner home-partner--wide" : "home-partner"}
      href={`/${locale}/business`}
    >
      <span className="home-partner__copy">
        <span className="home-partner__title">{copy.partnerTitle}</span>
        <span className="home-partner__text">{copy.partnerText}</span>
        <span className="home-partner__btn">
          {copy.partnerCta}
          <Icon name="arrow_forward" size={16} />
        </span>
      </span>
      <Icon className="home-partner__glyph" name="storefront" size={96} />
    </a>
  );
}

/**
 * "Experience the Best" — the bento business grid on the home page, built
 * from real getHomeFeed data (featured-first ranking, deduplicated upstream).
 *
 * Degradation ladder (D10, near-empty prod dataset):
 *   - 2+ businesses: featured slot + up to two standard cards + partner CTA
 *     (the PNG's 4-slot bento).
 *   - 1 business: featured slot + full-width partner CTA.
 *   - 0 businesses: NO .home-sections wrapper (shell-boundary.spec expects a
 *     visible .home-card whenever the wrapper exists) — the partner CTA
 *     stands alone as the section's only card.
 */
export function BentoBusinessGrid({
  businesses,
  copy,
  locale
}: {
  /** Ranked list: featured first, then just-joined, deduplicated by slug. */
  businesses: HomeCard[];
  copy: BentoCopy;
  locale: Locale;
}) {
  const [hero, ...rest] = businesses;
  const standard = rest.slice(0, 2);

  return (
    <section className="vm-best">
      <div className="container">
        <Reveal variant="fade-up">
          <SectionHeader
            subtitle={copy.subtitle}
            title={copy.title}
            viewAllHref={`/${locale}/discover`}
            viewAllLabel={copy.viewAll}
          />
        </Reveal>

        {hero ? (
          <div className="home-sections vm-best__sections">
            <Reveal delay={120} variant="fade-up">
              <div className="home-bento">
                <FeaturedBusinessCard
                  business={hero}
                  featuredLabel={copy.featuredBadge}
                  locale={locale}
                />
                {standard.map((business) => (
                  <HomeBusinessCard
                    business={business}
                    featuredLabel={copy.featuredBadge}
                    key={business.slug}
                    locale={locale}
                  />
                ))}
                <PartnerCtaCard copy={copy} locale={locale} wide={standard.length < 2} />
              </div>
            </Reveal>
          </div>
        ) : (
          <Reveal delay={120} variant="fade-up">
            <PartnerCtaCard copy={copy} locale={locale} wide />
          </Reveal>
        )}
      </div>
    </section>
  );
}
