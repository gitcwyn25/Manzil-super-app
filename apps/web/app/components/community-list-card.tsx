"use client";

import type { CommunityList, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { formatCount, pickLocalized } from "../lib/locale-text";
import { FollowListButton } from "./follow-actions";

export function CommunityListCard({ list, locale }: { list: CommunityList; locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <article className="community-list-card">
      <div className="community-list-head">
        <a href={`/${locale}/lists/${list.slug}`}>
          <h3>{pickLocalized(list.title, locale)}</h3>
        </a>
        <FollowListButton listSlug={list.slug} locale={locale} />
      </div>
      <a href={`/${locale}/lists/${list.slug}`}>
        <p>{pickLocalized(list.description, locale)}</p>
        <div className="tag-row">
          <span>{list.authorName}</span>
          <span>{formatCount(list.followerCount)} {copy.lists.followers}</span>
          {list.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </a>
    </article>
  );
}
