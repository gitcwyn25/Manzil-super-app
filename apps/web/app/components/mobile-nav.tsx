import type { Locale } from "@manzil/shared";
import { MobileSiteNav } from "./site-nav";

export function MobileNav({ locale }: { locale: Locale }) {
  return <MobileSiteNav locale={locale} />;
}
