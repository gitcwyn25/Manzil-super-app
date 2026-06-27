import { businesses, categories, reviews, type Locale } from "@manzil/shared";

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;
  const pendingClaims = businesses.filter((business) => business.status !== "claimed");

  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="section-kicker">Admin MVP</p>
        <h1>Moderatsiya va launch nazorati</h1>
        <p>
          Bu sahifa claim approval, listing import, flagged content va category
          management uchun ishlab chiqiladigan admin panel skeletidir.
        </p>
      </div>
      <div className="admin-grid" style={{ marginTop: 28 }}>
        <article className="admin-card">
          <h3>{businesses.length}</h3>
          <p>Demo listinglar</p>
        </article>
        <article className="admin-card">
          <h3>{pendingClaims.length}</h3>
          <p>Claim qilinmagan yoki pending bizneslar</p>
        </article>
        <article className="admin-card">
          <h3>{reviews.length}</h3>
          <p>Sharhlar</p>
        </article>
        <article className="admin-card">
          <h3>{categories.length}</h3>
          <p>Kategoriyalar</p>
        </article>
      </div>
    </section>
  );
}
