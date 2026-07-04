import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { getBusinessLandingCopy } from "../../../lib/business-landing-copy";
import { choosePlanAction } from "../../../lib/crm-actions";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

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

  const plans = [
    { key: "free", plan: landing.plans.free, highlight: false, badge: undefined as string | undefined },
    { key: "pro", plan: landing.plans.pro, highlight: false, badge: undefined as string | undefined },
    { key: "max", plan: landing.plans.max, highlight: true, badge: landing.plans.max.badge }
  ];

  return (
    <section className="crm-plans">
      <header className="crm-register-head">
        <h1>{copy.plans.title}</h1>
        <p>{copy.plans.subtitle}</p>
      </header>

      <div className="bz-plans">
        {plans.map(({ key, plan, highlight, badge }) => (
          <article className={highlight ? "bz-plan highlight" : "bz-plan"} key={key}>
            {badge ? <span className="bz-plan-badge">{badge}</span> : null}
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
              <input name="plan" type="hidden" value={key} />
              <button className={highlight ? "bz-btn-primary full" : "bz-btn-ghost full"} type="submit">
                {copy.plans.choose}
              </button>
            </form>
          </article>
        ))}
      </div>

      <p className="crm-hint center">{copy.plans.note}</p>
    </section>
  );
}
