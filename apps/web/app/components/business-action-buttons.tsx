"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useState } from "react";
import { getPxsCopy } from "../lib/pxs/copy";
import { useAnnounce } from "./pxs/announcer";
import { useToast } from "./pxs/toast";
import { useUserPreferences } from "./user-preferences-provider";
import { Icon } from "./vm/icons";

/**
 * Ghost-button pair for the business-details action card (Vibrant
 * Marketplace). Save reuses the same user-preferences store as the legacy
 * SaveBusinessButton — one source of truth for saved state — and Share uses
 * the Web Share API with a clipboard fallback; no API calls, no invented
 * counts.
 */

/**
 * The Save control, and the reference adoption of the PXS feedback contract
 * (Epic 17).
 *
 * Before: the label flipped and `aria-pressed` changed, which is genuinely all
 * a sighted mouse user needs — but nothing was announced, nothing acknowledged
 * the write, and a storage failure was invisible. This is the surface users
 * reported as "the Save button does nothing".
 *
 * After, every piece corresponding to something real:
 *   - the toggle applies **optimistically** and reverts if the write to
 *     `localStorage` throws (`UserPreferencesProvider`);
 *   - `aria-busy` reflects the actual in-flight write;
 *   - the new state is **announced**, so the change is perceivable without
 *     watching the label;
 *   - a failed write raises a pinned red toast naming the real cause — from
 *     the provider, so every consumer of the store inherits it rather than
 *     each button re-implementing it.
 *
 * Deliberately absent: a success toast. Saving is a high-frequency, instantly
 * visible, trivially reversible action; a card confirming each one would be
 * noise. The announcement carries it for assistive technology, which is the
 * only audience the label change does not already reach.
 */
export function SaveBusinessGhostButton({
  businessSlug,
  locale
}: {
  businessSlug: string;
  locale: Locale;
}) {
  const copy = getUiCopy(locale);
  const { isSaved, toggleSave, persisting } = useUserPreferences();
  const announce = useAnnounce();
  const saved = isSaved(businessSlug);

  return (
    <button
      aria-busy={persisting}
      aria-pressed={saved}
      className="biz-ghost-btn"
      onClick={() => {
        toggleSave(businessSlug);
        // The state after the toggle. If the write fails the provider reverts
        // and announces the failure assertively, which supersedes this.
        announce(saved ? copy.actions.save : copy.actions.saved, "polite");
      }}
      type="button"
    >
      <Icon name="bookmark" size={16} />
      {saved ? copy.actions.saved : copy.actions.save}
    </button>
  );
}

export function ShareBusinessButton({ locale, name }: { locale: Locale; name: string }) {
  const copy = getUiCopy(locale);
  const pxs = getPxsCopy(locale);
  const { toast } = useToast();
  const announce = useAnnounce();
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
      // The label change is visible; the announcement is what makes it
      // perceivable without sight, and it is the only confirmation a
      // screen-reader user gets that the link is on the clipboard.
      announce(copy.business.shareCopied, "polite");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Was a silent dead end: on a browser that denies clipboard access the
      // button did nothing at all and said nothing about it, which reads
      // exactly like a broken control.
      toast({
        intent: "warning",
        title: pxs.async.failed,
        body: url,
        key: "share-clipboard-blocked"
      });
    }
  }

  return (
    <button className="biz-ghost-btn" onClick={share} type="button">
      <Icon name="share" size={16} />
      {copied ? copy.business.shareCopied : copy.business.share}
    </button>
  );
}
