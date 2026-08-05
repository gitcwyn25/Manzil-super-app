"use client";

import type { Locale } from "@manzil/shared";
import { useEffect } from "react";

/**
 * Keeps `<html lang>` correct across client-side locale switches.
 *
 * The locale layout's inline `<script>` sets `document.documentElement.lang`
 * on first paint (fresh parse / hard navigation), which is what a crawler or
 * a no-JS-yet visitor sees. But App Router soft navigations — e.g.
 * `router.push` from `LocaleSwitcher.switchTo` — reconcile that script node's
 * text content without re-executing it, so a client-side /uz -> /ru switch
 * would otherwise leave `lang="uz"` on Russian content. This effect re-runs
 * on every render where `locale` changes, covering exactly that gap.
 */
export function LocaleLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
