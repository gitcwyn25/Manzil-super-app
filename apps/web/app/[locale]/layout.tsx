import { isLocale, type Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { LocaleProviders } from "../components/locale-providers";

export function generateStaticParams() {
  return [{ locale: "uz" }, { locale: "ru" }, { locale: "en" }];
}

/**
 * Locale gate only. Chrome belongs to the shell layouts: (site) renders the
 * consumer header/nav/footer, (workspace) renders none of it. Putting chrome
 * here is what previously gave business owners a consumer header on /dashboard.
 */
export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <LocaleProviders locale={locale as Locale}>{children}</LocaleProviders>;
}
