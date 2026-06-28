import type { Locale, Review } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";

export function ReviewList({ reviews, locale }: { reviews: Review[]; locale: Locale }) {
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
              {review.rating} - {review.authorBadge ?? `${review.helpfulCount} ${copy.reviewsList.helpful}`}
            </p>
            <p>{review.text}</p>
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
