import type { Review } from "@manzil/shared";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="review-list">
        <article className="review-card">
          <div className="review-avatar">M</div>
          <div>
            <strong>Hali sharh yo'q</strong>
            <p>Bu listing uchun birinchi foydali sharhni qoldiring.</p>
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
              {review.rating} - {review.authorBadge ?? `${review.helpfulCount} helpful`}
            </p>
            <p>{review.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
