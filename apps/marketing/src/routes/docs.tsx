import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { EntryHeader } from "@/components/marketing/EntryHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { docsSections } from "@/lib/docs";
import { CORPORATE_ORIGIN, links } from "@/lib/links";

const TITLE = "Docs | Manzil";
const DESCRIPTION =
  "Manzil documentation is being prepared. Explore the planned sections and existing company documents.";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `${CORPORATE_ORIGIN}/docs` },
    ],
    links: [{ rel: "canonical", href: `${CORPORATE_ORIGIN}/docs` }],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <>
      <EntryHeader current="docs" />
      <main id="main" tabIndex={-1}>
        <section className="theme-ink pb-16 pt-14 md:pb-24 md:pt-24">
          <div className="shell">
            <p className="eyebrow text-lime">Manzil / Docs</p>
            <h1 className="display-xl mt-7 max-w-[16ch]">A home for what comes next.</h1>
            <p className="lede mt-8 max-w-[48ch] text-muted-foreground">
              Clear guides take care. Our detailed documentation is being prepared.
            </p>
            <div
              className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"
              role="note"
            >
              <span className="size-1.5 rounded-full bg-lime" aria-hidden />
              In preparation. Technical guides are not yet published.
            </div>
          </div>
        </section>
        <div className="shell grid gap-12 py-14 md:grid-cols-[12rem_1fr] md:gap-16 md:py-20">
          <nav aria-label="Docs sections" className="self-start md:sticky md:top-8">
            <p className="eyebrow text-muted-foreground">On this page</p>
            <ul className="mt-5 space-y-1">
              {docsSections.map((section) => (
                <li key={section.id}>
                  <a
                    className="block rounded-sm py-2 text-sm hover:underline"
                    href={`#${section.id}`}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a
                  className="block rounded-sm py-2 text-sm hover:underline"
                  href="#company-documents"
                >
                  Company documents
                </a>
              </li>
            </ul>
          </nav>
          <div className="max-w-3xl">
            {docsSections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="border-t border-border py-8 first:pt-0 first:border-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {section.title}
                  </h2>
                  <span className="eyebrow text-muted-foreground">
                    {index === 0 ? "Overview" : "Planned"}
                  </span>
                </div>
                <p className="mt-4 max-w-[58ch] leading-7 text-muted-foreground">
                  {section.description}
                </p>
                {index === 0 && (
                  <p className="mt-4 max-w-[58ch] leading-7 text-muted-foreground">
                    This is the documentation landing page. Approved guides will appear here as they
                    become available.
                  </p>
                )}
              </section>
            ))}
            <section id="company-documents" className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Existing company documents
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Company information and draft policies from the previous website are available
                separately, with their source and review status shown.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {[
                  { label: "About Manzil", href: links.about },
                  { label: "Contact", href: links.contact },
                  { label: "Draft privacy policy", href: links.privacy },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-sm py-1 text-sm font-semibold underline underline-offset-4"
                  >
                    {item.label}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                ))}
              </div>
            </section>
            <a
              href="/"
              className="mt-12 inline-flex items-center gap-2 rounded-sm py-2 text-sm font-semibold"
            >
              <ArrowLeft className="size-4" aria-hidden /> Back to Manzil
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
