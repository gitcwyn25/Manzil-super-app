import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { BarList, StatRow, StatTile, TrendChart } from "../../../components/charts/charts";
import "../../../components/charts/charts.css";
import { getMyBusinesses } from "../../../lib/api";
import { getBusinessAnalytics } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/** Formats UZS without decimals — sums are large and tiyin are never displayed. */
function formatMoney(amount: string, currency: string, locale: string): string {
  const value = Number(amount);

  if (!Number.isFinite(value)) return `0 ${currency}`;

  return `${new Intl.NumberFormat(locale).format(Math.round(value))} ${currency}`;
}

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
  const text = copy.analytics;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const analytics = await getBusinessAnalytics(business.slug, 30);

  // Null means the API refused — almost always the plan entitlement (403).
  // Show the upgrade path rather than an error the owner cannot act on.
  if (!analytics) {
    return (
      <section className="mz-analytics">
        <h1 className="mz-chart__title">{text.title}</h1>
        <div className="mz-upgrade">
          <h2>{text.upgradeTitle}</h2>
          <p>{text.upgradeText}</p>
          <a className="bz-btn-primary" href={`/${locale}/business/pricing`}>
            {text.upgradeCta}
          </a>
        </div>
      </section>
    );
  }

  const eventLabels: Record<string, string> = {
    view: text.eventView,
    photo_view: text.eventPhoto,
    directions: text.eventDirections,
    call: text.eventCall,
    message: text.eventMessage
  };

  const funnelData = analytics.funnel.map((stage) => ({
    label: eventLabels[stage.type] ?? stage.type,
    value: stage.count,
    note:
      stage.type === "view" || stage.conversionFromView === null
        ? undefined
        : `${stage.conversionFromView}% ${text.ofViews}`
  }));

  return (
    <section className="mz-analytics">
      <header>
        <h1 className="mz-chart__title">{text.title}</h1>
        <p className="mz-stat__hint" style={{ marginBottom: 16 }}>
          {text.subtitle} · {text.window}
        </p>
      </header>

      <StatRow>
        <StatTile label={text.visits} value={String(analytics.visits.total)} />
        <StatTile label={text.unique} value={String(analytics.visits.unique)} />
        <StatTile
          label={text.rating}
          value={analytics.reviews.averageRating?.toFixed(2) ?? "—"}
          hint={`${analytics.reviews.count}`}
        />
        <StatTile
          label={text.revenue}
          value={formatMoney(analytics.revenue.totalAmount, analytics.revenue.currency, locale)}
        />
      </StatRow>

      <TrendChart
        points={analytics.visits.trend}
        title={text.visitTrend}
        emptyLabel={text.noData}
      />

      {/* Ordered stages → ordinal ramp, so the sequence reads as a sequence. */}
      <BarList data={funnelData} title={text.funnel} emptyLabel={text.noData} ramp />

      <TrendChart
        points={analytics.reviews.trend}
        title={text.ratingTrend}
        emptyLabel={text.noData}
      />

      {analytics.bookings.total > 0 ? (
        <BarList
          data={Object.entries(analytics.bookings.byStatus).map(([status, count]) => ({
            label: status.replace(/_/g, " "),
            value: count
          }))}
          title={text.bookings}
          emptyLabel={text.noData}
        />
      ) : null}
    </section>
  );
}
