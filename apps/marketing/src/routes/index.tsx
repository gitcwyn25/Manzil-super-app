import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import {
  AppPreview,
  Business,
  FinalCta,
  Markets,
  Platform,
  Problem,
  Thesis,
  Trust,
  Vision,
} from "@/components/marketing/Sections";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { CORPORATE_ORIGIN } from "@/lib/links";

const TITLE = "Manzil — The intelligence layer for local markets";
const DESCRIPTION =
  "Find your people. Share what you know. Discover what matters nearby. One Manzil app for community and discovery, starting in Tashkent.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${CORPORATE_ORIGIN}/` },
      { property: "og:image", content: `${CORPORATE_ORIGIN}/images/og-manzil.jpg` },
      { property: "og:image:alt", content: "Chorsu Bazaar in Tashkent, where Manzil begins" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `${CORPORATE_ORIGIN}/images/og-manzil.jpg` },
    ],
    links: [{ rel: "canonical", href: `${CORPORATE_ORIGIN}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Manzil Group",
          url: "https://manzilgroup.uz",
          sameAs: [
            "https://www.instagram.com/manzil.finds",
            "https://www.youtube.com/@ManzilGroupUz",
            "https://x.com/ManzilUz",
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Thesis />
        <Problem />
        <Platform />
        <AppPreview />
        <Trust />
        <Markets />
        <Vision />
        <Business />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
