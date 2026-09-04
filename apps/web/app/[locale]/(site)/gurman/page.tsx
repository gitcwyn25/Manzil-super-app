import type { Locale } from "@manzil/shared";
import { permanentRedirect } from "next/navigation";

export default async function RetiredGurmanRoute({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/waitlist/gurman`);
}
