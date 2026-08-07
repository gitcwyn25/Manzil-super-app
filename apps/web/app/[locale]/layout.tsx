import { ClerkProvider } from "@clerk/nextjs";
import { isLocale, type Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentShell } from "../components/document-shell";
import { JsonLd } from "../components/json-ld";
import { LocaleLangSync } from "../components/locale-lang-sync";
import { LocaleProviders } from "../components/locale-providers";
import { languageAlternates } from "../lib/seo";
import { organizationSchema, websiteSchema } from "../lib/structured-data";

export function generateStaticParams() {
  return [{ locale: "uz" }, { locale: "ru" }, { locale: "en" }];
}

/**
 * Locale-level metadata: the hreflang cluster and the OG locale tags that every
 * route below inherits. Individual pages add their own title, description and
 * canonical through `app/lib/seo.ts`; the alternates here are the fallback for
 * anything that does not.
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates("")
    }
  };
}

/**
 * Locale gate and document owner.
 *
 * Chrome belongs to the shell layouts: (site) renders the consumer
 * header/nav/footer, (workspace) renders none of it. Putting chrome here is
 * what previously gave business owners a consumer header on /dashboard.
 *
 * What *does* belong here is `<html lang>`: this is the first layout that knows
 * the locale, so rendering the document from here is what makes `/ru` and
 * `/en` announce themselves correctly in the server HTML rather than being
 * patched up client-side.
 *
 * Organization and WebSite JSON-LD are emitted once per document here, so
 * every page inherits the publisher entity and the sitelinks SearchAction
 * without repeating them.
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
    // Unchanged position relative to the document: ClerkProvider wrapped
    // <html> in the old root layout and still does, one segment lower.
    <ClerkProvider>
      <DocumentShell lang={locale as Locale}>
        <JsonLd data={[organizationSchema(locale as Locale), websiteSchema(locale as Locale)]} />
        {/* `lang` is now correct in SSR. This only covers client-side (soft)
            locale switches, where the document element is not re-parsed. */}
        <LocaleLangSync locale={locale as Locale} />
        <LocaleProviders locale={locale as Locale}>{children}</LocaleProviders>
      </DocumentShell>
    </ClerkProvider>
  );
}
