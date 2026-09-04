import { locales } from "@manzil/shared";
import type { MetadataRoute } from "next";
import { API_BASE_URL } from "./lib/api-base-url";
import { fetchWithTimeout } from "./lib/fetch-with-timeout";
import { absoluteUrl, languageAlternates, ROUTE_SEO } from "./lib/seo";

/**
 * /sitemap.xml
 *
 * Like robots.txt, this path previously had no route and fell through to the
 * `/[locale]` dynamic segment, which answered HTTP 500 in production.
 *
 * Every URL is emitted once per locale with a full `alternates.languages`
 * block, so Google receives the hreflang cluster from the sitemap even on
 * pages it has not crawled yet.
 *
 * Dynamic entries (businesses, community lists, occasions) come from the
 * public API. Each source degrades independently: an API outage costs those
 * rows, never the whole sitemap — a 500 here is exactly the failure this file
 * exists to remove.
 */

// Rebuild hourly. The catalogue changes when businesses register, which is far
// more often than deploys happen.
export const revalidate = 3600;

/** Public, indexable static routes. Auth-gated routes carry `noIndex` in
 *  ROUTE_SEO and are excluded here for the same reason robots.txt disallows
 *  them. */
const STATIC_KEYS = [
  "home",
  "discover",
  "lists",
  "occasions",
  "business",
  "pricing"
] as const;

const PRIORITY: Record<(typeof STATIC_KEYS)[number], number> = {
  home: 1,
  discover: 0.9,
  lists: 0.7,
  occasions: 0.7,
  business: 0.8,
  pricing: 0.6
};

type Entry = MetadataRoute.Sitemap[number];

/** One row per locale for a locale-relative path, each carrying the hreflang set. */
function localizedEntries(
  path: string,
  options: { priority?: number; changeFrequency?: Entry["changeFrequency"]; lastModified?: Date }
): MetadataRoute.Sitemap {
  const languages = languageAlternates(path);
  return locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    alternates: { languages },
    ...options
  }));
}

/** Anonymous GET against the public API. Never throws — callers get []. */
async function publicList<T>(path: string, pick: (payload: unknown) => T[]): Promise<T[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    return pick(await response.json()) ?? [];
  } catch {
    return [];
  }
}

type SlugRow = { slug?: string };

function slugsFrom(payload: unknown, key: string): SlugRow[] {
  const data = (payload as { data?: Record<string, unknown> } | null)?.data;
  const rows = data?.[key];
  return Array.isArray(rows) ? (rows as SlugRow[]) : [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = STATIC_KEYS.flatMap((key) =>
    localizedEntries(ROUTE_SEO[key].path, {
      priority: PRIORITY[key],
      changeFrequency: key === "home" || key === "discover" ? "daily" : "weekly",
      lastModified: now
    })
  );

  const [businesses, lists, occasions] = await Promise.all([
    publicList("/search", (payload) => slugsFrom(payload, "businesses")),
    publicList("/lists", (payload) => slugsFrom(payload, "lists")),
    publicList("/occasions", (payload) => slugsFrom(payload, "occasions"))
  ]);

  const dynamicEntries = [
    ...businesses.flatMap((row) =>
      row.slug
        ? localizedEntries(`/businesses/${row.slug}`, {
            priority: 0.8,
            changeFrequency: "weekly",
            lastModified: now
          })
        : []
    ),
    ...lists.flatMap((row) =>
      row.slug
        ? localizedEntries(`/lists/${row.slug}`, {
            priority: 0.6,
            changeFrequency: "weekly",
            lastModified: now
          })
        : []
    ),
    ...occasions.flatMap((row) =>
      row.slug
        ? localizedEntries(`/occasions/${row.slug}`, {
            priority: 0.6,
            changeFrequency: "monthly",
            lastModified: now
          })
        : []
    )
  ];

  return [...staticEntries, ...dynamicEntries];
}
