import { isLocale, type Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { LocaleLangSync } from "../components/locale-lang-sync";
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

  return (
    <>
      {/* The root layout renders <html lang="uz"> before the locale is known;
          correct it here so /ru and /en are announced correctly to assistive
          tech and to Lighthouse. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`
        }}
      />
      {/* Covers client-side (soft) navigations: the script above only runs on
          fresh parse, so a locale switch via router.push needs this to keep
          <html lang> correct without a full reload. */}
      <LocaleLangSync locale={locale as Locale} />
      <LocaleProviders locale={locale as Locale}>{children}</LocaleProviders>
    </>
  );
}
