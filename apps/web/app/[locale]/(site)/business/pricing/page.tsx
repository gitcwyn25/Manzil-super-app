import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../../../lib/locale-text";
import type { Metadata } from "next";
import { JsonLd } from "../../../../components/json-ld";
import { getSubscriptionPlans } from "../../../../lib/api";
import { planFeatureLabel } from "../../../../lib/plans";
import { routeMetadata } from "../../../../lib/seo";
import { routeBreadcrumb } from "../../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("pricing", locale);
}

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
      <JsonLd data={routeBreadcrumb(locale, ["home", "business", "pricing"])} />
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
              {/* A feature row whose label is still a raw entitlement key
                  (`crm.segments`) is dropped rather than printed — see
                  planFeatureLabel. */}
              {plan.features.map((feature) => {
                const label = planFeatureLabel({ label: feature.label }, locale);

                if (!label) {
                  return null;
                }

                return (
                  <li className={feature.included ? "included" : "excluded"} key={label}>
                    {feature.included ? "✓" : "—"} {label}
                  </li>
                );
              })}
            </ul>
            <Link className={plan.highlight ? "gold-button" : "secondary-button"} href={`/${locale}/discover`}>
              {String(plan.slug) === "starter" ? copy.pricing.freeStart : copy.pricing.comingSoon}
            </Link>
          </article>
        ))}
      </div>

      <p className="bz-pricing-waitlist">
        <a href={`/${locale}/waitlist/pro`}>Manzil Pro →</a>
      </p>
    </section>
  );
}
