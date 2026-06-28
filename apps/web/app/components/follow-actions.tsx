"use client";

import { useUserPreferences } from "./user-preferences-provider";
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";

export function SaveBusinessButton({ businessSlug, locale }: { businessSlug: string; locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isSaved, toggleSave } = useUserPreferences();
  const saved = isSaved(businessSlug);

  return (
    <button
      aria-label={saved ? copy.actions.saved : copy.actions.save}
      aria-pressed={saved}
      className={saved ? "icon-action saved" : "icon-action"}
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSave(businessSlug);
      }}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}

export function FollowUserButton({ userId, locale }: { userId: string; locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isFollowingUser, toggleFollowUser } = useUserPreferences();
  const following = isFollowingUser(userId);

  return (
    <button
      className={following ? "secondary-button small active" : "secondary-button small"}
      type="button"
      onClick={() => toggleFollowUser(userId)}
    >
      {following ? copy.actions.following : copy.actions.follow}
    </button>
  );
}

export function FollowListButton({ listSlug, locale }: { listSlug: string; locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isFollowingList, toggleFollowList } = useUserPreferences();
  const following = isFollowingList(listSlug);

  return (
    <button
      className={following ? "ghost-button small active" : "ghost-button small"}
      type="button"
      onClick={() => toggleFollowList(listSlug)}
    >
      {following ? copy.actions.followingList : copy.actions.followList}
    </button>
  );
}
