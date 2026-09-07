import type { Locale } from "@manzil/shared";
import type { GurmanPreviewCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";

const titleByLocale: Record<Locale, string> = {
  uz: "Gurman qanday ishlaydi",
  ru: "Как работает Gurman",
  en: "How Gurman works"
};

const eyebrowByLocale: Record<Locale, string> = {
  uz: "Gurman AI · mobil tajriba",
  ru: "Gurman AI · мобильный опыт",
  en: "Gurman AI · mobile concept"
};

export function GurmanVideoSection({
  copy,
  locale
}: {
  copy: GurmanPreviewCopy;
  locale: Locale;
}) {
  const title = titleByLocale[locale] ?? titleByLocale.uz;
  const eyebrow = eyebrowByLocale[locale] ?? eyebrowByLocale.uz;

  return (
    <section aria-labelledby="gurman-video-title" className="gurman-video" id="gurman-video">
      <div className="container">
        <Reveal as="div" className="gurman-video__header" variant="fade-up">
          <span className="gurman-video__eyebrow">{eyebrow}</span>
          <h2 className="gurman-video__title" id="gurman-video-title">
            {title}
          </h2>
          <p className="gurman-video__description">{copy.description}</p>
        </Reveal>

        <Reveal as="div" className="gurman-video__frame" delay={120} variant="fade-up">
          <video
            aria-label={title}
            autoPlay
            controls
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/media/gurman/gurman-how-it-works.mp4" type="video/mp4" />
          </video>
        </Reveal>
      </div>
    </section>
  );
}
