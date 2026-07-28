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
} from "../../../lib/api";
import { getCrmCopy } from "../../../lib/crm-copy";

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
  const copy = getCrmCopy(locale).admin;

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
          <h1>{copy.accessRestricted}</h1>
          <p>{copy.accessRestrictedText}</p>
          <a className="bl-btn-primary" href={`/${locale}/sign-in`}>{copy.signIn}</a>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-shell">
      <div className="section-heading">
        <p className="bl-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <div className="admin-grid" style={{ marginTop: 28 }}>
        <article className="admin-card">
          <h3 className="ws-num">{overview.businessCount}</h3>
          <p>{copy.statBusinesses}</p>
        </article>
        <article className="admin-card">
          <h3 className="ws-num">{overview.pendingClaimCount}</h3>
          <p>{copy.statPendingClaims}</p>
        </article>
        <article className="admin-card">
          <h3 className="ws-num">{overview.reviewCount}</h3>
          <p>{copy.statReviews}</p>
        </article>
        <article className="admin-card">
          <h3 className="ws-num">{overview.categoryCount}</h3>
          <p>{copy.statCategories}</p>
        </article>
        <article className="admin-card">
          <h3 className="ws-num">{overview.flaggedItemCount}</h3>
          <p>{copy.statModerationQueue}</p>
        </article>
      </div>

      <div className="section-heading" style={{ marginTop: 40 }}>
        <p className="section-kicker">{copy.claimsKicker}</p>
        <h2>{copy.claimsTitle}</h2>
        <p>{copy.claimsSubtitle}</p>
      </div>

      <table className="ws-table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>{copy.colBusiness}</th>
            <th>{copy.colRequester}</th>
            <th>{copy.colNote}</th>
            <th>{copy.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id}>
              <td>
                <strong>{claim.business.name}</strong>
                <p className="crm-cell-sub">{claim.business.address}</p>
              </td>
              <td>
                {claim.requester.displayName}
                {claim.requester.phone ? ` · ${claim.requester.phone}` : ""}
              </td>
              <td>{claim.note ?? "—"}</td>
              <td>
                <div className="button-row">
                  <form action={approveClaimAction}>
                    <input name="id" type="hidden" value={claim.id} />
                    <button className="primary-button" type="submit">{copy.approve}</button>
                  </form>
                  <form action={rejectClaimAction}>
                    <input name="id" type="hidden" value={claim.id} />
                    <button className="secondary-button" type="submit">{copy.reject}</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {claims.length === 0 ? (
            <tr>
              <td colSpan={4}>{copy.claimsEmpty}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="section-heading" style={{ marginTop: 40 }}>
        <p className="section-kicker">{copy.reportsKicker}</p>
        <h2>{copy.reportsTitle}</h2>
        <p>{copy.reportsSubtitle}</p>
      </div>

      <table className="ws-table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>{copy.colType}</th>
            <th>{copy.colReason}</th>
            <th>{copy.colReporter}</th>
            <th>{copy.colDetail}</th>
            <th>{copy.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.targetType === "review" ? copy.typeReview : copy.typePhoto}</td>
              <td>{report.reason}</td>
              <td>
                {report.reporter.displayName}
                {report.reporter.email ? ` · ${report.reporter.email}` : ""}
              </td>
              <td>
                {report.review ? `${report.review.rating}★ — ${report.review.text}` : null}
                {report.photo ? report.photo.publicUrl ?? report.photo.storageKey : null}
              </td>
              <td>
                <div className="button-row">
                  <form action={resolveReportAction}>
                    <input name="id" type="hidden" value={report.id} />
                    <button className="primary-button" type="submit">{copy.removeContent}</button>
                  </form>
                  <form action={rejectReportAction}>
                    <input name="id" type="hidden" value={report.id} />
                    <button className="secondary-button" type="submit">{copy.dismissReport}</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {reports.length === 0 ? (
            <tr>
              <td colSpan={5}>{copy.reportsEmpty}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
