/**
 * Stable content keys and fragment links for the future docs collection.
 * Replace a section's status/copy with approved Markdown/MDX or CMS content
 * before assigning it a public child route. No technical guides are published.
 */
export const docsSections = [
  {
    id: "overview",
    title: "Docs overview",
    description: "A place for Manzil documentation as it is prepared and approved.",
  },
  {
    id: "getting-started",
    title: "Getting started",
    description: "Introductory guides are planned. Detailed instructions are being prepared.",
  },
  {
    id: "product-guides",
    title: "Product guides",
    description: "Product documentation will be added here after review.",
  },
] as const;
