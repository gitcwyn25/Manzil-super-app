import type { Locale } from "@manzil/shared";
import { permanentRedirect } from "next/navigation";

export default async function RetiredConciergeRoute({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/waitlist/gurman`);
}
