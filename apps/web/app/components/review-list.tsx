import type { Locale, Review } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { HelpfulButton } from "./helpful-button";

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
        <article className="review-card">
          <div className="review-avatar">M</div>
          <div>
            <strong>{copy.reviewsList.emptyTitle}</strong>
            <p>{copy.reviewsList.emptyBody}</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <article className="review-card" key={review.id}>
          <div className="review-avatar">{review.authorName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div>
            <strong>{review.authorName}</strong>
            <p className="stars">
              {review.rating}
              {review.authorBadge ? ` - ${review.authorBadge}` : null}
              {/* Only shown when the review is linked to a completed booking by
                  this reviewer at this business — never inferred. */}
              {review.verifiedVisit ? (
                <span className="verified-visit" title="Tasdiqlangan tashrif">
                  ✓ Tasdiqlangan tashrif
                </span>
              ) : null}
            </p>
            <p>{review.text}</p>
            <HelpfulButton
              initialCount={review.helpfulCount}
              initialVoted={votedReviewIds.includes(review.id)}
              label={copy.reviewsList.helpful}
              reviewId={review.id}
            />
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
          </div>
        </article>
      ))}
    </div>
  );
}
