import type { Locale } from "@manzil/shared";
import { ExportReviewsButton } from "../../../../components/crm/export-reviews-button";
import { IconField } from "../../../../components/vm/icon-field";
import { Icon } from "../../../../components/vm/icons";
import { InitialsAvatar } from "../../../../components/vm/initials-avatar";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import { getMyBusinesses } from "../../../../lib/api";
import { replyToReviewAction } from "../../../../lib/crm-actions";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatNumber, intlLocale } from "../../../../lib/format";

export const dynamic = "force-dynamic";

/**
 * Workspace reviews (Vibrant Marketplace, task D5): the business-details
 * review-tile treatment (quiet surface tiles, initials avatar, orange star
 * row) in workspace density. Helpful counts are read-only here — voting is a
 * consumer affordance; the owner only sees the tally (D7: the count is a real
 * API fact on Review.helpfulCount).
 */

/** Filled-vs-outline star row in the canonical tertiary-orange accent (D3). */
function ReviewStars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating}/5`} className="biz-stars" role="img">
      {[1, 2, 3, 4, 5].map((step) => (
        <Icon
          className={step <= rating ? undefined : "biz-stars__empty"}
          key={step}
          name={step <= rating ? "star_filled" : "star"}
          size={14}
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses, reviews } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) return null;

  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });

  return (
    <div className="ws-page">
      <PageHeaderCard
        action={
          <ExportReviewsButton
            fileName={`${business.slug}-reviews.csv`}
            label={copy.reviews.exportCsv}
            reviews={reviews.map((review) => ({
              author: review.authorName,
              rating: review.rating,
              text: review.text,
              date: review.createdAt,
              reply: review.reply?.text ?? ""
            }))}
          />
        }
        subtitle={copy.reviews.subtitle}
        title={copy.reviews.title}
      />

      {reviews.length === 0 ? (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body ws-empty">
            <p className="ws-empty__body">{copy.reviews.empty}</p>
          </div>
        </section>
      ) : (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-rev-list">
              {reviews.map((review) => (
                <article className="ws-rev" key={review.id}>
                  <div className="ws-rev__top">
                    <div className="ws-rev__who">
                      <InitialsAvatar name={review.authorName} />
                      <div>
                        <strong className="ws-rev__name">{review.authorName}</strong>
                        <p className="ws-rev__meta ws-num">
                          {dateFormat.format(new Date(review.createdAt))}
                        </p>
                      </div>
                    </div>
                    <ReviewStars rating={review.rating} />
                  </div>

                  <p className="ws-rev__text">{review.text}</p>

                  {review.helpfulCount > 0 ? (
                    <span className="ws-rev__helpful">
                      <Icon name="thumbs_up" size={14} />
                      <span className="ws-num">{formatNumber(review.helpfulCount, locale)}</span>
                      {copy.reviews.helpfulLabel}
                    </span>
                  ) : null}

                  {review.reply ? (
                    <div className="ws-rev__reply">
                      <strong>{copy.reviews.replied}</strong>
                      <p>{review.reply.text}</p>
                    </div>
                  ) : (
                    <form action={replyToReviewAction} className="ws-rev__form">
                      <input name="reviewId" type="hidden" value={review.id} />
                      <IconField
                        className="ws-rev__form-field"
                        icon="send"
                        maxLength={4000}
                        minLength={2}
                        name="text"
                        placeholder={copy.reviews.replyPlaceholder}
                        required
                        type="text"
                      />
                      <button className="btn btn-primary vm-cta" type="submit">
                        {copy.reviews.send}
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
