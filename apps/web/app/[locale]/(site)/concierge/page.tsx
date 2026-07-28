import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { ConciergeChat } from "../../../components/concierge-chat";
import { getBusinesses, getConciergePrompts } from "../../../lib/api";

export default async function ConciergePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const [businesses, prompts] = await Promise.all([getBusinesses(), getConciergePrompts()]);

  return (
    <section className="section-block container concierge-page">
      <div className="section-heading">
        <p className="section-kicker">{copy.concierge.kicker}</p>
        <h1>{copy.concierge.title}</h1>
        <p>{copy.concierge.subtitle}</p>
      </div>
      <ConciergeChat businesses={businesses} locale={locale} prompts={prompts} />
    </section>
  );
}
