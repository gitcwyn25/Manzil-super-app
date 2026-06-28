"use client";

import type { DiscoverableUser, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { formatCount, pickLocalized } from "../lib/locale-text";
import { FollowUserButton } from "./follow-actions";

export function DiscoverableUserCard({ user, locale }: { user: DiscoverableUser; locale: Locale }) {
  return (
    <article className="discover-user-card">
      <div className="discover-user-head">
        <div className="social-avatar" aria-hidden="true">{user.displayName.charAt(0)}</div>
        <div>
          <h3>{user.displayName}</h3>
          <p>@{user.handle}</p>
        </div>
        <FollowUserButton locale={locale} userId={user.id} />
      </div>
      <p>{pickLocalized(user.bio, locale)}</p>
      <div className="tag-row">
        <span>{formatCount(user.followerCount)}</span>
        <span>{user.reviewCount}</span>
        <span>{pickLocalized(user.topCategory, locale)}</span>
      </div>
    </article>
  );
}

export function FollowingUsersSection({
  users,
  locale
}: {
  users: DiscoverableUser[];
  locale: Locale;
}) {
  return (
    <div className="discover-user-grid">
      {users.map((user) => (
        <DiscoverableUserCard key={user.id} locale={locale} user={user} />
      ))}
    </div>
  );
}
