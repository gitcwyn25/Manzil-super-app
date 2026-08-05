"use client";

import type { Locale } from "@manzil/shared";
import { useCallback } from "react";
import { getLandingCopy } from "../lib/landing-copy";
import { BootstrapOffcanvas } from "./bootstrap-offcanvas";
import { MobileSiteNav } from "./site-nav";

// Keep in sync with header.tsx's hamburger `data-bs-target`. The two
// components share no React state — the header's trigger is a plain
// `data-bs-toggle="offcanvas"` button, wired up by Bootstrap's own data-api
// the moment this component's dynamic import (inside BootstrapOffcanvas)
// runs. That lets the trigger live in the header's normal flex flow while
// the panel itself renders here, after `<main>`, exactly as SiteLayout wires
// it today.
const PANEL_ID = "mobile-nav-panel";

const MENU_LABEL: Record<Locale, string> = { uz: "Menyu", ru: "Меню", en: "Menu" };

export function MobileNav({ locale }: { locale: Locale }) {
  const landing = getLandingCopy(locale);
  // Bootstrap's data-api drives open/close directly; React never tracks the
  // panel's state, so `open` stays false and `onClose` is a stable no-op.
  const onClose = useCallback(() => {}, []);

  return (
    <BootstrapOffcanvas id={PANEL_ID} title={MENU_LABEL[locale]} open={false} onClose={onClose}>
      <MobileSiteNav locale={locale} />
      <a className="site-nav__pill mobile-nav-cta" href={`/${locale}/business/register`}>
        {landing.cta}
      </a>
    </BootstrapOffcanvas>
  );
}
