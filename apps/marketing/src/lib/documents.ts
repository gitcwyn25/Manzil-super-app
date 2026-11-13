import about from "@/content/about.md?raw";
import contact from "@/content/contact.md?raw";
import privacy from "@/content/privacy-policy.md?raw";
import terms from "@/content/terms-of-service.md?raw";
import communityRules from "@/content/community-and-reviews-policy.md?raw";
import cookies from "@/content/cookie-policy.md?raw";
import aiTransparency from "@/content/ai-transparency.md?raw";

export type ManzilDocument = {
  path: string;
  title: string;
  description: string;
  markdown: string;
  legal: boolean;
};

const documents: Record<string, ManzilDocument> = {
  about: {
    path: "/en/about",
    title: "About Manzil",
    description: "Manzil’s purpose, principles, and approach. Preserved company source document.",
    markdown: about,
    legal: false,
  },
  contact: {
    path: "/en/contact",
    title: "Contact",
    description: "Manzil contact information for questions, cooperation, and data corrections.",
    markdown: contact,
    legal: false,
  },
  "legal/privacy": {
    path: "/en/legal/privacy",
    title: "Privacy Policy",
    description: "Draft explaining how Manzil handles personal data.",
    markdown: privacy,
    legal: true,
  },
  "legal/terms": {
    path: "/en/legal/terms",
    title: "Terms of Use for Manzil Services",
    description: "Draft terms for using Manzil services.",
    markdown: terms,
    legal: true,
  },
  "legal/reviews": {
    path: "/en/legal/reviews",
    title: "Reviews and Community Guidelines",
    description: "Draft rules for honest, useful, and respectful local reviews.",
    markdown: communityRules,
    legal: true,
  },
  "legal/cookies": {
    path: "/en/legal/cookies",
    title: "Cookie Policy",
    description: "Draft policy for cookies and similar technologies used by Manzil.",
    markdown: cookies,
    legal: true,
  },
  "legal/ai-transparency": {
    path: "/en/legal/ai-transparency",
    title: "Gurman AI: Transparency and Safety",
    description: "Draft description of Gurman AI and its important limitations.",
    markdown: aiTransparency,
    legal: true,
  },
};

export function getDocument(path: string): ManzilDocument | undefined {
  const normalized = path.replace(/\/$/, "");
  return Object.hasOwn(documents, normalized) ? documents[normalized] : undefined;
}
