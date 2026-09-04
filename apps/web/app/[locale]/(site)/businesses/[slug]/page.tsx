import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/json-ld";
import { formatHours } from "../../../../lib/api-text";
import { pageMetadata, ROUTE_SEO } from "../../../../lib/seo";
import { localBusinessSchema, routeBreadcrumb } from "../../../../lib/structured-data";
import { AiSummaryBlock } from "../../../../components/ai-summary-block";
import { BadgeRow } from "../../../../components/badge-chip";
import {
  SaveBusinessGhostButton,
  ShareBusinessButton
} from "../../../../components/business-action-buttons";
import { BusinessHeroGallery } from "../../../../components/business-hero-gallery";
import { ClaimForm } from "../../../../components/claim-form";
import { VisitPing } from "../../../../components/crm/visit-ping";
import { LiveStatusDetails } from "../../../../components/live-status-pill";
import { Reveal } from "../../../../components/motion/reveal";
import { QualityScoreCard } from "../../../../components/quality-score-card";
import { ReviewForm } from "../../../../components/review-form";
import { ReviewList } from "../../../../components/review-list";
import { CategoryChip, TagChip } from "../../../../components/vm/chips";
import { Icon } from "../../../../components/vm/icons";
import { PrimaryCta } from "../../../../components/vm/primary-cta";
import { RatingLine } from "../../../../components/vm/rating-line";
import { getBusiness, getBusinessPhotos, getCategories } from "../../../../lib/api";
import { getPublicAnnouncements, type CrmAnnouncement } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatReviewCount } from "../../../../lib/format";
import { formatCount, pickLocalized } from "../../../../lib/locale-text";

function isCurrentlyPublished(item: CrmAnnouncement): boolean {
  return item.status === "published";
}

