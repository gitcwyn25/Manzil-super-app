import {
  categories,
  getCommunityList,
  getCommunityLists,
  getDiscoverableUsers as loadDiscoverableUsers,
  getFeedItems,
  getOccasion,
  getOccasions as loadOccasions,
  getPlatformBusiness,
  getPlatformBusinesses,
  getSocialActivities as loadSocialActivities,
  getSubscriptionPlans as loadSubscriptionPlans,
  getUserProfile as loadUserProfile,
  getAchievements as loadAchievements,
  searchPlatformBusinesses
} from "@manzil/shared";
import type { ClaimStatus, UserRole } from "@manzil/shared";

export async function getCategories() {
  return categories;
}

export async function getBusinesses() {
  return getPlatformBusinesses();
}

export async function searchBusinesses(query = "", category = "all") {
  return {
    businesses: searchPlatformBusinesses(query, category),
    categories
  };
}

export async function getBusiness(slug: string) {
  const profile = getPlatformBusiness(slug);
  if (!profile) {
    throw new Error("Business not found");
  }
  return profile;
}

export async function getHomeFeed() {
  return {
    feedItems: getFeedItems(),
    socialActivities: loadSocialActivities(),
    occasions: loadOccasions(),
    lists: getCommunityLists(),
    businesses: getPlatformBusinesses()
  };
}

export async function getOccasionPage(slug: string) {
  const occasion = getOccasion(slug);
  if (!occasion) {
    throw new Error("Occasion not found");
  }

  return {
    occasion,
    businesses: getPlatformBusinesses().filter((business) => occasion.businessSlugs.includes(business.slug))
  };
}

export async function getListsPage() {
  return getCommunityLists();
}

export async function getListDetail(slug: string) {
  const list = getCommunityList(slug);
  if (!list) {
    throw new Error("List not found");
  }

  return {
    list,
    businesses: getPlatformBusinesses().filter((business) => list.businessSlugs.includes(business.slug))
  };
}

export async function getOccasions() {
  return loadOccasions();
}

export async function getAchievements() {
  return loadAchievements();
}

export async function getUserProfile() {
  return loadUserProfile();
}

export async function getDiscoverableUsers() {
  return loadDiscoverableUsers();
}

export async function getSubscriptionPlans() {
  return loadSubscriptionPlans();
}

export async function getSocialActivities() {
  return loadSocialActivities();
}

export async function getAdminOverview() {
  return {
    businessCount: getPlatformBusinesses().length,
    pendingClaimCount: 1,
    categoryCount: categories.length,
    reviewCount: 2,
    flaggedItemCount: 0
  };
}

export async function getAdminClaims(status: ClaimStatus = "pending") {
  if (status !== "pending") {
    return [];
  }

  const business = getPlatformBusinesses().find((item) => item.status === "pending_claim");
  if (!business) {
    return [];
  }

  return [
    {
      id: "claim_demo",
      status: "pending" as const,
      verificationMethod: "manual",
      note: "Demo claim request",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business,
      requester: {
        id: "user_demo",
        displayName: "Demo Owner",
        email: "owner@manzil.local",
        phone: "+998 90 111 22 33",
        role: "business_owner" as UserRole
      }
    }
  ];
}

export async function approveClaim(id: string) {
  void id;
  return { data: { ok: true } };
}

export async function rejectClaim(id: string) {
  void id;
  return { data: { ok: true } };
}
