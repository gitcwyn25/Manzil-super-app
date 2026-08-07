"use client";

import { useEffect, useRef } from "react";

export type ShortcutOptions = {
  /** Turn the binding off without unmounting the component. Default: true. */
  enabled?: boolean;
  /**
   * Fire even while the user is typing in a field. Default `false`, because a
   * bare `/` or `n` shortcut that steals a keystroke mid-sentence is the single
   * most common way keyboard shortcuts become hostile.
   */
  allowInInput?: boolean;
  /** Call `preventDefault()` when the binding matches. Default: true. */
  preventDefault?: boolean;
};

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Parses `"mod+k"`, `"shift+?"`, `"Escape"`, `"/"`.
 *
 * `mod` is Command on Apple platforms and Control everywhere else, so one
 * binding string is correct on both without the call site branching.
 */
function matches(event: KeyboardEvent, binding: string): boolean {
  const parts = binding.toLowerCase().split("+").map((part) => part.trim());
  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));

  const isApple =
    typeof navigator !== "undefined" && /mac|iphone|ipad|ipod/i.test(navigator.platform || "");
  const mod = isApple ? event.metaKey : event.ctrlKey;

  if (modifiers.has("mod") !== mod) return false;
  if (modifiers.has("shift") !== event.shiftKey) return false;
  if (modifiers.has("alt") !== event.altKey) return false;
  if (!modifiers.has("mod")) {
    // An explicit ctrl/meta in the binding must match exactly; an unmodified
    // binding must not fire while a modifier is held.
    if (modifiers.has("ctrl") !== event.ctrlKey) return false;
    if (modifiers.has("meta") !== event.metaKey) return false;
  }

  return event.key.toLowerCase() === key;
}

/**
 * Binds one or more keyboard shortcuts for the lifetime of the component.
 *
 * The handler is held in a ref, so an inline arrow function does not re-bind
 * the listener on every render.
 *
 * Accessibility note: a shortcut is an accelerator, never the only route to a
 * feature (WCAG 2.1.1). Everything reachable by shortcut must also be reachable
 * by a visible, focusable control.
 */
export function useKeyboardShortcut(
  binding: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {}
): void {
  const { enabled = true, allowInInput = false, preventDefault = true } = options;

  // Refreshed in an effect, never during render (writing a ref while rendering
  // is unsafe under concurrent rendering). The keydown listener runs long
  // after the commit phase, so it always sees the latest handler.
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  // Serialised so an inline array literal does not re-bind every render.
  const bindings = Array.isArray(binding) ? binding.join("|") : binding;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const list = bindings.split("|");

    const onKeyDown = (event: KeyboardEvent) => {
      if (!allowInInput && isTextEntry(event.target)) {
        return;
      }
      if (!list.some((entry) => matches(event, entry))) {
        return;
      }
      if (preventDefault) {
        event.preventDefault();
      }
      handlerRef.current(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings, enabled, allowInInput, preventDefault]);
}
