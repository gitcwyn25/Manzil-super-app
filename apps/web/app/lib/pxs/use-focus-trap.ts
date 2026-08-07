"use client";

import { useEffect, type RefObject } from "react";

/**
 * Everything the platform treats as tabbable. `[tabindex]:not([tabindex="-1"])`
 * covers custom widgets; the `:not([disabled])` guards keep a disabled control
 * from being handed focus.
 */
const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
    // `offsetParent === null` catches display:none and detached subtrees;
    // `getClientRects` catches visibility:hidden and zero-size elements. A
    // hidden control that still matches the selector would otherwise become a
    // dead stop in the tab cycle.
    if (element.hasAttribute("inert") || element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    return element.offsetParent !== null || element.getClientRects().length > 0;
  });
}

export type FocusTrapOptions = {
  /**
   * Where focus goes when the trap opens. Defaults to the first focusable
   * element, falling back to the container itself (which is why the container
   * should carry `tabIndex={-1}`).
   */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * Where focus returns when the trap closes. Defaults to whatever was focused
   * at the moment it opened — the button that opened the dialog, in practice.
   */
  returnFocus?: RefObject<HTMLElement | null>;
};

/**
 * WCAG 2.4.3 / 2.1.2 focus management for a modal surface.
 *
 * Three obligations, all handled here so no dialog has to remember them:
 *   1. **Move focus in.** An opened dialog that leaves focus behind is
 *      invisible to a screen-reader user.
 *   2. **Keep focus in.** Tab and Shift+Tab wrap at the ends of the container.
 *      Focus that escapes to the page behind a modal is the "no keyboard trap"
 *      criterion failing in the opposite direction — the user is reading
 *      content the modal is covering.
 *   3. **Give focus back.** On close, focus returns to the trigger, so the
 *      keyboard user resumes where they were rather than at the top of the
 *      document.
 *
 * A focus-in listener catches the cases Tab-key handling misses: programmatic
 * focus, and browser-chrome cycles that do not fire keydown in the page.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
): void {
  const { initialFocus, returnFocus } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) {
      return;
    }

    const previouslyFocused = (returnFocus?.current ??
      (document.activeElement as HTMLElement | null)) as HTMLElement | null;

    const target = initialFocus?.current ?? focusableWithin(container)[0] ?? container;
    // Deferred a frame: on open the container may still be animating in, and
    // focusing a node the browser considers not-yet-rendered silently no-ops.
    const frame = window.requestAnimationFrame(() => target.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const items = focusableWithin(container);
      if (items.length === 0) {
        // Nothing to cycle through: hold focus on the container itself rather
        // than letting Tab walk out into the page behind.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (activeElement === first || activeElement === container)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const node = event.target as Node | null;
      if (node && !container.contains(node)) {
        event.stopPropagation();
        (focusableWithin(container)[0] ?? container).focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);

      // Only restore if the element is still in the document — the trigger may
      // itself have been removed by whatever the dialog did.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocus, returnFocus]);
}

/** Module-level so nested dialogs share one counter rather than fighting. */
let scrollLocks = 0;
let restoreOverflow = "";
let restorePadding = "";

/**
 * Prevents the page behind a modal from scrolling.
 *
 * The scrollbar width is added back as padding, otherwise removing the
 * scrollbar reflows the whole page sideways the instant a dialog opens — a
 * jump every user notices and no user can explain.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return;
    }

    if (scrollLocks === 0) {
      const { body } = document;
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      restoreOverflow = body.style.overflow;
      restorePadding = body.style.paddingRight;
      body.style.overflow = "hidden";
      if (gutter > 0) {
        body.style.paddingRight = `${gutter}px`;
      }
    }

    scrollLocks += 1;

    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) {
        document.body.style.overflow = restoreOverflow;
        document.body.style.paddingRight = restorePadding;
      }
    };
  }, [active]);
}
