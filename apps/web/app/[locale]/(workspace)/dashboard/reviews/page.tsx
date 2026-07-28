import type { Locale } from "@manzil/shared";
import { ExportReviewsButton } from "../../../../components/crm/export-reviews-button";
import { getMyBusinesses } from "../../../../lib/api";
import { replyToReviewAction } from "../../../../lib/crm-actions";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

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

  const dateFormat = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "medium" });

  return (
    <>
      <header className="crm-page-head">
        <div>
          <h1>{copy.reviews.title}</h1>
          <p>{copy.reviews.subtitle}</p>
        </div>
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
      </header>

      <div className="crm-review-list">
        {reviews.map((review) => (
          <article className="crm-panel crm-review" key={review.id}>
            <header>
              <span className="crm-review-avatar">{review.authorName.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{review.authorName}</strong>
                <em>{dateFormat.format(new Date(review.createdAt))}</em>
              </div>
              <span className="crm-review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            </header>
            <p>{review.text}</p>

            {review.reply ? (
              <div className="crm-review-reply">
                <strong>{copy.reviews.replied}</strong>
                <p>{review.reply.text}</p>
              </div>
            ) : (
              <form action={replyToReviewAction} className="crm-reply-form">
                <input name="reviewId" type="hidden" value={review.id} />
                <input
                  maxLength={4000}
                  minLength={2}
                  name="text"
                  placeholder={copy.reviews.replyPlaceholder}
                  required
                  type="text"
                />
                <button className="bz-btn-primary" type="submit">{copy.reviews.send}</button>
              </form>
            )}
          </article>
        ))}
        {reviews.length === 0 ? (
          <section className="crm-panel">
            <p className="crm-empty">{copy.reviews.empty}</p>
          </section>
        ) : null}
      </div>
    </>
  );
}
