import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconTile } from "../../../../components/vm/icon-tile";
import { Icon } from "../../../../components/vm/icons";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import { StatCard } from "../../../../components/workspace/stat-card";
import { TrendChart } from "../../../../components/workspace/trend-chart";
import { getMyBusinesses } from "../../../../lib/api";
import { getBusinessAnalytics, getStats } from "../../../../lib/crm-api";
import type { BookingStatus } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatNumber, formatUzs, intlLocale, newRatingLabel } from "../../../../lib/format";

export const dynamic = "force-dynamic";

/**
 * Analytics (Vibrant Marketplace, task D5): overview-kit StatCards + the
 * TrendChart panels, plus the designated new home of the rating-distribution
 * and profile-completeness panels the Stitch overview layout dropped (D2
 * relocated them here, per the critic's no-regression rule).
 *
 * Honest data (D7): every number below is an API fact — analytics is
 * entitlement-gated (null on the free plan's 403) and renders the upgrade
 * path instead; the relocated panels ride the ungated /stats endpoint so
 * they render on every plan.
 */

/** Simple horizontal bar rows (funnel, booking statuses) — server-rendered, no JS. */
function BarRows({
  rows,
  emptyLabel
}: {
  rows: Array<{ key: string; label: string; value: number; display: string; note?: string }>;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0 || rows.every((row) => row.value === 0)) {
    return <p className="ws-empty__body">{emptyLabel}</p>;
  }

  return (
    <div className="ws-bars">
      {rows.map((row) => (
        <div className="ws-bars__row" key={row.key}>
          <span className="ws-bars__label">
            {row.label}
            {row.note ? <em className="ws-bars__note">{row.note}</em> : null}
          </span>
          <span className="ws-track">
            <i style={{ width: `${Math.max(2, Math.round((row.value / max) * 100))}%` }} />
          </span>
          <b className="ws-num ws-bars__value">{row.display}</b>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const copy = getCrmCopy(locale);
  const text = copy.analytics;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  // Analytics may 403 on the free plan; /stats is ungated — fetch both so the
  // relocated overview panels render regardless of entitlement.
  const [analytics, stats] = await Promise.all([
    getBusinessAnalytics(business.slug, 30),
    getStats(business.slug)
  ]);

  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" });
  const axisLabels = (points: Array<{ date: string }>): { start?: string; end?: string } => ({
    start: points.length > 0 ? dateFormat.format(new Date(points[0].date)) : undefined,
    end:
      points.length > 1 ? dateFormat.format(new Date(points[points.length - 1].date)) : undefined
  });

  const eventLabels: Record<string, string> = {
    view: text.eventView,
    photo_view: text.eventPhoto,
    directions: text.eventDirections,
    call: text.eventCall,
    message: text.eventMessage
  };

  // Revenue formatting mirrors the overview KPI: locale UZS, never "$".
  let revenueValue: string | null = null;
  if (analytics) {
    const amount = Number.parseFloat(analytics.revenue.totalAmount);
    if (Number.isFinite(amount)) {
      revenueValue =
        analytics.revenue.currency === "UZS"
          ? formatUzs(Math.round(amount), locale)
          : `${formatNumber(Math.round(amount), locale)} ${analytics.revenue.currency}`;
    }
  }

  const visitPoints = analytics
    ? analytics.visits.trend.map((point) => ({ date: point.date, value: point.value }))
    : [];
  const visitAxis = axisLabels(visitPoints);

  // Days without reviews carry value:null — they are skipped, not plotted as
  // zero (a 0-star day would be an invented rating).
  const ratingPoints = analytics
    ? analytics.reviews.trend
        .filter((point) => point.value !== null)
        .map((point) => ({ date: point.date, value: point.value as number }))
    : [];
  const ratingAxis = axisLabels(ratingPoints);

  const funnelRows = analytics
    ? analytics.funnel.map((stage) => ({
        key: stage.type,
        label: eventLabels[stage.type] ?? stage.type,
        value: stage.count,
        display: formatNumber(stage.count, locale),
        note:
          stage.type === "view" || stage.conversionFromView === null
            ? undefined
            : `${stage.conversionFromView}% ${text.ofViews}`
      }))
    : [];

  const bookingRows = analytics
    ? Object.entries(analytics.bookings.byStatus).map(([status, count]) => ({
        key: status,
        label: copy.bookings.statuses[status as BookingStatus] ?? status.replace(/_/g, " "),
        value: count,
        display: formatNumber(count, locale)
      }))
    : [];

  // ---- Relocated overview panels (rating distribution + completeness) ----
  const totalRatings = stats
    ? Object.values(stats.reviews.distribution).reduce((sum, count) => sum + count, 0)
    : 0;

  // Profile completeness: each filled field earns a share (carried verbatim
  // from the pre-redesign overview page).
  let completeness: number | null = null;
  if (stats) {
    const raw = business as unknown as Record<string, unknown>;
    const completenessFields = ["phone", "hours", "priceTier"] as const;
    const filled =
      completenessFields.filter((field) => Boolean(raw[field])).length +
      (business.description?.uz ? 1 : 0) +
      (stats.activePackages > 0 ? 1 : 0) +
      ((stats.announcements.published ?? 0) > 0 ? 1 : 0);
    completeness = Math.round((filled / 6) * 100);
  }

  const hasRating = analytics ? analytics.reviews.count > 0 : false;

  return (
    <div className="ws-page">
      <PageHeaderCard subtitle={`${text.subtitle} · ${text.window}`} title={text.title} />

      {analytics ? (
        <>
          <div className="ws-kpi-grid">
            <StatCard
              caption={text.visits}
              icon="trending_up"
              value={formatNumber(analytics.visits.total, locale)}
            />
            <StatCard
              caption={text.unique}
              icon="users"
              value={formatNumber(analytics.visits.unique, locale)}
            />
            <StatCard
              accent="secondary"
              caption={text.rating}
              icon="star"
              suffix={hasRating ? "/ 5.0" : undefined}
              value={
                hasRating && analytics.reviews.averageRating !== null
                  ? analytics.reviews.averageRating.toFixed(1)
                  : newRatingLabel(locale)
              }
            />
            <StatCard
              accent="tertiary"
              caption={text.revenue}
              icon="banknote"
              value={revenueValue ?? "—"}
            />
          </div>

          <section className="card ws-panel">
            <div className="card-body ws-panel__body">
              <div className="ws-panel__head">
                <h2 className="ws-panel__title">{text.visitTrend}</h2>
              </div>
              <TrendChart
                ariaLabel={text.visitTrend}
                axisEnd={visitAxis.end}
                axisStart={visitAxis.start}
                emptyLabel={text.noData}
                points={visitPoints}
              />
            </div>
          </section>

          <div className="ws-grid-2">
            <section className="card ws-panel">
              <div className="card-body ws-panel__body">
                <div className="ws-panel__head">
                  <h2 className="ws-panel__title">{text.funnel}</h2>
                </div>
                <BarRows emptyLabel={text.noData} rows={funnelRows} />
              </div>
            </section>

            <section className="card ws-panel">
              <div className="card-body ws-panel__body">
                <div className="ws-panel__head">
                  <h2 className="ws-panel__title">{text.ratingTrend}</h2>
                </div>
                <TrendChart
                  ariaLabel={text.ratingTrend}
                  axisEnd={ratingAxis.end}
                  axisStart={ratingAxis.start}
                  emptyLabel={text.noData}
                  points={ratingPoints}
                />
              </div>
            </section>
          </div>

          {analytics.bookings.total > 0 ? (
            <section className="card ws-panel">
              <div className="card-body ws-panel__body">
                <div className="ws-panel__head">
                  <h2 className="ws-panel__title">{text.bookings}</h2>
                </div>
                <BarRows emptyLabel={text.noData} rows={bookingRows} />
              </div>
            </section>
          ) : null}
        </>
      ) : (
        // The API refused — almost always the plan entitlement (403). Show
        // the upgrade path rather than an error the owner cannot act on.
        <section className="card ws-panel">
          <div className="card-body ws-panel__body ws-locked">
            <IconTile accent="primary" icon="lock" size="md" />
            <h2 className="ws-panel__title">{text.upgradeTitle}</h2>
            <p className="ws-empty__body">{text.upgradeText}</p>
            <Link className="btn btn-primary vm-cta" href={`/${locale}/business/pricing`}>
              {text.upgradeCta}
            </Link>
          </div>
        </section>
      )}

      {stats ? (
        <div className="ws-grid-2">
          <section className="card ws-panel">
            <div className="card-body ws-panel__body">
              <div className="ws-panel__head">
                <h2 className="ws-panel__title">{copy.overview.ratingDist}</h2>
              </div>
              {totalRatings > 0 ? (
                <div className="ws-bars ws-bars--rating">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.reviews.distribution[String(star)] ?? 0;
                    const percent = Math.round((count / totalRatings) * 100);
                    return (
                      <div className="ws-bars__row" key={star}>
                        <span className="ws-bars__label ws-bars__label--star">
                          <span className="ws-num">{star}</span>
                          <Icon name="star_filled" size={12} />
                        </span>
                        <span className="ws-track">
                          <i style={{ width: `${percent}%` }} />
                        </span>
                        <b className="ws-num ws-bars__value">{formatNumber(count, locale)}</b>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="ws-empty__body">{text.noData}</p>
              )}
            </div>
          </section>

          <section className="card ws-panel">
            <div className="card-body ws-panel__body">
              <div className="ws-panel__head">
                <h2 className="ws-panel__title">{copy.overview.completeness}</h2>
              </div>
              {completeness !== null ? (
                <div className="ws-completeness">
                  <strong className="ws-num ws-completeness__value">{completeness}%</strong>
                  <span className="ws-track ws-track--lg">
                    <i style={{ width: `${completeness}%` }} />
                  </span>
                  <p className="ws-completeness__hint">{copy.overview.completenessHint}</p>
                </div>
              ) : null}
              <dl className="ws-facts__body ws-facts__body--flush">
                <div className="ws-fact">
                  <dt>{copy.overview.published}</dt>
                  <dd className="ws-num">{formatNumber(stats.announcements.published ?? 0, locale)}</dd>
                </div>
                <div className="ws-fact">
                  <dt>{copy.overview.activePackages}</dt>
                  <dd className="ws-num">{formatNumber(stats.activePackages, locale)}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
