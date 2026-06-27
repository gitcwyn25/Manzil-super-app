import type { Locale } from "@manzil/shared";

export function MobileNav({ locale }: { locale: Locale }) {
  return (
    <nav className="mobile-nav" aria-label="Mobil navigatsiya">
      <a href={`/${locale}`}>Asosiy</a>
      <a href={`/${locale}/discover`}>Izlash</a>
      <a href={`/${locale}#profile`}>Profil</a>
      <a href={`/${locale}#business`}>Biznes</a>
    </nav>
  );
}
