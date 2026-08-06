import type { Locale, Review } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { formatRelativeTime } from "../lib/format";
import { HelpfulButton } from "./helpful-button";
import { Icon } from "./vm/icons";
import { InitialsAvatar } from "./vm/initials-avatar";

/**
 * Per-review star row. Ratings are integers 1-5, so this renders filled vs
 * outline stars in the canonical tertiary-orange accent (D3) — the numeric
 * value stays available to assistive tech via the aria-label.
 */
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

export function ReviewList({
  reviews,
  locale,
  votedReviewIds = []
}: {
  reviews: Review[];
  locale: Locale;
  /** Reviews the signed-in viewer already marked helpful, so the button renders in the right state. */
  votedReviewIds?: string[];
}) {
  const copy = getUiCopy(locale);

  if (reviews.length === 0) {
    return (
      <div className="review-list">
        {/* Distinct modifier so the empty state is not mistaken for a review —
            it shares the card styling but carries no review, no author, and no
            helpful control. */}
        <article className="review-card review-card--empty">
          <div className="review-card__top">
            <div className="review-card__who">
              <span aria-hidden="true" className="vm-icon-tile vm-icon-tile--sm vm-icon-tile--primary">
                <Icon name="star" size={18} />
              </span>
              <div>
                <strong className="review-card__name">{copy.reviewsList.emptyTitle}</strong>
                <p className="review-card__meta">{copy.reviewsList.emptyBody}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => {
        const when = formatRelativeTime(review.createdAt, locale);

        return (
          <article className="review-card" key={review.id}>
            <div className="review-card__top">
              <div className="review-card__who">
                <InitialsAvatar name={review.authorName} />
                <div>
                  <strong className="review-card__name">{review.authorName}</strong>
                  <p className="review-card__meta">
                    {[when, review.authorBadge].filter(Boolean).join(" • ")}
                    {/* Only shown when the review is linked to a completed booking
                        by this reviewer at this business — never inferred. */}
                    {review.verifiedVisit ? (
                      <span className="verified-visit">
                        <Icon name="check_circle" size={12} />
                        {copy.reviewsList.verifiedVisit}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <ReviewStars rating={review.rating} />
            </div>
            <p className="review-card__text">{review.text}</p>
            {/* No incentive is ever offered for leaving a review. Discounting
                reviews is treated as a trust violation by both Yelp's Trust &
                Safety rules and Meituan/Dianping's platform policy, not a
                growth tactic. */}
            {review.reply ? (
              <div className="owner-reply">
                <strong>{copy.reviewsList.businessReply}</strong>
                <p>{review.reply.text}</p>
              </div>
            ) : null}
            <HelpfulButton
              initialCount={review.helpfulCount}
              initialVoted={votedReviewIds.includes(review.id)}
              label={copy.reviewsList.helpful}
              reviewId={review.id}
            />
          </article>
        );
      })}
    </div>
  );
}
