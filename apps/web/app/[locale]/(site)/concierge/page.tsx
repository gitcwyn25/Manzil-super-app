import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { ConciergeChat } from "../../../components/concierge-chat";
import { getConciergePrompts } from "../../../lib/api";

export default async function ConciergePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  // The business list used to be fetched here so the client could resolve a
  // slug to a name. Gurman now returns grounded names with each suggestion,
  // so shipping the whole catalog to the browser is no longer needed.
  const prompts = await getConciergePrompts();

  return (
    <section className="section-block container concierge-page">
      <div className="section-heading">
        <p className="section-kicker">{copy.concierge.kicker}</p>
        <h1>{copy.concierge.title}</h1>
        <p>{copy.concierge.subtitle}</p>
      </div>
      <ConciergeChat locale={locale} prompts={prompts} />
    </section>
  );
}
