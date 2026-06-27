import type { Locale } from "@manzil/shared";

export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="site-header">
      <a className="brand" href={`/${locale}`} aria-label="Manzil bosh sahifa">
        <span className="brand-mark">M</span>
        <span>Manzil</span>
      </a>
      <nav className="desktop-nav" aria-label="Asosiy navigatsiya">
        <a href={`/${locale}/discover`}>Kashfiyot</a>
        <a href={`/${locale}#reviews`}>Sharhlar</a>
        <a href={`/${locale}#business`}>Biznes egalari</a>
        <a href={`/${locale}/admin`}>Admin</a>
      </nav>
      <div className="header-actions">
        <a className="language-button" href="/uz">UZ</a>
        <a className="language-button" href="/ru">RU</a>
        <a className="language-button" href="/en">EN</a>
        <a className="ghost-button" href={`/${locale}#business`}>Biznes qo'shish</a>
        <a className="primary-button small" href={`/${locale}/discover`}>Izlash</a>
      </div>
    </header>
  );
}
