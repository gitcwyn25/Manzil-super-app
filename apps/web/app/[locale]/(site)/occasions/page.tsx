import { redirect } from "next/navigation";
import type { Locale } from "@manzil/shared";

/**
 * Events / Occasions are now unified into the Discover page.
 */
export default async function OccasionsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/discover`);
}
