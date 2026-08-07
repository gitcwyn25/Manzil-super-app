"use client";

import type { Locale } from "@manzil/shared";
import { useEffect } from "react";

/**
 * Keeps `<html lang>` correct across client-side locale switches.
 *
 * `app/[locale]/layout.tsx` now renders `<html lang={locale}>` itself, so the
 * server HTML is correct for crawlers and for a no-JS visitor — the inline
 * `<script>` that used to patch `documentElement.lang` after parse is gone.
 * What remains is the soft-navigation case: `router.push` from
 * `LocaleSwitcher.switchTo` swaps the tree without re-parsing the document, so
 * this effect re-runs whenever `locale` changes and keeps the attribute
 * honest through a client-side /uz -> /ru switch.
 */
export function LocaleLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
