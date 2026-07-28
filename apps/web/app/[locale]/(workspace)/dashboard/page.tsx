import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { getMyBusinesses } from "../../../lib/api";
import { getStats } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];
  const stats = business ? await getStats(business.slug) : null;

  if (!business || !stats) {
    return null; // layout already renders the empty/sign-in states
  }

  const maxDaily = Math.max(1, ...stats.visits.daily.map((day) => day.count));
  const totalRatings = Object.values(stats.reviews.distribution).reduce((sum, count) => sum + count, 0);

  // Profile completeness: each filled field earns a share.
  const raw = business as unknown as Record<string, unknown>;
  const completenessFields = ["phone", "hours", "priceTier"] as const;
  const filled =
    completenessFields.filter((field) => Boolean(raw[field])).length +
    (business.description?.uz ? 1 : 0) +
    (stats.activePackages > 0 ? 1 : 0) +
    ((stats.announcements.published ?? 0) > 0 ? 1 : 0);
  const completeness = Math.round((filled / 6) * 100);

  return (
    <>
      <header className="crm-page-head">
        <h1>{copy.overview.title}</h1>
        <span className={`crm-chip crm-chip-${stats.business.status === "claimed" ? "ok" : "warn"}`}>
          {stats.business.status}
        </span>
      </header>

      {stats.business.status !== "claimed" ? (
        <p className="crm-pending-note">{copy.overview.pendingNote}</p>
      ) : null}

      <div className="crm-statrow">
        <article className="crm-statcard">
          <span>{copy.overview.visits30}</span>
          <strong>{stats.visits.totalLast30Days}</strong>
          <em className="up">{copy.overview.vsNote}</em>
        </article>
        <article className="crm-statcard">
          <span>{copy.overview.unique30}</span>
          <strong>{stats.visits.uniqueLast30Days}</strong>
          <em className="up">{copy.overview.vsNote}</em>
        </article>
        <article className="crm-statcard">
          <span>{copy.overview.reviewsTotal}</span>
          <strong>{stats.reviews.total}</strong>
          <em className="up">+{stats.reviews.lastSevenDays} {copy.overview.last7}</em>
        </article>
        <article className="crm-statcard">
          <span>{copy.overview.avgRating}</span>
          <strong>{stats.business.avgRating.toFixed(1)} ★</strong>
          <em>{stats.reviews.total > 0 ? `${totalRatings}` : "—"}</em>
        </article>
      </div>

      <div className="crm-panels">
        <section className="crm-panel">
          <h2>{copy.overview.visitsChart}</h2>
          <div className="crm-chart" role="img" aria-label={copy.overview.visitsChart}>
            {stats.visits.daily.map((day) => (
              <span
                key={day.date}
                style={{ height: `${Math.max(4, Math.round((day.count / maxDaily) * 100))}%` }}
                title={`${day.date}: ${day.count}`}
              />
            ))}
          </div>
        </section>

        <section className="crm-panel">
          <h2>{copy.overview.ratingDist}</h2>
          <div className="crm-dist">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.reviews.distribution[String(star)] ?? 0;
              const percent = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
              return (
                <div className="crm-dist-row" key={star}>
                  <span>{star} ★</span>
                  <div className="crm-dist-track">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        </section>

        <section className="crm-panel">
          <h2>{copy.overview.completeness}</h2>
          <div className="crm-completeness">
            <strong>{completeness}%</strong>
            <div className="crm-dist-track big">
              <i style={{ width: `${completeness}%` }} />
            </div>
            <p>{copy.overview.completenessHint}</p>
          </div>
          <dl className="crm-mini-facts">
            <div>
              <dt>{copy.overview.published}</dt>
              <dd>{stats.announcements.published ?? 0}</dd>
            </div>
            <div>
              <dt>{copy.overview.activePackages}</dt>
              <dd>{stats.activePackages}</dd>
            </div>
            {/* The customer directory is the CRM's anchor screen, so it gets a
                direct entry point from the home view rather than living only
                behind the sidebar. */}
            <div>
              <dt>
                <Link href={`/${locale}/dashboard/customers`}>{copy.menu.customers}</Link>
              </dt>
              <dd>{stats.customerCount}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
