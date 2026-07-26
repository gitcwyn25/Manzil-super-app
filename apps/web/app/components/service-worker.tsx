"use client";

import { useEffect } from "react";

/**
 * Registers the service worker.
 *
 * Deliberately conservative:
 *  - production only, so a stale worker never shadows local development;
 *  - registered after `load`, so it never competes with first paint for
 *    bandwidth on a slow connection — the exact case the worker exists for;
 *  - failures are swallowed. An unavailable service worker (private mode,
 *    unsupported browser, blocked by policy) must degrade to a normal website,
 *    never to a console error or a broken page.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Offline support is an enhancement; its absence is not an error.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
