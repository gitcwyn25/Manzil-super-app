import type { Locale } from "@manzil/shared";
import { getAdminOverview } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;
  const overview = await getAdminOverview();

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
          <h3>{overview.businessCount}</h3>
          <p>Database listinglari</p>
        </article>
        <article className="admin-card">
          <h3>{overview.pendingClaimCount}</h3>
          <p>Pending claimlar</p>
        </article>
        <article className="admin-card">
          <h3>{overview.reviewCount}</h3>
          <p>Sharhlar</p>
        </article>
        <article className="admin-card">
          <h3>{overview.categoryCount}</h3>
          <p>Kategoriyalar</p>
        </article>
        <article className="admin-card">
          <h3>{overview.flaggedItemCount}</h3>
          <p>Moderatsiya navbati</p>
        </article>
      </div>
    </section>
  );
}
