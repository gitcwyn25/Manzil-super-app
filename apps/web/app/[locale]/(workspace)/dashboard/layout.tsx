import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { CrmSidebar } from "../../../components/crm/crm-sidebar";
import { getMyBusinesses } from "../../../lib/api";
import { getSubscription } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
  const { userId } = await auth();

  if (!userId) {
    return (
      <section className="crm-auth-panel">
        <h1>{copy.common.signInPrompt}</h1>
        <a className="bz-btn-primary" href={`/${locale}/sign-in`}>{copy.register.signIn}</a>
      </section>
    );
  }

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    return (
      <section className="crm-auth-panel">
        <h1>{copy.common.noBusiness}</h1>
        <p>{copy.common.noBusinessText}</p>
        <a className="bz-btn-primary" href={`/${locale}/business/register`}>{copy.common.registerCta}</a>
      </section>
    );
  }

  const subscriptionData = await getSubscription(business.slug);
  const plan = subscriptionData?.subscription?.plan ?? "free";
  const planLabel = `${copy.menu.plan}: ${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;

  const base = `/${locale}/dashboard`;
  const items = [
    { key: "overview", label: copy.menu.overview, href: base, exact: true },
    { key: "bookings", label: copy.menu.bookings, href: `${base}/bookings` },
    { key: "announcements", label: copy.menu.announcements, href: `${base}/announcements` },
    { key: "packages", label: copy.menu.packages, href: `${base}/packages` },
    { key: "reviews", label: copy.menu.reviews, href: `${base}/reviews` },
    { key: "analytics", label: copy.menu.analytics, href: `${base}/analytics` },
    { key: "customers", label: copy.menu.customers, href: `${base}/customers` },
    { key: "settings", label: copy.menu.settings, href: `${base}/settings` }
  ];

  return (
    <div className="crm-shell">
      <CrmSidebar
        businessName={business.name}
        businessSlug={business.slug}
        items={items}
        locale={locale as Locale}
        planLabel={planLabel}
        sectionLabel={copy.menu.section}
        upgradeLabel={copy.menu.upgrade}
        viewPublicLabel={copy.menu.viewPublic}
      />
      <main className="crm-main">{children}</main>
    </div>
  );
}
