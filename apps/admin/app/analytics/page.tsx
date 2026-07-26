import { consoleGet, getMe } from "@/lib/console";
import { PageHeader } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";
import { Bars, Card, Empty, Trend } from "@/components/charts";

export const dynamic = "force-dynamic";

type PlatformAnalytics = {
  windowDays: number;
  search: {
    total: number;
    zeroResult: number;
    zeroResultRate: number;
    topQueries: Array<{ query: string; count: number }>;
    unmetDemand: Array<{ query: string; count: number }>;
  };
  businesses: {
    newInWindow: number;
    growthTrend: Array<{ date: string; value: number }>;
    byStatus: Record<string, number>;
  };
  subscriptions: { byTier: Record<string, number>; total: number };
};

/** Ordered low → high so the ordinal ramp matches the tier progression. */
const TIER_ORDER = ["free", "pro", "max"];

export default async function AnalyticsPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;

  if (!me.permissions.includes("analytics.view")) {
    return <AccessDenied />;
  }

  const res = await consoleGet<PlatformAnalytics>("/analytics?days=30");

  if (!res.ok) {
    return (
      <>
        <PageHeader title="Platform analytics" subtitle="Last 30 days" />
        <p className="text-sm text-bad">{res.error}</p>
      </>
    );
  }

  const data = res.data;

  const tiers = TIER_ORDER.filter((tier) => tier in data.subscriptions.byTier).map((tier) => ({
    label: tier,
    value: data.subscriptions.byTier[tier]
  }));

  const statuses = Object.entries(data.businesses.byStatus)
    .map(([status, count]) => ({ label: status.replace(/_/g, " "), value: count }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader title="Platform analytics" subtitle={`Last ${data.windowDays} days`} />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-3xl font-semibold">{data.search.total}</div>
          <div className="mt-1 text-sm text-muted">Searches</div>
        </div>
        <div className="card p-5">
          {/* The number that drives seeding decisions, so it leads. */}
          <div className="text-3xl font-semibold">{data.search.zeroResultRate}%</div>
          <div className="mt-1 text-sm text-muted">Zero-result rate</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-semibold">{data.businesses.newInWindow}</div>
          <div className="mt-1 text-sm text-muted">New businesses</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-semibold">{data.subscriptions.total}</div>
          <div className="mt-1 text-sm text-muted">Subscriptions</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Unmet demand"
          subtitle="Searches that returned nothing — these name the categories and districts to seed next"
        >
          {data.search.unmetDemand.length > 0 ? (
            <Bars
              data={data.search.unmetDemand.map((q) => ({ label: q.query, value: q.count }))}
              emptyLabel="No zero-result searches yet"
            />
          ) : (
            <Empty label="No zero-result searches yet" />
          )}
        </Card>

        <Card title="Top searches" subtitle="What people look for most">
          <Bars
            data={data.search.topQueries.map((q) => ({ label: q.query, value: q.count }))}
            emptyLabel="No searches recorded yet"
          />
        </Card>

        <Card title="Business growth" subtitle="New listings per day">
          <Trend points={data.businesses.growthTrend} emptyLabel="No new businesses in this window" />
        </Card>

        <Card title="Subscription tiers" subtitle="Distribution across plans">
          {/* Ordered tiers → ordinal ramp, so free→pro→max reads as a progression. */}
          <Bars data={tiers} emptyLabel="No subscriptions yet" ramp />
        </Card>

        <Card title="Businesses by status" subtitle="Whole catalogue, not just this window">
          <Bars data={statuses} emptyLabel="No businesses yet" />
        </Card>
      </div>
    </>
  );
}
