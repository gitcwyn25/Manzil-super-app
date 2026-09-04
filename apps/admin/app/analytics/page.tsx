import type { ReactNode } from "react";
import { consoleGet, getMe } from "@/lib/console";
import { PageHeader } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bars, Empty, Trend } from "@/components/charts";

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

const TIER_ORDER = ["free", "pro", "max"];

export default async function AnalyticsPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("analytics.view")) return <AccessDenied />;

  const res = await consoleGet<PlatformAnalytics>("/analytics?days=30");
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Platform analytics" subtitle="Last 30 days" />
        <Alert variant="destructive"><AlertTitle>Analytics unavailable</AlertTitle><AlertDescription>{res.error}</AlertDescription></Alert>
      </>
    );
  }

  const data = res.data;
  const tiers = TIER_ORDER.filter((tier) => tier in data.subscriptions.byTier).map((tier) => ({ label: tier, value: data.subscriptions.byTier[tier] }));
  const statuses = Object.entries(data.businesses.byStatus).map(([status, count]) => ({ label: status.replace(/_/g, " "), value: count })).sort((a, b) => b.value - a.value);
  const stats = [
    { label: "Searches", value: data.search.total, note: "recorded in window" },
    { label: "Zero-result rate", value: `${data.search.zeroResultRate}%`, note: `${data.search.zeroResult} unmet searches` },
    { label: "New businesses", value: data.businesses.newInWindow, note: `last ${data.windowDays} days` },
    { label: "Subscriptions", value: data.subscriptions.total, note: "current total" }
  ];

  return (
    <>
      <PageHeader title="Platform analytics" subtitle={`Last ${data.windowDays} days`} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="font-data text-2xl tracking-[-0.04em] text-fg sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-fg">{stat.label}</div>
              <div className="mt-1 text-xs text-muted">{stat.note}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Unmet demand" subtitle="Searches that returned nothing — where seeding can create immediate value"><Bars data={data.search.unmetDemand.map((query) => ({ label: query.query, value: query.count }))} emptyLabel="No zero-result searches yet" /></ChartCard>
        <ChartCard title="Top searches" subtitle="What people look for most"><Bars data={data.search.topQueries.map((query) => ({ label: query.query, value: query.count }))} emptyLabel="No searches recorded yet" /></ChartCard>
        <ChartCard title="Business growth" subtitle="New listings per day"><Trend points={data.businesses.growthTrend} emptyLabel="No new businesses in this window" /></ChartCard>
        <ChartCard title="Subscription tiers" subtitle="Distribution across plans"><Bars data={tiers} emptyLabel="No subscriptions yet" ramp /></ChartCard>
        <ChartCard title="Businesses by status" subtitle="Whole catalogue, not just this window"><Bars data={statuses} emptyLabel="No businesses yet" /></ChartCard>
      </div>
    </>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><p className="text-xs leading-5 text-muted">{subtitle}</p></CardHeader><CardContent>{children}</CardContent></Card>;
}
