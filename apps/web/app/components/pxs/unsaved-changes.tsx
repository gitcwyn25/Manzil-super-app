"use client";

import type { Locale } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getPxsCopy } from "../../lib/pxs/copy";
import { ConfirmDialog } from "./dialog";

/**
 * Unsaved-changes warning for a form with real work in it.
 *
 * Two exits have to be covered, and they need different mechanisms:
 *
 *   1. **Leaving the site** (close tab, back button, typed URL) — the
 *      `beforeunload` event. Every modern browser ignores custom text here and
 *      shows its own wording, so `copy.unsaved.beforeUnload` exists for the
 *      handful that still honour it and is not relied on.
 *   2. **Navigating within the app** — a capture-phase click listener on
 *      internal links. Next.js client navigation never fires `beforeunload`,
 *      so without this the most likely way to lose a half-filled form (a click
 *      on the header logo) is the one path that is not guarded.
 *
 * The in-app interception is deliberately narrow. It ignores new-tab modifier
 * clicks, `target="_blank"`, `download`, non-HTTP schemes and any link
 * resolving to the current path — a guard that fires on a same-page anchor
 * teaches users to click through the dialog without reading it.
 *
 * `dirty` must be driven by real form state. A guard that is always on is a
 * guard everyone learns to dismiss.
 */
export function UnsavedChangesGuard({
  dirty,
  locale,
  title,
  body
}: {
  dirty: boolean;
  locale: Locale;
  title?: string;
  body?: string;
}) {
  const copy = getPxsCopy(locale);
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // `preventDefault()` is the specified trigger; `returnValue` is the
      // legacy one. Both are needed for full browser coverage.
      event.preventDefault();
      event.returnValue = copy.unsaved.beforeUnload;
      return copy.unsaved.beforeUnload;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, copy.unsaved.beforeUnload]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      // Modifier clicks open a new tab or window; the current one — with the
      // form still in it — is not going anywhere.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External destinations are handled by `beforeunload`; anything that is
      // not http(s) (mailto:, tel:) does not navigate the document away.
      if (url.origin !== window.location.origin || !url.protocol.startsWith("http")) {
        return;
      }
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  const leave = useCallback(() => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) {
      router.push(href);
    }
  }, [pendingHref, router]);

  return (
    <ConfirmDialog
      cancelLabel={copy.unsaved.stay}
      confirmLabel={copy.unsaved.leave}
      intent="warning"
      locale={locale}
      onCancel={() => setPendingHref(null)}
      onConfirm={leave}
      open={pendingHref !== null}
      description={body ?? copy.unsaved.body}
      title={title ?? copy.unsaved.title}
    />
  );
}

/**
 * Tracks whether a form has been modified since it was rendered.
 *
 * Listens for `input` and `change` on the form element, which covers native
 * controls, pasted text and autofill alike — far more reliable than mirroring
 * thirteen fields into React state purely to answer "is this dirty?".
 *
 * `reset()` is called on submit so the guard does not fire on the navigation
 * that the successful submit itself causes.
 */
export function useFormDirty(formRef: React.RefObject<HTMLFormElement | null>): {
  dirty: boolean;
  reset: () => void;
} {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const onInput = () => setDirty(true);
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);

    const onSubmit = () => setDirty(false);
    form.addEventListener("submit", onSubmit);

    return () => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("submit", onSubmit);
    };
  }, [formRef]);

  return { dirty, reset: useCallback(() => setDirty(false), []) };
}
