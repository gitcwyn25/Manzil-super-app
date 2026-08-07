import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { AchievementGrid } from "../../../components/achievement-grid";
import { FollowingUsersSection } from "../../../components/discover-user-card";
import { SavedBusinessesSection } from "../../../components/saved-businesses-section";
import { SocialActivityRow } from "../../../components/social-activity-row";
import {
  getAchievements,
  getBusinesses,
  getDiscoverableUsers,
  getSocialActivities,
  getUserProfile
} from "../../../lib/api";
import type { Metadata } from "next";
import { routeMetadata } from "../../../lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("profile", locale);
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const [profile, achievements, businesses, users, activities] = await Promise.all([
    getUserProfile(),
    getAchievements(),
    getBusinesses(),
    getDiscoverableUsers(),
    getSocialActivities()
  ]);

  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));
  const followingUsers = users.filter((user) => profile.followingUserIds.includes(user.id));

  return (
    <div className="container profile-page">
      <section className="profile-hero">
        <div className="profile-hero-avatar" aria-hidden="true">{profile.displayName.charAt(0)}</div>
        <div>
          <p className="section-kicker">@{profile.handle}</p>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio[locale] ?? profile.bio.uz}</p>
          <div className="profile-stats">
            <span><strong>{profile.stats.reviews}</strong> {copy.profile.reviews}</span>
            <span><strong>{profile.stats.saved}</strong> {copy.profile.saved}</span>
            <span><strong>{profile.stats.photos}</strong> {copy.profile.photos}</span>
            <span><strong>{profile.stats.followers}</strong> {copy.profile.followers}</span>
            <span><strong>{profile.stats.following}</strong> {copy.profile.following}</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="section-kicker">{copy.profile.achievementsKicker}</p>
          <h2>{copy.profile.achievementsTitle}</h2>
        </div>
        <AchievementGrid
          achievements={achievements}
          earnedSlugs={profile.earnedAchievementSlugs}
          locale={locale}
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="section-kicker">{copy.profile.savedKicker}</p>
          <h2>{copy.profile.savedTitle}</h2>
        </div>
        <SavedBusinessesSection businesses={businesses} locale={locale} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="section-kicker">{copy.profile.followingKicker}</p>
          <h2>{copy.profile.followingTitle}</h2>
        </div>
        <FollowingUsersSection locale={locale} users={followingUsers.length ? followingUsers : users.slice(0, 2)} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="section-kicker">{copy.profile.activityKicker}</p>
          <h2>{copy.profile.activityTitle}</h2>
        </div>
        <div className="social-activity-list">
          {activities.map((activity) => (
            <SocialActivityRow
              activity={activity}
              businessName={businessBySlug.get(activity.businessSlug)?.name ?? activity.businessSlug}
              key={activity.id}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
