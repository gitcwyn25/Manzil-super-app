import type { FeedItem, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BusinessCard } from "./business-card";
import type { BusinessPlatform } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

export function FeedCard({
  item,
  locale,
  businesses
}: {
  item: FeedItem;
  locale: Locale;
  businesses: BusinessPlatform[];
}) {
  const copy = getUiCopy(locale);
  const matched = businesses.filter((business) => item.businessSlugs.includes(business.slug));

  return (
    <article className="feed-card">
      <div className="feed-card-head">
        <span className="feed-emoji" aria-hidden="true">{item.emoji}</span>
        <div>
          <h3>{pickLocalized(item.title, locale)}</h3>
          {item.subtitle ? <p>{pickLocalized(item.subtitle, locale)}</p> : null}
          {item.actorName ? <p className="feed-actor">{item.actorName}</p> : null}
        </div>
        {item.occasionSlug ? (
          <a className="ghost-button small" href={`/${locale}/occasions/${item.occasionSlug}`}>
            {copy.occasions.view}
          </a>
        ) : null}
      </div>
      <div className="feed-card-grid">
        {matched.map((business) => (
          <BusinessCard business={business} compact key={business.id} locale={locale} />
        ))}
      </div>
    </article>
  );
}
