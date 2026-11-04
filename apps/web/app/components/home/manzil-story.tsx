import type { ManzilStoryCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function ManzilStory({ copy }: { copy: ManzilStoryCopy }) {
  const { discover, care, trust, share } = copy;

  return (
    <section
      aria-labelledby="manzil-story-title"
      className="manzil-story"
      id="benefits"
    >
      <div className="container">
        <div className="manzil-story__header">
          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="manzil-story__title" id="manzil-story-title">
              {copy.title}
            </h2>
          </Reveal>
          <Reveal as="div" delay={160} variant="fade-up">
            <p className="manzil-story__subtitle">{copy.subtitle}</p>
          </Reveal>
        </div>

        <div className="manzil-story__grid">
          <Reveal as="div" delay={0} variant="fade-up">
            <article
              aria-labelledby="manzil-story-card-discover"
              className="manzil-story__card manzil-story__card--discover"
            >
              <div className="manzil-story__visual">
                <div className="story-scene story-scene--discover">
                  <div className="story-scene__topline">
                    <span className="story-scene__eyebrow">{discover.eyebrow}</span>
                    <span className="story-scene__context">{discover.context}</span>
                  </div>
                  <div className="story-map" aria-hidden="true">
                    <svg className="story-map__svg" viewBox="0 0 520 280" role="presentation">
                      <path className="story-map__road story-map__road--wide" d="M-20 74C95 98 128 35 238 68s160 89 302 42" />
                      <path className="story-map__road" d="M-20 224c116-20 160-116 273-89s130 99 286 61" />
                      <path className="story-map__road" d="M60-25c35 100 82 129 158 156s161 15 247 125" />
                      <path className="story-map__road story-map__road--soft" d="M320-28c-7 94-65 121-66 206s67 91 78 142" />
                      <path className="story-map__route" d="M90 235C148 219 164 171 221 175s78 24 111-14 45-82 102-82" />
                      <circle className="story-map__route-dot" cx="90" cy="235" r="5" />
                      <circle className="story-map__route-dot story-map__route-dot--end" cx="434" cy="79" r="5" />
                    </svg>
                    <span className="story-map__district story-map__district--one">{discover.districtOne}</span>
                    <span className="story-map__district story-map__district--two">{discover.districtTwo}</span>
                    <span className="story-marker" aria-hidden="true">
                      <span className="story-marker__dot" />
                    </span>
                    <div className="story-place-sheet">
                      <div className="story-place-art story-place-art--discover" aria-hidden="true">
                        <span className="story-place-art__sun" />
                        <span className="story-place-art__arch" />
                        <span className="story-place-art__house" />
                      </div>
                      <div className="story-place-sheet__copy">
                        <strong>{discover.placeName}</strong>
                        <span>{discover.placeMeta}</span>
                      </div>
                      <Icon name="bookmark" size={16} />
                    </div>
                  </div>
                  <div className="story-chip-row">
                    <span className="story-chip">
                      <Icon name="coffee" size={13} />
                      {discover.chipOne}
                    </span>
                    <span className="story-chip">
                      <Icon name="location" size={13} />
                      {discover.chipTwo}
                    </span>
                  </div>
                </div>
              </div>
              <div className="manzil-story__body">
                <div className="manzil-story__meta">
                  <span className="manzil-story__tag">
                    <Icon name="location" size={13} />
                    {discover.tag}
                  </span>
                </div>
                <h3 className="manzil-story__card-title" id="manzil-story-card-discover">
                  {discover.title}
                </h3>
                <p className="manzil-story__card-description">{discover.description}</p>
              </div>
            </article>
          </Reveal>

          <Reveal as="div" delay={100} variant="fade-up">
            <article
              aria-labelledby="manzil-story-card-care"
              className="manzil-story__card manzil-story__card--care"
            >
              <div className="manzil-story__visual">
                <div className="story-scene story-scene--care">
                  <div className="story-scene__topline">
                    <span className="story-scene__eyebrow">{care.eyebrow}</span>
                    <span className="story-scene__concept">{care.context}</span>
                  </div>
                  <div className="story-care__shell">
                    <div className="story-care__title-row">
                      <div>
                        <span className="story-care__kicker">{care.kicker}</span>
                        <strong>{care.planTitle}</strong>
                      </div>
                      <span className="story-care__avatar">{care.avatar}</span>
                    </div>
                    <div className="story-care__field">
                      <span className="story-care__field-icon">
                        <Icon name="scissors" size={16} />
                      </span>
                      <span>{care.service}</span>
                      <Icon name="chevron_down" size={15} />
                    </div>
                    <div className="story-care__time">
                      <span>
                        <Icon name="calendar" size={15} />
                        {care.preferredTimeLabel}
                      </span>
                      <strong>{care.preferredTime}</strong>
                    </div>
                    <div className="story-care__plan">
                      <span className="story-care__plan-check">
                        <Icon name="check" size={14} />
                      </span>
                      <span>
                        <strong>{care.simplePlan}</strong>
                        <small>{care.simplePlanNote}</small>
                      </span>
                      <Icon name="arrow_forward" size={15} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="manzil-story__body">
                <div className="manzil-story__meta">
                  <span className="manzil-story__tag">
                    <Icon name="scissors" size={13} />
                    {care.tag}
                  </span>
                </div>
                <h3 className="manzil-story__card-title" id="manzil-story-card-care">
                  {care.title}
                </h3>
                <p className="manzil-story__card-description">{care.description}</p>
              </div>
            </article>
          </Reveal>

          <Reveal as="div" delay={200} variant="fade-up">
            <article
              aria-labelledby="manzil-story-card-trust"
              className="manzil-story__card manzil-story__card--trust"
            >
              <div className="manzil-story__visual">
                <div className="story-scene story-scene--trust">
                  <div className="story-scene__topline">
                    <span className="story-scene__eyebrow">{trust.eyebrow}</span>
                    <span className="story-scene__context">{trust.context}</span>
                  </div>
                  <div className="story-trust__profile">
                    <div className="story-trust__photo story-place-art story-place-art--trust" aria-hidden="true">
                      <span className="story-place-art__sun" />
                      <span className="story-place-art__tree story-place-art__tree--one" />
                      <span className="story-place-art__tree story-place-art__tree--two" />
                      <span className="story-place-art__table" />
                    </div>
                    <div className="story-trust__content">
                      <div className="story-trust__title-row">
                        <div>
                          <span className="story-trust__kicker">{trust.kicker}</span>
                          <strong>{trust.placeName}</strong>
                        </div>
                        <span className="story-trust__save">
                          <Icon name="bookmark" size={15} />
                        </span>
                      </div>
                      <p>{trust.quote}</p>
                      <div className="story-trust__footer">
                        <span>
                          <Icon name="location" size={13} />
                          {trust.location}
                        </span>
                        <span className="story-verdict">
                          <Icon name="thumbs_up" size={13} />
                          {trust.verdict}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="manzil-story__body">
                <div className="manzil-story__meta">
                  <span className="manzil-story__tag">
                    <Icon name="thumbs_up" size={13} />
                    {trust.tag}
                  </span>
                </div>
                <h3 className="manzil-story__card-title" id="manzil-story-card-trust">
                  {trust.title}
                </h3>
                <p className="manzil-story__card-description">{trust.description}</p>
              </div>
            </article>
          </Reveal>

          <Reveal as="div" delay={300} variant="fade-up">
            <article
              aria-labelledby="manzil-story-card-share"
              className="manzil-story__card manzil-story__card--share"
            >
              <div className="manzil-story__visual">
                <div className="story-scene story-scene--share">
                  <div className="story-scene__topline">
                    <span className="story-scene__eyebrow">{share.eyebrow}</span>
                    <span className="story-scene__context">{share.context}</span>
                  </div>
                  <div className="story-profile">
                    <div className="story-profile__header">
                      <span className="story-profile__avatar" aria-hidden="true">
                        {share.avatar}
                      </span>
                      <div className="story-profile__identity">
                        <strong>{share.name}</strong>
                        <span>{share.handle}</span>
                        <p>{share.statement}</p>
                      </div>
                      <Icon name="share" size={15} />
                    </div>
                    <div className="story-profile__chips">
                      {share.chips.map((chip) => <span key={chip}>{chip}</span>)}
                    </div>
                    <div className="story-profile__tabs" aria-hidden="true">
                      {share.tabs.map((tab, index) => (
                        <span className={`story-profile__tab ${index === 0 ? "story-profile__tab--active" : ""}`} key={tab}>
                          {tab}
                        </span>
                      ))}
                    </div>
                    <div className="story-profile__posts" aria-hidden="true">
                      <span className="story-profile__post story-profile__post--one" />
                      <span className="story-profile__post story-profile__post--two" />
                      <span className="story-profile__post story-profile__post--three" />
                    </div>
                    <div className="story-profile__footer">
                      <span>
                        <Icon name="location" size={13} />
                        {share.placeName}
                      </span>
                      <span className="story-verdict">
                        <Icon name="thumbs_up" size={13} />
                        {share.verdict}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="manzil-story__body">
                <div className="manzil-story__meta">
                  <span className="manzil-story__tag">
                    <Icon name="share" size={13} />
                    {share.tag}
                  </span>
                </div>
                <h3 className="manzil-story__card-title" id="manzil-story-card-share">
                  {share.title}
                </h3>
                <p className="manzil-story__card-description">{share.description}</p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
