import type { Locale } from "@manzil/shared";
import { getUserProfile } from "@manzil/shared";
import { AppProviders } from "../components/app-providers";

export function LocaleProviders({
  children,
  locale: _locale
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const profile = getUserProfile();

  return (
    <AppProviders
      defaults={{
        savedBusinessSlugs: profile.defaultSavedSlugs,
        followedUserIds: profile.followingUserIds,
        followedListSlugs: profile.defaultFollowedListSlugs
      }}
    >
      {children}
    </AppProviders>
  );
}
