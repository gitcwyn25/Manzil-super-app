import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata, ROUTE_SEO } from "../../../../lib/seo";
import { GurmanWaitlistForm } from "../../../../components/waitlist/gurman-waitlist-form";
import { WaitlistForm } from "../../../../components/waitlist/waitlist-form";
import { API_BASE_URL } from "../../../../lib/api-base-url";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import { getWaitlistCopy, isWaitlistTopic, WAITLIST_TOPICS } from "../../../../lib/waitlist-copy";

export function generateStaticParams() {
  return WAITLIST_TOPICS.map((topic) => ({ topic }));
}

/**
 * Title and description come from the topic's own copy, so the three waitlist
 * pages never share a snippet. Indexable: each states a real, specific
 * limitation of the product today ("Manzil is Tashkent only"), which is
 * genuinely the answer to a query someone will type.
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;

  if (!isWaitlistTopic(topic)) {
    return { title: ROUTE_SEO.notFound.title[locale], robots: { index: false, follow: false } };
  }

  const copy = getWaitlistCopy(topic, locale);

  return pageMetadata({
    locale,
    path: `/waitlist/${topic}`,
    title: copy.title,
    description: copy.lead
  });
}

/** Real demand, not a fabricated counter. Renders nothing if the call fails. */
async function getCount(topic: string): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/waitlist/count?topic=${topic}`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()).data.count as number;
  } catch {
    return null;
  }
}

export default async function WaitlistPage({
  params
}: {
  params: Promise<{ locale: Locale; topic: string }>;
}) {
  const { locale, topic } = await params;

  if (!isWaitlistTopic(topic)) {
    notFound();
  }

  const copy = getWaitlistCopy(topic, locale);
  const count = await getCount(topic);

  if (topic === "gurman") {
    return <GurmanWaitlistForm locale={locale} />;
  }

  return (
    <section className="wl-page">
      <div className="wl-copy">
        <h1>{copy.title}</h1>
        <p className="wl-lead">{copy.lead}</p>
        {count !== null && count > 0 ? (
          <p className="wl-count">{copy.countLabel(count)}</p>
        ) : null}
        <WaitlistForm locale={locale} topic={topic} />
      </div>
    </section>
  );
}
