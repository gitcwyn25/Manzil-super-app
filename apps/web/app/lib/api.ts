import type { Business, Category, Review } from "@manzil/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

type Envelope<T> = {
  data: T;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getServerAuthHeaders(path),
    next: { revalidate: 30 }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

function getServerAuthHeaders(path: string): HeadersInit {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  if (path.startsWith("/admin")) {
    return { "x-manzil-role": "admin" };
  }

  return {};
}

export async function getCategories() {
  const payload = await getJson<Envelope<{ categories: Category[] }>>("/categories");
  return payload.data.categories;
}

export async function getBusinesses() {
  const payload = await getJson<Envelope<{ businesses: Business[] }>>("/businesses");
  return payload.data.businesses;
}

export async function searchBusinesses(query = "", category = "all") {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (category && category !== "all") {
    params.set("category", category);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const payload = await getJson<Envelope<{ businesses: Business[]; categories: Category[] }>>(`/search${suffix}`);
  return payload.data;
}

export async function getBusiness(slug: string) {
  const payload = await getJson<Envelope<{ business: Business; reviews: Review[] }>>(`/businesses/${slug}`);
  return payload.data;
}

export async function getAdminOverview() {
  const payload = await getJson<
    Envelope<{
      businessCount: number;
      pendingClaimCount: number;
      categoryCount: number;
      reviewCount: number;
      flaggedItemCount: number;
    }>
  >("/admin/overview");

  return payload.data;
}
