import { findBusiness, getBusinessReviews, type Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaimForm } from "../../../components/claim-form";
import { ReviewForm } from "../../../components/review-form";
import { ReviewList } from "../../../components/review-list";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const business = findBusiness(slug);

  if (!business) {
    return {};
  }

  return {
    title: `${business.name} | Manzil`,
    description: business.description[locale] ?? business.description.uz
  };
}

export default async function BusinessProfilePage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const business = findBusiness(slug);

  if (!business) {
    notFound();
  }

  const reviews = getBusinessReviews(slug);

  return (
    <>
      <section className="section-block profile-section">
        <div className="profile-media">
          <div className={`profile-main-photo photo-block photo-${business.photo}`} />
          <div className="profile-side-photo photo-block photo-somsa" />
          <div className="profile-side-photo photo-block photo-coffee" />
        </div>
        <div className="profile-copy">
          <p className="section-kicker">SEO biznes profili</p>
          <h1>{business.name}</h1>
          <div className="rating-line">
            <strong>{business.avgRating}</strong>
            <span>{business.reviewCount} ta sharh</span>
            <span>{business.status === "claimed" ? "Tasdiqlangan" : "Claim qilinmagan"}</span>
          </div>
          <p>{business.description[locale] ?? business.description.uz}</p>
          <div className="tag-row">
            {business.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <dl className="profile-facts">
            <div>
              <dt>Manzil</dt>
              <dd>{business.address}</dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>{business.phone}</dd>
            </div>
            <div>
              <dt>Ish vaqti</dt>
              <dd>{business.hours}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section-block reviews-section">
        <div className="section-heading">
          <p className="section-kicker">Sharhlar</p>
          <h2>Foydalanuvchilar fikri</h2>
        </div>
        <ReviewList reviews={reviews} />
      </section>

      <section className="section-block review-form-section">
        <div>
          <p className="section-kicker">Sharh yozish</p>
          <h2>Tajriba bilan bo'lishing</h2>
          <p>Sharhlar minimum uzunlik va bitta foydalanuvchi bitta sharh qoidasi bilan saqlanadi.</p>
        </div>
        <ReviewForm businessSlug={business.slug} />
      </section>

      <section className="container business-cta">
        <div>
          <p className="section-kicker inverse">Claim flow</p>
          <h2>Bu sizning biznesingizmi?</h2>
          <p>Profilni claim qiling, rasmlar va ish vaqtini yangilang, sharhlarga javob bering.</p>
        </div>
        <ClaimForm businessName={business.name} businessSlug={business.slug} />
      </section>
    </>
  );
}
