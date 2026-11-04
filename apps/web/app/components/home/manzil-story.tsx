import type { ManzilStoryCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";

export function ManzilStory({ copy }: { copy: ManzilStoryCopy }) {
  const stories = [
    { id: "discover", ...copy.discover },
    { id: "care", ...copy.care },
    { id: "trust", ...copy.trust },
    { id: "share", ...copy.share }
  ];
  return (
    <section aria-labelledby="manzil-story-title" className="manzil-story" id="benefits">
      <div className="container">
        <div className="manzil-story__header">
          <h2 className="manzil-story__title" id="manzil-story-title">{copy.title}</h2>
          <p className="manzil-story__subtitle">{copy.subtitle}</p>
        </div>
        <div className="manzil-story__grid">
          {stories.map((story, index) => (
            <Reveal as="div" key={story.id} delay={index * 60} variant="fade-up">
              <article className="manzil-story__summary" aria-labelledby={"manzil-story-card-" + story.id}>
                <div className="manzil-story__summary-top">
                  <span className="manzil-story__index" aria-hidden="true">0{index + 1}</span>
                  <span className="manzil-story__label">{story.tag}</span>
                  {story.id === "care" && <span className="manzil-story__status">{copy.care.context}</span>}
                </div>
                <h3 id={"manzil-story-card-" + story.id}>{story.title}</h3>
                <p>{story.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
