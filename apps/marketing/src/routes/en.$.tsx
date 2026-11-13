import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DocumentPage } from "@/components/marketing/DocumentPage";
import { getDocument } from "@/lib/documents";
import { CORPORATE_ORIGIN, links } from "@/lib/links";

export const Route = createFileRoute("/en/$")({
  loader: ({ params }) => {
    if (params._splat?.replace(/\/$/, "") === "waitlist/gurman") {
      throw redirect({ href: links.gurmanWaitlist, statusCode: 307 });
    }
    const document = getDocument(params._splat ?? "");
    if (!document) throw notFound();
    return document;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex, nofollow" }] };
    const canonical = new URL(loaderData.path, CORPORATE_ORIGIN).href;
    return {
      meta: [
        { title: `${loaderData.title} | Manzil` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: `${loaderData.title} | Manzil` },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: loaderData.legal ? "article" : "website" },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: DocumentRoute,
});

function DocumentRoute() {
  return <DocumentPage document={Route.useLoaderData()} />;
}
