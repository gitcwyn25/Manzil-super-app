import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { CommunityListCard } from "../components/community-list-card";
import { FeedCard } from "../components/feed-card";
import { HomeSearch } from "../components/home-search";
import { OccasionRail } from "../components/occasion-rail";
import { SocialActivityRow } from "../components/social-activity-row";
import { getHomeFeed } from "../lib/api";

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const { feedItems, socialActivities, occasions, lists, businesses } = await getHomeFeed();
  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));

  return (
    <>
      <section className="feed-hero">
        <div className="feed-hero-copy">
          <p className="section-kicker">{copy.home.kicker}</p>
          <h1>{copy.home.title}</h1>
          <p className="hero-text">{copy.home.subtitle}</p>
          <HomeSearch locale={locale} />
        </div>
        <div className="feed-hero-stats" aria-label="Platforma ishonchi">
          <div className="stat-card">
            <strong>12.4k</strong>
            <span>{copy.home.statsViews}</span>
          </div>
          <div className="stat-card">
            <strong>890</strong>
            <span>{copy.home.statsBookmarks}</span>
          </div>
          <div className="stat-card">
            <strong>45</strong>
            <span>{copy.home.statsFriends}</span>
          </div>
        </div>
      </section>

      <div className="container feed-layout">
        <OccasionRail locale={locale} occasions={occasions} />

        <section className="feed-stack" aria-label={copy.nav.feed}>
          {feedItems.map((item) => (
            <FeedCard businesses={businesses} item={item} key={item.id} locale={locale} />
          ))}
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p className="section-kicker">{copy.home.communityKicker}</p>
            <h2>{copy.home.communityTitle}</h2>
          </div>
          <div className="social-activity-list">
            {socialActivities.map((activity) => (
              <SocialActivityRow
                activity={activity}
                businessName={businessBySlug.get(activity.businessSlug)?.name ?? activity.businessSlug}
                key={activity.id}
                locale={locale}
              />
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading section-heading-row">
            <div>
              <p className="section-kicker">{copy.home.listsKicker}</p>
              <h2>{copy.home.listsTitle}</h2>
            </div>
            <a className="ghost-button" href={`/${locale}/lists`}>{copy.home.allLists}</a>
          </div>
          <div className="list-card-grid">
            {lists.map((list) => (
              <CommunityListCard key={list.slug} list={list} locale={locale} />
            ))}
          </div>
        </section>

        <section className="container business-cta feed-business-cta">
          <div>
            <p className="section-kicker inverse">{copy.home.businessKicker}</p>
            <h2>{copy.home.businessTitle}</h2>
            <p>{copy.home.businessBody}</p>
          </div>
          <a className="gold-button" href={`/${locale}/business/pricing`}>{copy.home.businessCta}</a>
        </section>
      </div>
    </>
  );
}
