import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { PlanSubmit } from "../../../../components/crm/plan-submit";
import { getBusinessLandingCopy } from "../../../../lib/business-landing-copy";
import { choosePlanAction } from "../../../../lib/crm-actions";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatPrice, getPlans, planFeatureLabel } from "../../../../lib/plans";
import type { Metadata } from "next";
import { routeMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("plans", locale);
}

export default async function PlanSelectionPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ business?: string }>;
}) {
  const [{ locale }, { business }] = await Promise.all([params, searchParams]);
  const copy = getCrmCopy(locale);
  const landing = getBusinessLandingCopy(locale);
  const { userId } = await auth();

  if (!userId || !business) {
    return (
      <section className="crm-auth-panel">
        <h1>{copy.register.signInFirst}</h1>
        <a className="bz-btn-primary" href={`/${locale}/business/register`}>{copy.common.registerCta}</a>
      </section>
    );
  }

  const apiPlans = await getPlans();
  const plans = apiPlans.length
    ? apiPlans.map((p) => ({
        key: p.tier,
        name: p.name[locale] ?? p.name.uz,
        price: formatPrice(p.priceMonthly, p.currency, locale),
        features: p.features
          .filter((f) => f.included)
          .map((f) => planFeatureLabel(f, locale))
          .filter((label): label is string => Boolean(label)),
        highlight: p.tier === "max",
        badge: p.tier === "max" ? landing.plans.max.badge : (undefined as string | undefined)
      }))
    : (["free", "pro", "max"] as const).map((tier) => ({
        key: tier,
        name: landing.plans[tier].name,
        price: landing.plans[tier].price,
        features: [...landing.plans[tier].features],
        highlight: tier === "max",
        badge: tier === "max" ? landing.plans.max.badge : (undefined as string | undefined)
      }));

  return (
    <section className="crm-plans">
      <header className="crm-register-head">
        <h1>{copy.plans.title}</h1>
        <p>{copy.plans.subtitle}</p>
      </header>

      <div className="bz-plans">
        {plans.map((plan) => (
          <article className={plan.highlight ? "bz-plan highlight" : "bz-plan"} key={plan.key}>
            {plan.badge ? <span className="bz-plan-badge">{plan.badge}</span> : null}
            <h3>{plan.name}</h3>
            <p className="bz-plan-price">
              {plan.price}
              <em>{landing.perMonth}</em>
            </p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <form action={choosePlanAction}>
              <input name="locale" type="hidden" value={locale} />
              <input name="business" type="hidden" value={business} />
              <input name="plan" type="hidden" value={plan.key} />
              <PlanSubmit highlight={plan.highlight} label={copy.plans.choose} pendingLabel={copy.plans.choosing} />
            </form>
          </article>
        ))}
      </div>

      <p className="crm-hint center">{copy.plans.note}</p>
    </section>
  );
}
