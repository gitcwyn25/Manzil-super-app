import type { Metadata } from "next";
import { LocalizedNotFound } from "../../components/localized-not-found";

export const metadata: Metadata = {
  title: "Sahifa topilmadi",
  robots: { index: false, follow: false }
};

/**
 * 404 inside the consumer shell — the boundary for `notFound()` thrown by a
 * detail page whose record does not exist (business, community list,
 * occasion). Distinct from `app/[locale]/not-found.tsx` only in that it
 * renders inside the (site) layout, so a visitor who lands on a dead business
 * link keeps the header, nav and footer and can carry on browsing.
 */
export default function SiteNotFound() {
  return <LocalizedNotFound />;
}
