import type { Locale } from "@manzil/shared";
import { revalidatePath } from "next/cache";
import { approveClaim, getAdminClaims, getAdminOverview, rejectClaim } from "../../lib/api";

export const dynamic = "force-dynamic";

async function approveClaimAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await approveClaim(id);
  revalidatePath("/[locale]/admin", "page");
}

async function rejectClaimAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await rejectClaim(id);
  revalidatePath("/[locale]/admin", "page");
}

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;
  const [overview, claims] = await Promise.all([getAdminOverview(), getAdminClaims("pending")]);

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

      <div className="section-heading" style={{ marginTop: 40 }}>
        <p className="section-kicker">Claim queue</p>
        <h2>Pending business claims</h2>
        <p>Adminlar claimlarni tekshiradi, tasdiqlaydi yoki rad etadi.</p>
      </div>

      <div className="admin-grid" style={{ marginTop: 20 }}>
        {claims.map((claim) => (
          <article className="admin-card" key={claim.id}>
            <h3>{claim.business.name}</h3>
            <p>{claim.business.address}</p>
            <p>
              {claim.requester.displayName}
              {claim.requester.phone ? ` - ${claim.requester.phone}` : ""}
            </p>
            {claim.note ? <p>{claim.note}</p> : null}
            <div className="button-row" style={{ marginTop: 16 }}>
              <form action={approveClaimAction}>
                <input name="id" type="hidden" value={claim.id} />
                <button className="primary-button" type="submit">Approve</button>
              </form>
              <form action={rejectClaimAction}>
                <input name="id" type="hidden" value={claim.id} />
                <button className="secondary-button" type="submit">Reject</button>
              </form>
            </div>
          </article>
        ))}
        {claims.length === 0 ? (
          <article className="admin-card">
            <h3>Queue empty</h3>
            <p>Hozircha pending claimlar yo'q.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
