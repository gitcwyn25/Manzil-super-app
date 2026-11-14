import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/auth", "/profile", "/saved", "/claim", "/add-business"] }, sitemap: "https://review.manzilgroup.uz/sitemap.xml" };
}