/**
 * The one route whose metadata already worked. Extended rather than replaced:
 * the title and description stay as they were (minus the manual "| Manzil",
 * which the root title template now appends), and it gains the canonical,
 * hreflang, Open Graph and Twitter tags every page was missing.
 *
 * The description falls back to a composed one-liner from real fields when a
 * business has no written description — an empty meta description is a wasted
 * snippet, and address + district + price tier are facts already on the page.
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const profile = await getBusiness(slug).catch(() => null);

  if (!profile) {
    return { title: ROUTE_SEO.notFound.title[locale], robots: { index: false, follow: false } };
  }

  const { business } = profile;
  const description =
    business.description[locale] ??
    business.description.uz ??
    `${business.name} — ${business.district}, ${business.city}. ${business.priceTier}`;

  return pageMetadata({
    locale,
    path: `/businesses/${business.slug}`,
    title: business.name,
    description,
    images: business.coverPhotoUrl ? [business.coverPhotoUrl] : undefined
  });
}

export default async function BusinessProfilePage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const copy = getUiCopy(locale);
  const profile = await getBusiness(slug).catch(() => null);

  if (!profile) {
    notFound();
  }

  const { business, reviews } = profile;
  const [photos, categories, announcementsData] = await Promise.all([
    getBusinessPhotos(slug),
    getCategories().catch(() => []),
    getPublicAnnouncements(slug).catch(() => null)
  ]);

  const category = categories.find((item) => item.slug === business.categorySlug);
  const publishedAnnouncements = (announcementsData?.announcements ?? []).filter(isCurrentlyPublished);
  const campaigns = publishedAnnouncements.filter((item) => item.kind === "discount");
  const announcements = publishedAnnouncements.filter((item) => item.kind !== "discount");
  const crmCopy = getCrmCopy(locale).announcements;

  // External navigation is not CSP-constrained (only embedded resources are),
  // so directions can hand off to the user's map app. Coordinates when the
  // API has them, the postal address otherwise.
  const directionsHref =
    business.lat != null && business.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${business.address}, ${business.district}, ${business.city}`
        )}`;

  // Only real, approved photos plus a real cover reach the schema — never a
  // placeholder or a gradient stand-in.
  const schemaImages = [
    ...(business.coverPhotoUrl ? [business.coverPhotoUrl] : []),
    ...photos
  ];

  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema({ business, locale, reviews, images: schemaImages }),
          routeBreadcrumb(locale, ["home", "discover"], {
            name: business.name,
            path: `/businesses/${business.slug}`
          })
        ]}
      />
      <VisitPing slug={business.slug} />
      <div className="container-xxl biz-page">
        <Reveal variant="fade-up">
          <BusinessHeroGallery
            countLabel={photos.length > 0 ? copy.business.photoCount(photos.length) : null}
            initial={business.name.charAt(0).toUpperCase()}
            name={business.name}
            photos={photos}
          />
        </Reveal>

        <div className="biz-layout">
          <div className="biz-main">
            <Reveal variant="fade-up">
              <header className="biz-head">
                <div className="biz-head__chips">
                  {category ? (
                    <CategoryChip href={`/${locale}/discover?category=${business.categorySlug}`}>
                      {pickLocalized(category.name, locale)}
                    </CategoryChip>
                  ) : null}
                  {business.tags.map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
                <h1 className="display-1 biz-head__title">{business.name}</h1>
                <div className="biz-head__meta">
                  <span className="biz-head__meta-item">
                    <RatingLine
                      avgRating={business.avgRating}
                      locale={locale}
                      reviewCount={business.reviewCount}
                    />
                  </span>
                  <span className="biz-head__meta-item">
                    <span className="vm-price-tier">{business.priceTier}</span>
                  </span>
                  <span className="biz-head__meta-item">
                    <Icon name="location" size={16} />
                    {business.district}
                  </span>
                  {/* hours is a free-form string; the optional live label is the
                      only "current" signal — open/closed is never computed. */}
                  <span className="biz-head__meta-item">
                    <Icon name="schedule" size={16} />
                    {business.liveStatus
                      ? pickLocalized(business.liveStatus.label, locale)
                      : formatHours(business.hours, locale)}
                  </span>
                  {business.status === "claimed" ? (
                    <span className="biz-head__meta-item biz-head__verified">
                      <Icon name="verified" size={16} />
                      {copy.business.verified}
                    </span>
                  ) : null}
                </div>
                <p className="biz-head__desc">
                  {business.description[locale] ?? business.description.uz}
                </p>
                {business.socialProof ? (
                  <div className="biz-head__proof">
                    <span>
                      {business.socialProof.friendsVisited} {copy.business.friendsVisited}
                    </span>
                    <span>
                      {formatCount(business.socialProof.bookmarkedCount)} {copy.business.bookmarks}
                    </span>
                    {business.socialProof.orderedToday ? (
                      <span>
                        {business.socialProof.orderedToday} {copy.business.ordersToday}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </header>
            </Reveal>

            <Reveal variant="fade-up">
              <section aria-labelledby="offers-title" className="biz-card biz-updates">
                <header className="biz-card__head">
                  <h2 className="h3 biz-card__title" id="offers-title">
                    {crmCopy.campaignsTitle}
                  </h2>
                </header>
                {campaigns.length > 0 ? (
                  <div className="biz-updates__list">
                    {campaigns.map((item) => (
                      <article className="biz-update" key={item.id}>
                        <h3 className="h4 biz-update__title">{item.title}</h3>
                        {item.discountPercent != null ? (
                          <p className="biz-update__meta">
                            {crmCopy.percentOffMeta.replace("{n}", String(item.discountPercent))}
                          </p>
                        ) : null}
                        <p className="biz-update__body">{item.body}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="biz-card__sub">{crmCopy.emptyCampaigns}</p>
                )}
              </section>
            </Reveal>

            <Reveal variant="fade-up">
              <section aria-labelledby="announcements-title" className="biz-card biz-updates">
                <header className="biz-card__head">
                  <h2 className="h3 biz-card__title" id="announcements-title">
                    {crmCopy.updatesTitle}
                  </h2>
                </header>
                {announcements.length > 0 ? (
                  <div className="biz-updates__list">
                    {announcements.map((item) => (
                      <article className="biz-update" key={item.id}>
                        <h3 className="h4 biz-update__title">{item.title}</h3>
                        <p className="biz-update__body">{item.body}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="biz-card__sub">{crmCopy.emptyUpdates}</p>
                )}
              </section>
            </Reveal>

            {business.insight ? (
              <Reveal variant="fade-up">
                <AiSummaryBlock insight={business.insight} locale={locale} />
              </Reveal>
            ) : null}

            {business.qualityScore ? (
              <Reveal variant="fade-up">
                <QualityScoreCard locale={locale} score={business.qualityScore} />
              </Reveal>
            ) : null}

            <Reveal variant="fade-up">
              <section aria-labelledby="experience-feed-title" className="biz-card biz-feed">
                <header className="biz-card__head">
                  <h2 className="h3 biz-card__title" id="experience-feed-title">
                    {copy.business.experienceFeed}
                  </h2>
                  {reviews.length > 0 ? (
                    <span className="biz-card__hint">{formatReviewCount(reviews.length, locale)}</span>
                  ) : null}
                </header>
                <ReviewList locale={locale} reviews={reviews} />
              </section>
            </Reveal>

            <Reveal variant="fade-up">
              <section className="biz-card biz-write">
                <header className="biz-card__head">
                  <div>
                    <h2 className="h3 biz-card__title">{copy.business.writeTitle}</h2>
                    <p className="biz-card__sub">{copy.business.writeBody}</p>
                  </div>
                </header>
                <ReviewForm businessSlug={business.slug} locale={locale} />
              </section>
            </Reveal>
          </div>

          <aside className="biz-rail">
            <Reveal variant="fade-up">
              <section className="biz-card biz-action">
                {/* Gurman is mobile-first; this public CTA only collects waitlist interest. */}
                <PrimaryCta className="biz-action__cta" href={`/${locale}/waitlist/gurman`}>
                  <Icon name="sparkles" size={18} />
                  {copy.business.askGurman}
                </PrimaryCta>
                <div className="biz-action__buttons">
                  <SaveBusinessGhostButton businessSlug={business.slug} locale={locale} />
                  <ShareBusinessButton locale={locale} name={business.name} />
                </div>
                <div className="biz-address">
                  <Icon className="biz-address__icon" name="location" size={20} />
                  <div>
                    <p className="biz-address__line">{business.address}</p>
                    <p className="biz-address__line biz-address__line--muted">
                      {business.district}, {copy.brand.city}
                    </p>
                    <a
                      className="biz-address__directions"
                      href={directionsHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {copy.business.getDirections}
                      <Icon name="arrow_forward" size={14} />
                    </a>
                  </div>
                </div>
                {/* Styled placeholder: CSP blocks external tile servers, so no
                    fake map imagery — directions above are the real affordance. */}
                <div aria-hidden="true" className="biz-map">
                  <Icon name="location" size={28} />
                  <span className="biz-map__label">{business.district}</span>
                </div>
              </section>
            </Reveal>

            <Reveal delay={90} variant="fade-up">
              <section className="biz-card biz-info">
                <header className="biz-card__head">
                  <h2 className="h3 biz-card__title">{copy.business.infoTitle}</h2>
                </header>
                <div className="biz-info__rows">
                  <div className="biz-info__row">
                    <Icon className="biz-info__icon" name="schedule" size={18} />
                    <div>
                      <span className="visually-hidden">{copy.business.hoursLabel}</span>
                      <p className="biz-info__value">{formatHours(business.hours, locale)}</p>
                      {business.liveStatus ? (
                        <LiveStatusDetails locale={locale} status={business.liveStatus} />
                      ) : null}
                    </div>
                  </div>
                  {business.phone ? (
                    <div className="biz-info__row">
                      <Icon className="biz-info__icon" name="call" size={18} />
                      <div>
                        <span className="visually-hidden">{copy.business.phoneLabel}</span>
                        <a className="biz-info__link" href={`tel:${business.phone}`}>
                          {business.phone}
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            </Reveal>

            {business.badges?.length ? (
              <Reveal delay={140} variant="fade-up">
                <section className="biz-card biz-highlights">
                  <header className="biz-card__head">
                    <h2 className="h3 biz-card__title">{copy.business.highlightsTitle}</h2>
                  </header>
                  <BadgeRow badges={business.badges} limit={12} locale={locale} />
                </section>
              </Reveal>
            ) : null}
          </aside>
        </div>

        <Reveal variant="fade-up">
          <section className="biz-claim">
            <div>
              <p className="biz-claim__kicker">{copy.business.claimKicker}</p>
              <h2 className="h2 biz-claim__title">{copy.business.claimTitle}</h2>
              <p className="biz-claim__body">{copy.business.claimBody}</p>
            </div>
            <ClaimForm businessName={business.name} businessSlug={business.slug} locale={locale} />
          </section>
        </Reveal>
      </div>
    </>
  );
}
