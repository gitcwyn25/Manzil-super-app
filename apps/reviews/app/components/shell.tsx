"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, ChevronDown, MapPin, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "./providers";
import type { Locale } from "../lib/api";
export function Mark() { return <svg width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="14" fill="currentColor"/><path d="M13 35V22C13 15.9 17.9 11 24 11S35 15.9 35 22V35H28V22A4 4 0 0 0 20 22V35H13Z" fill="white"/><path d="M20 35H28" stroke="#83FD90" strokeWidth="3"/></svg>; }
export function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, user, authReady, signOut } = useApp();
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  return <><a className="skip" href="#main">Skip to content</a><header className="site-header"><div className="header-inner"><Link className="wordmark" href="/" onClick={() => setMenu(false)}><Mark/><span>manzil<span className="brand-sub">reviews</span></span></Link><nav aria-label="Primary navigation" className={menu ? "header-nav is-open" : "header-nav"}>
    <Link aria-current={path === "/" ? "page" : undefined} href="/" onClick={() => setMenu(false)}>{t.explore}</Link><Link href="/saved" onClick={() => setMenu(false)}><Bookmark size={16}/>{t.saved}</Link><Link href="/owners" onClick={() => setMenu(false)}>{t.owners}</Link>
    <a href="https://manzilgroup.uz/discover" className="hub-link">All Manzil apps ↗</a>
  </nav><div className="header-actions"><label className="language"><span className="sr-only">Language</span><select value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="en">EN</option><option value="uz">UZ</option><option value="ru">RU</option></select><ChevronDown size={12}/></label>{authReady && user ? <Link className="account-link" href="/profile" aria-label={t.profile}><UserRound size={19}/><span>{t.profile}</span></Link> : <Link className="button small" href="/auth">{t.signIn}</Link>}<button className="mobile-menu icon-button" aria-label={menu ? "Close navigation" : "Open navigation"} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div></div></header>
  <main id="main">{children}</main><footer className="site-footer"><div className="footer-inner"><div><Link href="/" className="wordmark"><Mark/><span>manzil<span className="brand-sub">reviews</span></span></Link><p>{t.community}</p><span className="city-label"><MapPin size={14}/>Tashkent, Uzbekistan</span></div><div className="footer-links"><a href="https://manzilgroup.uz/discover">Manzil apps</a><Link href="/add-business">{t.add}</Link><a href="https://manzilgroup.uz/en/terms">Terms</a><a href="https://manzilgroup.uz/en/privacy">Privacy</a><a href="/photography.html">Photo credits</a>{user && <button onClick={() => void signOut()}>{t.signOut}</button>}</div></div><div className="footer-bottom">© {new Date().getFullYear()} Manzil Group · Local experiences, shared thoughtfully.</div></footer></>;
}
