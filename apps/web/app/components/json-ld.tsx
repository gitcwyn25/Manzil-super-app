import type { JsonLdNode } from "../lib/structured-data";

/**
 * Renders schema.org JSON-LD into the document.
 *
 * A server component on purpose: the graph has to be present in the HTML that
 * crawlers and LLM fetchers receive, not injected after hydration. The app's
 * CSP allows `script-src 'self' 'unsafe-inline'`, so no nonce plumbing is
 * needed; `type="application/ld+json"` is data, never executed.
 *
 * `<` is escaped so a business name or review body containing `</script>`
 * cannot break out of the block.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: payload }} />
  );
}
