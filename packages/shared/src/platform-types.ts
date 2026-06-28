import type { LocalizedText } from "./locales";
import type { Business } from "./types";

export type BusinessBadgeSlug =
  | "eco-friendly"
  | "best-value"
  | "family-friendly"
  | "remote-work"
  | "study-spot"
  | "romantic"
  | "birthday-friendly"
  | "large-portions"
  | "prayer-room"
  | "easy-parking"
  | "accessible"
  | "child-friendly"
  | "pet-friendly"
  | "open-late"
  | "halal";

export type BusinessBadge = {
  slug: BusinessBadgeSlug;
  emoji: string;
  label: LocalizedText;
};

export type LiveStatusLevel = "quiet" | "moderate" | "busy" | "unknown";

export type LiveStatus = {
  level: LiveStatusLevel;
  label: LocalizedText;
  waitMinutes?: number;
  noiseLevel?: "low" | "medium" | "high";
  parking?: "available" | "limited" | "none";
  updatedAt: string;
};

export type QualityScore = {
  overall: number;
  reviewQuality: number;
  freshness: number;
  popularity: number;
  returnVisitors: number;
  responseSpeed: number;
  photoQuality: number;
};

export type BusinessInsight = {
  aiSummary: LocalizedText;
  monthlyViews: number;
  bookmarksToday: number;
  trendingRank?: number;
};

export type BusinessSocialProof = {
  friendsVisited: number;
  bookmarkedCount: number;
  orderedToday?: number;
};

export type BusinessPlatform = Business & {
  badges?: BusinessBadge[];
  liveStatus?: LiveStatus;
  qualityScore?: QualityScore;
  insight?: BusinessInsight;
  socialProof?: BusinessSocialProof;
};

export type FeedItemType =
  | "trending"
  | "occasion"
  | "social"
  | "new-opening"
  | "list"
  | "badge-collection";

export type FeedItem = {
  id: string;
  type: FeedItemType;
  emoji: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  businessSlugs: string[];
  occasionSlug?: string;
  listSlug?: string;
  actorName?: string;
};

export type OccasionSlug =
  | "birthday"
  | "date-night"
  | "family-dinner"
  | "graduation"
  | "business-meeting"
  | "team-building"
  | "kids-party";

export type Occasion = {
  slug: OccasionSlug;
  emoji: string;
  name: LocalizedText;
  description: LocalizedText;
  packageItems: LocalizedText[];
  businessSlugs: string[];
};

export type CommunityList = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  authorName: string;
  followerCount: number;
  businessSlugs: string[];
  tags: string[];
};

export type SocialActivity = {
  id: string;
  actorName: string;
  action: LocalizedText;
  businessSlug: string;
  rating?: number;
  createdAt: string;
};

export type AchievementSlug =
  | "food-explorer"
  | "coffee-expert"
  | "top-photographer"
  | "local-guide";

export type Achievement = {
  slug: AchievementSlug;
  emoji: string;
  name: LocalizedText;
  description: LocalizedText;
};

export type DiscoverableUser = {
  id: string;
  displayName: string;
  handle: string;
  bio: LocalizedText;
  followerCount: number;
  reviewCount: number;
  listCount: number;
  topCategory: LocalizedText;
};

export type UserProfile = {
  id: string;
  displayName: string;
  handle: string;
  memberSince: string;
  locale: "uz" | "ru" | "en";
  bio: LocalizedText;
  stats: {
    reviews: number;
    saved: number;
    photos: number;
    lists: number;
    followers: number;
    following: number;
  };
  earnedAchievementSlugs: AchievementSlug[];
  followingUserIds: string[];
  defaultSavedSlugs: string[];
  defaultFollowedListSlugs: string[];
};

export type ConciergeMessageRole = "user" | "assistant";

export type ConciergeSuggestion = {
  businessSlug: string;
  reason: LocalizedText;
};

export type ConciergeReply = {
  text: LocalizedText;
  suggestions: ConciergeSuggestion[];
};

export type SubscriptionTierSlug = "starter" | "growth" | "premium";

export type SubscriptionFeature = {
  label: LocalizedText;
  included: boolean;
};

export type SubscriptionPlan = {
  slug: SubscriptionTierSlug;
  name: LocalizedText;
  priceLabel: LocalizedText;
  description: LocalizedText;
  highlight?: boolean;
  features: SubscriptionFeature[];
};
