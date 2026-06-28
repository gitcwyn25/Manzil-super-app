"use client";

import { UserPreferencesProvider } from "./user-preferences-provider";

export function AppProviders({
  children,
  defaults
}: {
  children: React.ReactNode;
  defaults?: {
    savedBusinessSlugs?: string[];
    followedUserIds?: string[];
    followedListSlugs?: string[];
  };
}) {
  return <UserPreferencesProvider defaults={defaults}>{children}</UserPreferencesProvider>;
}
