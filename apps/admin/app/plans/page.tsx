import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanPriceEditor } from "@/components/plan-price-editor";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader } from "@/lib/ui";

export const dynamic = "force-dynamic";

type AdminPlan = {
  id: string;
  tier: string;
  name: { uz: string; ru: string; en: string };
  priceMonthly: number;
  currency: string;
  photoLimit: number | null;
  staffLimit: number;
  locationLimit: number;
  isActive: boolean;
  features: Array<{ key: string; included: boolean }>;
};

export default async function PlansPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("plan.manage")) return <AccessDenied missing="plan.manage" />;

  const res = await consoleGet<{ plans: AdminPlan[] }>("/plans");
  const plans = res.ok ? res.data.plans : [];

  return (
    <>
      <PageHeader title="Plans & pricing" subtitle="Prices are dynamic, audited, and reflected in the public plan-selection flow." />

      {!res.ok ? <Alert variant="destructive" className="mb-5"><AlertTitle>Pricing catalog unavailable</AlertTitle><AlertDescription>{res.error}</AlertDescription></Alert> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="overflow-hidden">
            <CardHeader className="border-b border-border bg-background/40">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{plan.name.en}</CardTitle>
                <Badge tone={plan.isActive ? "good" : "muted"}>{plan.isActive ? "active" : "hidden"}</Badge>
              </div>
              <p className="font-data text-xs uppercase tracking-[0.14em] text-muted">{plan.tier} · {plan.currency}</p>
            </CardHeader>
            <CardContent className="p-5">
              <PlanPriceEditor price={plan.priceMonthly} tier={plan.tier} />
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Photo limit</dt><dd className="text-fg">{plan.photoLimit ?? "∞"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Staff seats</dt><dd className="text-fg">{plan.staffLimit}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Locations</dt><dd className="text-fg">{plan.locationLimit}</dd></div>
              </dl>
              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Entitlements</div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.filter((feature) => feature.included).map((feature) => <span key={feature.key} className="rounded-md border border-border bg-background px-2 py-1 font-data text-[11px] text-muted">{feature.key}</span>)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 ? <Card className="lg:col-span-3"><CardContent className="p-10 text-center text-sm text-muted">{res.ok ? "No plans configured." : "No pricing data was returned."}</CardContent></Card> : null}
      </div>
    </>
  );
}
