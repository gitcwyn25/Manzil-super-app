import { isLocale, type Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { MobileNav } from "../components/mobile-nav";

export function generateStaticParams() {
  return [{ locale: "uz" }, { locale: "ru" }, { locale: "en" }];
}

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
      <Header locale={locale as Locale} />
      <main>{children}</main>
      <MobileNav locale={locale as Locale} />
      <Footer locale={locale as Locale} />
    </>
  );
}
