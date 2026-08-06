import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { PageHeaderCard } from "../../../components/vm/page-header-card";
import { StatusPill } from "../../../components/vm/status-pill";
import type { StatusPillVariant } from "../../../components/vm/status-pill";
import { BookingListItem } from "../../../components/workspace/booking-list-item";
import { StatCard } from "../../../components/workspace/stat-card";
import { TrendChart } from "../../../components/workspace/trend-chart";
import { getMyBusinesses } from "../../../lib/api";
import { getAnnouncements, getBookings, getBusinessAnalytics, getStats } from "../../../lib/crm-api";
import type { BookingStatus, CrmAnnouncement } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";
import { formatNumber, formatUzs, intlLocale, newRatingLabel } from "../../../lib/format";

export const dynamic = "force-dynamic";

// BookingStatus → StatusPill variant (confirmed/completed read as success,
// canceled/no_show as danger, pending stays neutral surface).
const STATUS_VARIANTS: Record<BookingStatus, StatusPillVariant> = {
  pending: "pending",
  confirmed: "success",
  completed: "success",
  canceled: "danger",
  no_show: "danger"
};

// Active discounts: CrmStats.announcements is keyed by status, not kind, so
// the count comes from the announcements list itself — published
// discount-kind entries whose date window covers now.
function countActiveDiscounts(announcements: CrmAnnouncement[]): number {
  const now = Date.now();
  return announcements.filter(
    (item) =>
      item.kind === "discount" &&
      item.status === "published" &&
      (!item.startsAt || Date.parse(item.startsAt) <= now) &&
      (!item.endsAt || Date.parse(item.endsAt) >= now)
  ).length;
}

