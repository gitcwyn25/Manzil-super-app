"use client";

import type { Locale } from "@manzil/shared";
import { useCallback } from "react";
import { BootstrapOffcanvas } from "./bootstrap-offcanvas";

const PANEL_ID = "mobile-nav-panel";
const MENU_LABEL: Record<Locale, string> = { uz: "Menyu", ru: "Меню", en: "Menu" };

export function MobileNav({ locale }: { locale: Locale }) {
  const onClose = useCallback(() => {}, []);

  return (
    <BootstrapOffcanvas id={PANEL_ID} title={MENU_LABEL[locale]} open={false} onClose={onClose}>
      <a className="site-nav__pill mobile-nav-cta" href={`/${locale}/business/register`}>
        {locale === "uz" ? "Biznesni ro'yxatdan o'tkazish" : locale === "ru" ? "Зарегистрировать бизнес" : "Register Business"}
      </a>
    </BootstrapOffcanvas>
  );
}
