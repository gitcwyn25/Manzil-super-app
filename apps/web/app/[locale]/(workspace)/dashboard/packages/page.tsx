import type { Locale } from "@manzil/shared";
import type { ServicesCopy } from "../../../../components/workspace/services-manager";
import { ServicesManager } from "../../../../components/workspace/services-manager";
import { getMyBusinesses } from "../../../../lib/api";
import { getPackages } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/**
 * Services & pricing (Vibrant Marketplace, task D3). The server component
 * only fetches and assembles the trilingual strings; layout, the create-panel
 * toggle, and the search filter live in the client ServicesManager. Server
 * actions keep working from inside it (imported from the "use server"
 * crm-actions module).
 */
export default async function PackagesPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) return null;

  const data = await getPackages(business.slug);
  const packages = data?.packages ?? [];

  const strings: ServicesCopy = {
    title: copy.packages.title,
    subtitle: copy.packages.subtitle,
    addNew: copy.packages.addNew,
    newTitle: copy.packages.newTitle,
    name: copy.packages.name,
    description: copy.packages.description,
    price: copy.packages.price,
    submit: copy.packages.submit,
    activate: copy.packages.activate,
    deactivate: copy.packages.deactivate,
    deleteAria: copy.packages.deleteAria,
    empty: copy.packages.empty,
    noMatches: copy.packages.noMatches,
    // Same aggregate the overview KPI reports — one wording for one number.
    metricActive: copy.overview.activePackages,
    searchLabel: copy.packages.searchLabel,
    searchPlaceholder: copy.packages.searchPlaceholder,
    active: copy.packages.active,
    inactive: copy.packages.inactive
  };

  return (
    <ServicesManager
      businessSlug={business.slug}
      copy={strings}
      locale={locale}
      packages={packages}
    />
  );
}
