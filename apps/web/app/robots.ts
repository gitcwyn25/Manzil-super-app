import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

/**
 * /robots.txt
 *
 * Before this file existed the path had no route at all, so it fell through to
 * the `/[locale]` dynamic segment (locale = "robots.txt") and production
 * answered HTTP 500 — the single worst SEO failure on the site, because a
 * crawler that gets a 5xx on robots.txt may back off from the whole host.
 *
 * AI crawlers are explicitly allowed. In 2026 answer engines are a first-class
 * discovery surface for a local directory, and the site's content is public
 * anyway; blocking them would remove Manzil from AI answers without protecting
 * anything. The authenticated and personal surfaces below are disallowed for
 * every agent, human-facing or not.
 */

/** Nothing here is public: auth flows, personal pages, owner/admin consoles,
 *  the Sentry tunnel, and API proxies. Locale-prefixed paths use a wildcard so
 *  one entry covers uz/ru/en. */
const DISALLOW = [
  "/api/",
  "/monitoring",
  "/*/dashboard",
  "/*/admin",
  "/*/profile",
  "/*/sign-in",
  "/*/sign-up",
  "/*/business/register",
  "/*/business/plans",
  "/offline"
];

/** Answer engines and AI training/search crawlers, allowed deliberately. */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "Amazonbot",
  "meta-externalagent",
  "cohere-ai",
  "DuckAssistBot",
  "YandexBot"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW }))
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
