import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { ConciergeChat } from "../../../components/concierge-chat";
import { GurmanAiBackground } from "../../../components/gurman-ai-background";
import { IconTile } from "../../../components/vm/icon-tile";
import { Icon } from "../../../components/vm/icons";
import type { Metadata } from "next";
import { JsonLd } from "../../../components/json-ld";
import { getConciergePrompts } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("concierge", locale);
}

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
  const breadcrumb = routeBreadcrumb(locale, ["home", "concierge"]);

  const panelPoints = [
    {
      icon: "verified",
      accent: "primary",
      title: copy.concierge.panelRealTitle,
      body: copy.concierge.panelRealBody
    },
    {
      icon: "star",
      accent: "tertiary",
      title: copy.concierge.panelReviewsTitle,
      body: copy.concierge.panelReviewsBody
    },
    {
      icon: "globe",
      accent: "secondary",
      title: copy.concierge.panelLangTitle,
      body: copy.concierge.panelLangBody
    }
  ] as const;

  return (
    <section className="section-block container concierge-page">
      <GurmanAiBackground opacity={0.3} dotColor="#F4F1EA" accentColor="#00FFCB" />
      <JsonLd data={breadcrumb} />
      <div className="section-heading">
        <p className="section-kicker">{copy.concierge.kicker}</p>
        <h1>{copy.concierge.title}</h1>
        <p>{copy.concierge.subtitle}</p>
      </div>

      <div className="concierge-layout">
        <ConciergeChat locale={locale} prompts={prompts} />

        {/* Package-panel slot. The mock's priced itinerary panel is deferred
            per D8: no Gurman package endpoint exists (GurmanPackageResult is
            an unused stub), so fabricating stops/prices here would break the
            grounding promise. Until the API ships, this column states — in
            plain terms — what Gurman actually does today. */}
        <aside className="concierge-aside">
          <div className="concierge-about">
            <h2 className="concierge-about__title">{copy.concierge.panelTitle}</h2>
            <ul className="concierge-about__list">
              {panelPoints.map((point) => (
                <li className="concierge-about__item vm-hover-group" key={point.icon}>
                  <IconTile accent={point.accent} icon={point.icon} size="sm" />
                  <div>
                    <p className="concierge-about__item-title">{point.title}</p>
                    <p className="concierge-about__item-body">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="concierge-about__note">
              <Icon name="schedule" size={16} />
              <span>{copy.concierge.panelNote}</span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
