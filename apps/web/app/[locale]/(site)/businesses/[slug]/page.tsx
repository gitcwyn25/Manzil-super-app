import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiSummaryBlock } from "../../../../components/ai-summary-block";
import { BadgeRow } from "../../../../components/badge-chip";
import { ClaimForm } from "../../../../components/claim-form";
import { SaveBusinessButton } from "../../../../components/follow-actions";
import { LiveStatusDetails } from "../../../../components/live-status-pill";
import { VisitPing } from "../../../../components/crm/visit-ping";
import { Reveal } from "../../../../components/motion/reveal";
import { QualityScoreCard } from "../../../../components/quality-score-card";
import { ReviewForm } from "../../../../components/review-form";
import { ReviewList } from "../../../../components/review-list";
import { formatCount } from "../../../../lib/locale-text";
import { getBusiness } from "../../../../lib/api";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const profile = await getBusiness(slug).catch(() => null);

  if (!profile) {
    return {};
  }

  return {
    title: `${profile.business.name} | Manzil`,
    description: profile.business.description[locale] ?? profile.business.description.uz
  };
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

  return (
    <>
      <VisitPing slug={business.slug} />
      <section className="section-block profile-section">
        <Reveal variant="slide-right">
          <div className="profile-media">
            <div className={`profile-main-photo photo-block photo-${business.photo}`} />
            <div className="profile-side-photo photo-block photo-somsa" />
            <div className="profile-side-photo photo-block photo-coffee" />
          </div>
        </Reveal>
        <div className="profile-copy">
          <p className="section-kicker">{copy.business.profileKicker}</p>
          <h1>{business.name}</h1>
          <div className="rating-line">
            <span className="star-gold" aria-hidden="true">★</span>
            <strong>{business.avgRating}</strong>
            <span>{business.reviewCount} {copy.business.reviews}</span>
            <span>{business.status === "claimed" ? copy.business.verified : copy.business.unclaimed}</span>
            <SaveBusinessButton businessSlug={business.slug} locale={locale} />
          </div>
          <BadgeRow badges={business.badges} locale={locale} />
          <p>{business.description[locale] ?? business.description.uz}</p>
          {business.liveStatus ? <LiveStatusDetails locale={locale} status={business.liveStatus} /> : null}
          {business.socialProof ? (
            <div className="social-proof-row">
              <span>{business.socialProof.friendsVisited} {copy.business.friendsVisited}</span>
              <span>{formatCount(business.socialProof.bookmarkedCount)} {copy.business.bookmarks}</span>
              {business.socialProof.orderedToday ? (
                <span>{business.socialProof.orderedToday} {copy.business.ordersToday}</span>
              ) : null}
            </div>
          ) : null}
          <div className="tag-row">
            {business.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <dl className="profile-facts">
            <div>
              <dt>{copy.business.addressLabel}</dt>
              <dd>{business.address}</dd>
            </div>
            <div>
              <dt>{copy.business.phoneLabel}</dt>
              <dd>{business.phone}</dd>
            </div>
            <div>
              <dt>{copy.business.hoursLabel}</dt>
              <dd>{business.hours}</dd>
            </div>
          </dl>
        </div>
      </section>

      {business.insight ? (
        <section className="section-block">
          <Reveal variant="fade-up">
            <AiSummaryBlock insight={business.insight} locale={locale} />
          </Reveal>
        </section>
      ) : null}

      {business.qualityScore ? (
        <section className="section-block">
          <Reveal variant="fade-up">
            <QualityScoreCard locale={locale} score={business.qualityScore} />
          </Reveal>
        </section>
      ) : null}

      <section className="section-block reviews-section">
        <Reveal variant="fade-up">
          <div className="section-heading">
            <p className="section-kicker">{copy.business.reviewsKicker}</p>
            <h2>{copy.business.reviewsTitle}</h2>
          </div>
        </Reveal>
        <Reveal delay={140} variant="fade-up">
          <ReviewList locale={locale} reviews={reviews} />
        </Reveal>
      </section>

      <section className="section-block review-form-section">
        <Reveal variant="slide-right">
          <div>
            <p className="section-kicker">{copy.business.writeKicker}</p>
            <h2>{copy.business.writeTitle}</h2>
            <p>{copy.business.writeBody}</p>
          </div>
        </Reveal>
        <Reveal delay={140} variant="slide-left">
          <ReviewForm businessSlug={business.slug} locale={locale} />
        </Reveal>
      </section>

      <Reveal variant="fade-up">
        <section className="container business-cta">
          <div>
            <p className="section-kicker inverse">{copy.business.claimKicker}</p>
            <h2>{copy.business.claimTitle}</h2>
            <p>{copy.business.claimBody}</p>
          </div>
          <ClaimForm businessName={business.name} businessSlug={business.slug} locale={locale} />
        </section>
      </Reveal>
    </>
  );
}
