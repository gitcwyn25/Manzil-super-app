import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../../lib/locale-text";
import { getSubscriptionPlans } from "../../../lib/api";

export default async function BusinessPricingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const plans = await getSubscriptionPlans();

  return (
    <section className="section-block container pricing-page">
      <div className="section-heading">
        <p className="section-kicker">{copy.pricing.kicker}</p>
        <h1>{copy.pricing.title}</h1>
        <p>{copy.pricing.body}</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className={plan.highlight ? "pricing-card highlight" : "pricing-card"} key={plan.slug}>
            <p className="section-kicker">{pickLocalized(plan.name, locale)}</p>
            <h2>{pickLocalized(plan.priceLabel, locale)}</h2>
            <p>{pickLocalized(plan.description, locale)}</p>
            <ul className="pricing-features">
              {plan.features.map((feature) => (
                <li className={feature.included ? "included" : "excluded"} key={pickLocalized(feature.label, locale)}>
                  {feature.included ? "✓" : "—"} {pickLocalized(feature.label, locale)}
                </li>
              ))}
            </ul>
            <Link className={plan.highlight ? "gold-button" : "secondary-button"} href={`/${locale}/discover`}>
              {plan.slug === "starter" ? copy.pricing.freeStart : copy.pricing.comingSoon}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
