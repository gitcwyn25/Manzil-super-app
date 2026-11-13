import ReactMarkdown from "react-markdown";
import type { ManzilDocument } from "@/lib/documents";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

// Source documents contain owned relative links, Telegram links and phone links.
// Render those safely without enabling raw HTML or executable URL schemes.
function documentUrl(value: string): string {
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(new URL(value).protocol) ? value : "";
  } catch {
    return "";
  }
}

export function DocumentPage({ document }: { document: ManzilDocument }) {
  // The page shell owns the document's original first heading. Source files are
  // copied byte-for-byte; this only avoids repeating that heading in the body.
  const body = document.markdown.replace(/^\uFEFF?# [^\r\n]+\r?\n/, "");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" data-document-path={document.path}>
        <section className="theme-ink pb-14 pt-32 md:pb-20 md:pt-40">
          <div className="shell">
            <a
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to Manzil
            </a>
            <p className="eyebrow mt-10 text-muted-foreground">
              {document.legal ? "Manzil / Draft policy" : "Manzil / Company document"}
            </p>
            <h1 className="display-lg mt-5 max-w-[24ch]">{document.title}</h1>
          </div>
        </section>
        <div className="shell py-12 md:py-20">
          <div className="mx-auto max-w-3xl">
            <aside
              className="mb-12 border-l-2 border-signal bg-card p-5 text-sm leading-6"
              role="note"
            >
              {document.legal ? (
                <>
                  <strong className="block font-semibold">Draft policy</strong>
                  Draft — this document must be reviewed by qualified Uzbekistan counsel before
                  publication. Legal entity details and actual data flows remain subject to review.
                </>
              ) : (
                <>
                  <strong className="block font-semibold">Preserved source document</strong>
                  This document retains the previous website’s company information. Product
                  availability, contacts and legal entity details require review before the V3
                  release.
                </>
              )}
            </aside>
            <article aria-label={document.title} className="min-w-0 break-words">
              <ReactMarkdown
                skipHtml
                urlTransform={documentUrl}
                components={{
                  h1: ({ children }) => (
                    <h2 className="mb-5 mt-12 text-2xl font-bold tracking-tight">{children}</h2>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-5 mt-12 text-2xl font-bold tracking-tight">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-4 mt-8 text-xl font-semibold tracking-tight">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-5 leading-8 text-foreground/85">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-5 list-disc space-y-3 pl-6 leading-8 text-foreground/85">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-5 list-decimal space-y-3 pl-6 leading-8 text-foreground/85">
                      {children}
                    </ol>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="font-medium text-signal underline underline-offset-4">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 border-l-2 border-border pl-5 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {body}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
