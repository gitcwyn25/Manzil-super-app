import type { Locale } from "@manzil/shared";

export function MobileNav({ locale }: { locale: Locale }) {
  return (
    <nav className="mobile-nav" aria-label="Mobil navigatsiya">
      <a href={`/${locale}`}>Feed</a>
      <a href={`/${locale}/discover`}>Kashfiyot</a>
      <a href={`/${locale}/concierge`}>Concierge</a>
      <a href={`/${locale}/profile`}>Profil</a>
    </nav>
  );
}
