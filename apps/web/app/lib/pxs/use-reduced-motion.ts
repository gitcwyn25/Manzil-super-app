"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * SSR snapshot. Deliberately `false`: the server cannot know the preference,
 * and every PXS animation is additionally disabled in CSS by a real
 * `@media (prefers-reduced-motion: reduce)` block, so a reduced-motion user
 * never sees motion between hydration and the first read.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Live `prefers-reduced-motion` reading, and it *is* live — it re-renders when
 * the OS setting changes mid-session rather than latching the value at mount.
 *
 * Use this only for motion JS cannot express in CSS (looping timers, auto-scroll
 * behaviour, framer-motion variants chosen at runtime). Ordinary transitions
 * should be handled by the CSS media query, and framer-motion is already
 * covered app-wide by `<MotionConfig reducedMotion="user">` in
 * `components/motion/motion-provider.tsx`.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
