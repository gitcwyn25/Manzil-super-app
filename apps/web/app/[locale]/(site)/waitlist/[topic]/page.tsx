import type { Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { Aperture } from "../../../../components/motion/aperture";
import { WaitlistForm } from "../../../../components/waitlist/waitlist-form";
import { API_BASE_URL } from "../../../../lib/api-base-url";
import { getWaitlistCopy, isWaitlistTopic, WAITLIST_TOPICS } from "../../../../lib/waitlist-copy";

export function generateStaticParams() {
  return WAITLIST_TOPICS.map((topic) => ({ topic }));
}

/** Real demand, not a fabricated counter. Renders nothing if the call fails. */
async function getCount(topic: string): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/waitlist/count?topic=${topic}`, {
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
      <div className="wl-aperture">
        <Aperture live={count !== null && count > 0} />
      </div>
    </section>
  );
}
