import type { Locale } from "@manzil/shared";
import { revalidatePath } from "next/cache";
import {
  approveClaim,
  getAdminClaims,
  getAdminOverview,
  getModerationQueue,
  rejectClaim,
  rejectReport,
  resolveReport
} from "../../lib/api";

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

async function resolveReportAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await resolveReport(id, "rejected");
  revalidatePath("/[locale]/admin", "page");
}

async function rejectReportAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await rejectReport(id);
  revalidatePath("/[locale]/admin", "page");
}

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  let overview: Awaited<ReturnType<typeof getAdminOverview>>;
  let claims: Awaited<ReturnType<typeof getAdminClaims>>;
  let reports: Awaited<ReturnType<typeof getModerationQueue>>;

  try {
    [overview, claims, reports] = await Promise.all([
      getAdminOverview(),
      getAdminClaims("pending"),
      getModerationQueue("open")
    ]);
  } catch {
    // The API rejected the request — the signed-in account has no admin role.
    return (
      <section className="dash-shell">
        <div className="dash-signin">
          <h1>Access restricted</h1>
          <p>
            This console is available to administrator accounts only. Sign in
            with an administrator account to continue.
          </p>
          <a className="bl-btn-primary" href={`/${locale}/sign-in`}>Sign in</a>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-shell">
      <div className="section-heading">
        <p className="bl-kicker">Admin konsoli</p>
        <h1>Platforma boshqaruv markazi</h1>
        <p>
          Claim navbati, kontent moderatsiyasi va ma&apos;lumotlar bazasi nazorati —
          barchasi shu yerda.
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
            <p>Hozircha pending claimlar yo&apos;q.</p>
          </article>
        ) : null}
      </div>

      <div className="section-heading" style={{ marginTop: 40 }}>
        <p className="section-kicker">Moderation queue</p>
        <h2>Open reports</h2>
        <p>Reported reviews and photos can be resolved or dismissed here.</p>
      </div>

      <div className="admin-grid" style={{ marginTop: 20 }}>
        {reports.map((report) => (
          <article className="admin-card" key={report.id}>
            <h3>{report.targetType === "review" ? "Reported review" : "Reported photo"}</h3>
            <p>{report.reason}</p>
            <p>
              Reporter: {report.reporter.displayName}
              {report.reporter.email ? ` - ${report.reporter.email}` : ""}
            </p>
            {report.review ? (
              <p>
                {report.review.rating}★ - {report.review.text}
              </p>
            ) : null}
            {report.photo ? <p>{report.photo.publicUrl ?? report.photo.storageKey}</p> : null}
            <div className="button-row" style={{ marginTop: 16 }}>
              <form action={resolveReportAction}>
                <input name="id" type="hidden" value={report.id} />
                <button className="primary-button" type="submit">Remove content</button>
              </form>
              <form action={rejectReportAction}>
                <input name="id" type="hidden" value={report.id} />
                <button className="secondary-button" type="submit">Dismiss report</button>
              </form>
            </div>
          </article>
        ))}
        {reports.length === 0 ? (
          <article className="admin-card">
            <h3>Queue empty</h3>
            <p>No open moderation reports.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
