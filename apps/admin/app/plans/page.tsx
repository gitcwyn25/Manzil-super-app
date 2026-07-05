import { AccessDenied } from "@/components/access-denied";
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
      <PageHeader
        title="Plans & pricing"
        subtitle="Prices are dynamic — edits take effect immediately across the public pricing page and plan selection. Every change is audited."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{plan.name.en}</h2>
              <Badge tone={plan.isActive ? "good" : "muted"}>{plan.isActive ? "active" : "hidden"}</Badge>
            </div>
            <div className="mt-4">
              <PlanPriceEditor price={plan.priceMonthly} tier={plan.tier} />
            </div>
            <dl className="mt-4 space-y-1 text-sm text-muted">
              <div className="flex justify-between"><dt>Photo limit</dt><dd className="text-fg">{plan.photoLimit ?? "∞"}</dd></div>
              <div className="flex justify-between"><dt>Staff seats</dt><dd className="text-fg">{plan.staffLimit}</dd></div>
              <div className="flex justify-between"><dt>Locations</dt><dd className="text-fg">{plan.locationLimit}</dd></div>
            </dl>
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Entitlements</div>
              <div className="flex flex-wrap gap-1">
                {plan.features.filter((f) => f.included).map((f) => (
                  <span key={f.key} className="rounded bg-panel-2 px-2 py-0.5 font-mono text-[11px] text-muted">{f.key}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {plans.length === 0 ? <div className="card p-10 text-center text-muted">No plans configured.</div> : null}
      </div>
    </>
  );
}
