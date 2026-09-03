"use client";

import type { Locale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import Footer02 from "../../../../components/originkit/footer-02";

function withoutLocale(pathname: string | null) {
  return (pathname ?? "").replace(/^\/(?:uz|ru|en)(?=\/|$)/, "") || "/";
}

/**
 * Shared site footer selection.
 *
 * The consumer landing page and the main For Business page intentionally retain
 * their established Footer 01 showcase. All other public site routes use the
 * Originkit Footer 02 template.
 */
export function FooterTemplate({ locale }: { locale: Locale }) {
  const pathname = withoutLocale(usePathname());
  const keepFooter01 = pathname === "/" || pathname === "/business";

  return keepFooter01 ? <Footer locale={locale} /> : <Footer02 locale={locale} />;
}
