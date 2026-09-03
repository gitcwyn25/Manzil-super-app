"use client";

import type { Locale } from "@manzil/shared";
import { PxsProvider } from "./pxs/pxs-provider";
import { ThemeProvider } from "./theme-provider";
import { UserPreferencesProvider } from "./user-preferences-provider";

/**
 * Client-side runtime for a locale subtree.
 *
 * `PxsProvider` is outermost because the Product Experience System is what
 * everything below reports through: `UserPreferencesProvider` raises a toast
 * when a save fails to persist, and any surface may announce, toast or open a
 * dialog. A provider that sits above the announcer cannot use it.
 */
export function AppProviders({
  children,
  locale,
  defaults
}: {
  children: React.ReactNode;
  locale: Locale;
  defaults?: {
    savedBusinessSlugs?: string[];
    followedUserIds?: string[];
    followedListSlugs?: string[];
  };
}) {
  return (
    <ThemeProvider>
      <PxsProvider locale={locale}>
        <UserPreferencesProvider defaults={defaults} locale={locale}>
          {children}
        </UserPreferencesProvider>
      </PxsProvider>
    </ThemeProvider>
  );
}
