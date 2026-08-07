"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}

/**
 * SSR snapshot is `true`.
 *
 * The server has no idea whether the visitor is online, and rendering an
 * offline banner into the HTML of a page that was just successfully fetched
 * would be a visible lie. Optimistic-online is the only honest default.
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Browser connectivity, from `navigator.onLine` plus the `online`/`offline`
 * events.
 *
 * Known limitation, stated rather than papered over: `navigator.onLine` reports
 * whether the machine has *a* network interface, not whether Manzil's API is
 * reachable. It catches "the wifi dropped" reliably and "the API is down" not
 * at all — which is why request failures still surface their own error state
 * instead of being folded into this signal.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Runs `callback` on the transition offline → online.
 *
 * This is the reconnect hook: a surface that failed to load while the
 * connection was down can use it to retry itself the moment the connection
 * returns, instead of leaving the user staring at an error they have to clear
 * by hand.
 */
export function useOnReconnect(callback: () => void, enabled = true): void {
  // Refreshed in an effect rather than during render — see `useFocusTrap` and
  // `useOptimisticValue` for the same pattern and the reason.
  const stored = useRef(callback);

  useEffect(() => {
    stored.current = callback;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const handle = () => stored.current();
    window.addEventListener("online", handle);
    return () => window.removeEventListener("online", handle);
  }, [enabled]);
}
