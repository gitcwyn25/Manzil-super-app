"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useState } from "react";
import { useUserPreferences } from "./user-preferences-provider";
import { Icon } from "./vm/icons";

/**
 * Ghost-button pair for the business-details action card (Vibrant
 * Marketplace). Save reuses the same user-preferences store as the legacy
 * SaveBusinessButton — one source of truth for saved state — and Share uses
 * the Web Share API with a clipboard fallback; no API calls, no invented
 * counts.
 */
export function SaveBusinessGhostButton({
  businessSlug,
  locale
}: {
  businessSlug: string;
  locale: Locale;
}) {
  const copy = getUiCopy(locale);
  const { isSaved, toggleSave } = useUserPreferences();
  const saved = isSaved(businessSlug);

  return (
    <button
      aria-pressed={saved}
      className="biz-ghost-btn"
      onClick={() => toggleSave(businessSlug)}
      type="button"
    >
      <Icon name="bookmark" size={16} />
      {saved ? copy.actions.saved : copy.actions.save}
    </button>
  );
}

export function ShareBusinessButton({ locale, name }: { locale: Locale; name: string }) {
  const copy = getUiCopy(locale);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // Dismissed the sheet or share failed — fall through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions) — the button simply stays idle.
    }
  }

  return (
    <button className="biz-ghost-btn" onClick={share} type="button">
      <Icon name="share" size={16} />
      {copied ? copy.business.shareCopied : copy.business.share}
    </button>
  );
}
