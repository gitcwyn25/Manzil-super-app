import type { Locale } from "@manzil/shared";

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>Manzil</strong>
        <p>O'zbekistonda mahalliy bizneslarni kashf qilish platformasi.</p>
      </div>
      <div className="footer-links">
        <a href={`/${locale}/discover`}>Kashfiyot</a>
        <a href={`/${locale}#business`}>Biznes qo'shish</a>
        <a href={`/${locale}#review`}>Sharh yozish</a>
      </div>
    </footer>
  );
}
