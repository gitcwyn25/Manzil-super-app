import type { MetadataRoute } from "next";
import { api, type DirectoryData, SITE_URL } from "./lib/api";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await api<DirectoryData>("/reviews-directory").catch(() => ({ businesses: [], categories: [] }));
  return [{ url: SITE_URL + "/", priority: 1 }, { url: SITE_URL + "/owners", priority: 0.5 }, ...data.businesses.map(b => ({ url: SITE_URL + "/business/" + encodeURIComponent(b.slug), priority: 0.7 }))];
}
