import type {
  Achievement,
  BusinessPlatform,
  Category,
  ClaimStatus,
  CommunityList,
  DiscoverableUser,
  Occasion,
  Review,
  SocialActivity,
  SubscriptionPlan,
  UserProfile,
  UserRole
} from "@manzil/shared";
import * as mockApi from "./mock-api";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export async function getCategories(): Promise<Category[]> {
  if (useMockData) {
    return mockApi.getCategories();
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: await getServerAuthHeaders("/categories"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data.categories;
}

export async function getBusinesses(): Promise<BusinessPlatform[]> {
  if (useMockData) {
    return mockApi.getBusinesses();
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/businesses`, {
    headers: await getServerAuthHeaders("/businesses"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data.businesses;
}

export async function searchBusinesses(query = "", category = "all"): Promise<{
  businesses: BusinessPlatform[];
  categories: Category[];
}> {
  if (useMockData) {
    return mockApi.searchBusinesses(query, category);
  }

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category && category !== "all") params.set("category", category);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/search${suffix}`, {
    headers: await getServerAuthHeaders("/search"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data;
}

export async function getBusiness(slug: string): Promise<{ business: BusinessPlatform; reviews: Review[] }> {
  if (useMockData) {
    return mockApi.getBusiness(slug);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/businesses/${slug}`, {
    headers: await getServerAuthHeaders(`/businesses/${slug}`),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data;
}

export async function getHomeFeed() {
  return mockApi.getHomeFeed();
}

export async function getOccasions(): Promise<Occasion[]> {
  return mockApi.getOccasions();
}

export async function getListsPage(): Promise<CommunityList[]> {
  if (useMockData) {
    return mockApi.getListsPage();
  }
  throw new Error("Lists API not implemented");
}

export async function getAchievements(): Promise<Achievement[]> {
  return mockApi.getAchievements();
}

export async function getAdminOverview() {
  if (useMockData) {
    return mockApi.getAdminOverview();
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/overview`, {
    headers: await getServerAuthHeaders("/admin/overview"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data;
}

export type AdminClaim = {
  id: string;
  status: ClaimStatus;
  verificationMethod: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  business: BusinessPlatform;
  requester: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
  };
};

export async function getAdminClaims(status: ClaimStatus = "pending"): Promise<AdminClaim[]> {
  if (useMockData) {
    return mockApi.getAdminClaims(status);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/claims?status=${status}`, {
    headers: await getServerAuthHeaders("/admin/claims"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data.claims;
}

export async function getUserProfile(): Promise<UserProfile> {
  return mockApi.getUserProfile();
}

export async function getDiscoverableUsers(): Promise<DiscoverableUser[]> {
  return mockApi.getDiscoverableUsers();
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return mockApi.getSubscriptionPlans();
}

export async function getConciergePrompts() {
  return mockApi.getConciergePrompts();
}

export async function getSocialActivities(): Promise<SocialActivity[]> {
  return mockApi.getSocialActivities();
}

export async function approveClaim(id: string) {
  if (useMockData) {
    return mockApi.approveClaim(id);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/claims/${id}/approve`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(`/admin/claims/${id}/approve`))
    },
    body: "{}",
    cache: "no-store"
  });
  return response.json();
}

export async function rejectClaim(id: string) {
  if (useMockData) {
    return mockApi.rejectClaim(id);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/claims/${id}/reject`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(`/admin/claims/${id}/reject`))
    },
    body: "{}",
    cache: "no-store"
  });
  return response.json();
}

export {
  getHomeFeed as getHomeFeedMock,
  getListDetail,
  getOccasionPage
} from "./mock-api";