export default async function OverviewPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    return null; // layout already renders the empty/sign-in states
  }

  // Analytics is entitlement-gated (null on the free plan's 403) and the
  // other feeds degrade to null on failure — every consumer below has an
  // absent-state, none fabricates a number (D7).
  const [stats, bookingsData, announcementsData, analytics] = await Promise.all([
    getStats(business.slug),
    getBookings(business.slug),
    getAnnouncements(business.slug),
    getBusinessAnalytics(business.slug)
  ]);

  if (!stats) {
    return null;
  }

  const base = `/${locale}/dashboard`;
  const claimed = stats.business.status === "claimed";

  // Revenue exists only when the plan includes analytics; otherwise the
  // second KPI slot falls back to the 30-day visits total so the row never
  // shows a locked teaser or an invented sum.
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

  const activeDiscounts = announcementsData
    ? countActiveDiscounts(announcementsData.announcements)
    : null;

  const hasRating = stats.business.reviewCount > 0;

  // Business Health range: Week = last 7 of the daily series, Month = all 30.
  const range = query.range === "week" ? "week" : "month";
  const daily = range === "week" ? stats.visits.daily.slice(-7) : stats.visits.daily;
  const chartPoints = daily.map((day) => ({ date: day.date, value: day.count }));
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" });
  const axisStart = chartPoints.length > 0 ? dateFormat.format(new Date(chartPoints[0].date)) : undefined;
  const axisEnd =
    chartPoints.length > 1 ? dateFormat.format(new Date(chartPoints[chartPoints.length - 1].date)) : undefined;

  const recentBookings = (bookingsData?.bookings ?? [])
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);

  // Carried-over facts the Stitch layout has no slot for (kept per the
  // no-regression rule; the rating histogram + profile completeness panels
  // relocate to /dashboard/analytics in the D5 sweep).
  const facts: Array<{ key: string; label: string; value: string }> = [
    ...(revenueValue
      ? [{ key: "visits", label: copy.overview.visits30, value: formatNumber(stats.visits.totalLast30Days, locale) }]
      : []),
    { key: "unique", label: copy.overview.unique30, value: formatNumber(stats.visits.uniqueLast30Days, locale) },
    { key: "reviews", label: copy.overview.reviewsTotal, value: formatNumber(stats.reviews.total, locale) },
    { key: "published", label: copy.overview.published, value: formatNumber(stats.announcements.published ?? 0, locale) },
    { key: "packages", label: copy.overview.activePackages, value: formatNumber(stats.activePackages, locale) }
  ];

  return (
    <div className="ws-overview">
      <PageHeaderCard
        action={
          <StatusPill variant={claimed ? "success" : "pending"}>
            {claimed ? copy.overview.statusClaimed : copy.overview.statusPending}
          </StatusPill>
        }
        subtitle={copy.overview.welcome}
        title={copy.overview.title}
      />

      {!claimed ? <p className="ws-note">{copy.overview.pendingNote}</p> : null}

      <div className="ws-kpi-grid">
        <StatCard
          caption={copy.overview.totalBookings}
          icon="calendar"
          value={bookingsData ? formatNumber(bookingsData.total, locale) : "—"}
        />
        {revenueValue ? (
          <StatCard caption={copy.overview.revenue} icon="trending_up" value={revenueValue} />
        ) : (
          <StatCard
            caption={copy.overview.visits30}
            icon="trending_up"
            value={formatNumber(stats.visits.totalLast30Days, locale)}
          />
        )}
        <StatCard
          accent="secondary"
          caption={copy.overview.avgRating}
          icon="star"
          suffix={hasRating ? "/ 5.0" : undefined}
          value={hasRating ? stats.business.avgRating.toFixed(1) : newRatingLabel(locale)}
        />
        <StatCard
          accent="tertiary"
          caption={copy.overview.activeDiscounts}
          icon="tag"
          value={activeDiscounts === null ? "—" : formatNumber(activeDiscounts, locale)}
        />
      </div>

      <div className="ws-main-grid">
        <section className="card ws-panel ws-panel--chart">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <div>
                <h2 className="ws-panel__title">{copy.overview.businessHealth}</h2>
                <span className="ws-panel__hint">{copy.overview.visitsChart}</span>
              </div>
              <div aria-label={copy.overview.businessHealth} className="ws-segmented" role="group">
                <Link
                  aria-current={range === "week" ? "true" : undefined}
                  className={range === "week" ? "ws-segmented__option active" : "ws-segmented__option"}
                  href={`${base}?range=week`}
                  scroll={false}
                >
                  {copy.overview.rangeWeek}
                </Link>
                <Link
                  aria-current={range === "month" ? "true" : undefined}
                  className={range === "month" ? "ws-segmented__option active" : "ws-segmented__option"}
                  href={base}
                  scroll={false}
                >
                  {copy.overview.rangeMonth}
                </Link>
              </div>
            </div>
            <TrendChart
              ariaLabel={copy.overview.visitsChart}
              axisEnd={axisEnd}
              axisStart={axisStart}
              emptyLabel={copy.analytics.noData}
              points={chartPoints}
            />
          </div>
        </section>

        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <h2 className="ws-panel__title">{copy.overview.recentBookings}</h2>
              <Link className="ws-view-all" href={`${base}/bookings`}>
                {copy.overview.viewAll}
              </Link>
            </div>
            {recentBookings.length > 0 ? (
              <ul className="ws-booking-list">
                {recentBookings.map((booking) => {
                  const deposit = booking.depositAmount ? Number.parseFloat(booking.depositAmount) : Number.NaN;
                  return (
                    <BookingListItem
                      amount={Number.isFinite(deposit) ? formatUzs(Math.round(deposit), locale) : null}
                      key={booking.id}
                      name={booking.customerName ?? booking.customerPhone}
                      service={booking.serviceName}
                      statusLabel={copy.bookings.statuses[booking.status]}
                      statusVariant={STATUS_VARIANTS[booking.status]}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="ws-panel-empty">{copy.bookings.emptyTitle}</p>
            )}
          </div>
        </section>
      </div>

      <section className="card ws-facts">
        <dl className="card-body ws-facts__body">
          {facts.map((fact) => (
            <div className="ws-fact" key={fact.key}>
              <dt>{fact.label}</dt>
              <dd className="ws-num">
                {fact.value}
                {fact.key === "reviews" && stats.reviews.lastSevenDays > 0 ? (
                  <span className="ws-fact__delta">
                    +{formatNumber(stats.reviews.lastSevenDays, locale)} {copy.overview.last7}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
          {/* The customer directory is the CRM's anchor screen, so it keeps a
              direct entry point from the home view rather than living only
              behind the sidebar. */}
          <div className="ws-fact">
            <dt>
              <Link href={`${base}/customers`}>{copy.menu.customers}</Link>
            </dt>
            <dd className="ws-num">{formatNumber(stats.customerCount, locale)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
