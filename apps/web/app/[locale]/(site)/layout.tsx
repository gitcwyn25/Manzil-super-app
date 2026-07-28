import type { Locale } from "@manzil/shared";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";
import { MobileNav } from "../../components/mobile-nav";

/**
 * Consumer and marketing surfaces. Full chrome, editorial density.
 * The locale is already validated by app/[locale]/layout.tsx.
 */
export default async function SiteLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="site-root" data-shell="site">
      <Header locale={locale as Locale} />
      <main>{children}</main>
      <MobileNav locale={locale as Locale} />
      <Footer locale={locale as Locale} />
    </div>
  );
}
