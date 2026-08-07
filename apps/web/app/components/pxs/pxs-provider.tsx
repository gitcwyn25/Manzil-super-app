"use client";

import type { Locale } from "@manzil/shared";
import type { ReactNode } from "react";
import { AnnouncerProvider } from "./announcer";
import { ConnectionBanner } from "./connection-status";
import { ToastProvider } from "./toast";

/**
 * The Product Experience System runtime.
 *
 * Mounted once per locale subtree, above everything, in
 * `components/app-providers.tsx`. Nesting order is load-bearing:
 *
 *   `AnnouncerProvider` → `ToastProvider` → app
 *
 * The announcer must be outermost because the toast system announces *through*
 * it. Inverting the two would give `useToast` a null announcer and silently
 * cost every toast its screen-reader announcement — a defect invisible to
 * anyone testing with a mouse.
 *
 * `ConnectionBanner` sits inside both so it can announce; it renders nothing
 * while the connection is up, so it costs an unaffected visitor a single
 * `navigator.onLine` read and no markup.
 */
export function PxsProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <AnnouncerProvider>
      <ToastProvider locale={locale}>
        <ConnectionBanner locale={locale} />
        {children}
      </ToastProvider>
    </AnnouncerProvider>
  );
}
