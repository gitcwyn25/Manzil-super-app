import { Reveal, RevealStagger } from "../motion/reveal";
import { IconTile } from "../vm/icon-tile";
import type { IconName } from "../vm/icons";

export type FeatureTrioCopy = {
  title: string;
  subtitle: string;
  /** Exactly three cards: Smart Itineraries / Real-Time discovery / Personalized (D9). */
  items: Array<{ title: string; text: string }>;
};

// Accent + glyph per slot, per the approved PNG: blue calendar, green
// verified, orange tune.
const SLOTS: Array<{ accent: "primary" | "secondary" | "tertiary"; icon: IconName }> = [
  { accent: "primary", icon: "calendar" },
  { accent: "secondary", icon: "verified" },
  { accent: "tertiary", icon: "tune" }
];

/**
 * The AI-concierge feature trio (D9 — replaces AudienceFeatures on home):
 * three white L1 cards whose 56px icon tiles fill solid on card hover
 * (IconTile + .vm-hover-group). Copy is honest per D8 — recommendations from
 * real reviews and the live catalog, no booking or profiling claims.
 */
export function FeatureTrio({ copy }: { copy: FeatureTrioCopy }) {
  return (
    <section className="vm-trio">
      <div className="container">
        <Reveal variant="fade-up">
          <header className="vm-trio__head">
            <h2 className="vm-trio__title">{copy.title}</h2>
            <p className="vm-trio__sub">{copy.subtitle}</p>
          </header>
        </Reveal>

        <RevealStagger className="vm-trio__grid" step={90} variant="fade-up">
          {copy.items.slice(0, SLOTS.length).map((item, index) => (
            <article className="vm-trio__card vm-hover-group" key={item.title}>
              <IconTile accent={SLOTS[index].accent} icon={SLOTS[index].icon} size="lg" />
              <h3 className="vm-trio__card-title">{item.title}</h3>
              <p className="vm-trio__card-text">{item.text}</p>
            </article>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
