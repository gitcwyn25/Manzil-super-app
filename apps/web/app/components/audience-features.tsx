"use client";

import { useState } from "react";
import type { AudienceSamples } from "../lib/audience-samples";

export type AudienceCard = {
  title: string;
  text: string;
  tone: "gray" | "purple" | "mint" | "plain";
  mock: "listing" | "review" | "inbox" | "stats" | "profile" | "story" | "search" | "follow";
};

export type AudienceContent = {
  toggleBusiness: string;
  toggleCustomer: string;
  business: AudienceCard[];
  customer: AudienceCard[];
};

/** ISO Meet-style bento: a pill toggle switches the audience, cards below. */
export function AudienceFeatures({
  content,
  samples
}: {
  content: AudienceContent;
  samples: AudienceSamples;
}) {
  const [audience, setAudience] = useState<"business" | "customer">("business");
  const cards = audience === "business" ? content.business : content.customer;

  return (
    <div className="af-wrap">
      <div className="af-toggle" role="tablist">
        <span aria-hidden="true" className={`af-toggle-pill${audience === "customer" ? " right" : ""}`} />
        <button
          aria-selected={audience === "business" ? "true" : "false"}
          className={audience === "business" ? "active" : undefined}
          onClick={() => setAudience("business")}
          role="tab"
          type="button"
        >
          {content.toggleBusiness}
        </button>
        <button
          aria-selected={audience === "customer" ? "true" : "false"}
          className={audience === "customer" ? "active" : undefined}
          onClick={() => setAudience("customer")}
          role="tab"
          type="button"
        >
          {content.toggleCustomer}
        </button>
      </div>

      <div className="af-grid" key={audience}>
        {cards.map((card, index) => (
          <article className={`af-card af-${card.tone}`} key={card.title} style={{ animationDelay: `${index * 70}ms` }}>
            <div className="af-card-copy">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
            <CardMock kind={card.mock} samples={samples} />
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Avatar built from an initial rather than a photo or an emoji.
 *
 * The brand voice rules out emoji, and a real photograph in a mockup implies a
 * real person who has not consented to appear in marketing. An initial on a
 * brand-tinted disc reads as a populated product without either problem.
 */
function Avatar({ initial, tone, size }: { initial: string; tone: 1 | 2 | 3 | 4; size?: "sm" }) {
  return (
    <span aria-hidden="true" className={`afm-av afm-av-${tone}${size === "sm" ? " sm" : ""}`}>
      {initial}
    </span>
  );
}

/** Small self-contained UI mockups rendered in CSS — no images, no icons. */
function CardMock({ kind, samples }: { kind: AudienceCard["mock"]; samples: AudienceSamples }) {
  if (kind === "listing") {
    const { listing } = samples;
    return (
      <div aria-hidden="true" className="afm afm-listing">
        <div className="afm-sheet">
          <div className="afm-row">
            <Avatar initial={listing.name.charAt(0)} tone={1} />
            <div className="afm-rowtext">
              <b>{listing.name}</b>
              <i>{listing.meta}</i>
            </div>
          </div>
          <dl className="afm-facts">
            <div>
              <dt>{listing.hours}</dt>
            </div>
            <div>
              <dt>{listing.phone}</dt>
            </div>
          </dl>
          <div className="afm-chiprow">
            <span className="is-open">{listing.chipOpen}</span>
            <span>{listing.chipVerified}</span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "review") {
    const { review } = samples;
    return (
      <div aria-hidden="true" className="afm afm-review">
        <div className="afm-sheet">
          <div className="afm-row tight">
            <Avatar initial={review.initial} tone={2} size="sm" />
            <div className="afm-rowtext">
              <b>{review.author}</b>
              <span className="afm-stars">★★★★★</span>
            </div>
          </div>
          <p className="afm-quote">{review.text}</p>
          <div className="afm-reply">
            <b>{review.replyLabel}</b>
            <p>{review.replyText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "inbox") {
    const { inbox } = samples;
    return (
      <div aria-hidden="true" className="afm afm-inbox">
        <div className="afm-sheet">
          <b className="afm-title">{inbox.title}</b>
          {inbox.items.map((item) => (
            <div className="afm-msg" key={item.label}>
              <span className={`afm-dot ${item.tone}`} />
              <span className="afm-msg-label">{item.label}</span>
              <em>{item.meta}</em>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "stats") {
    const { stats } = samples;
    const heights = [34, 58, 42, 76, 64, 90, 70];
    return (
      <div aria-hidden="true" className="afm afm-stats">
        <div className="afm-sheet">
          <div className="afm-stats-head">
            <b className="afm-title">{stats.title}</b>
            <span className="afm-delta">{stats.delta}</span>
          </div>
          <strong className="afm-total">{stats.total}</strong>
          <div className="afm-bars">
            {heights.map((height, i) => (
              <span key={stats.days[i]} style={{ ["--h" as string]: `${height}%`, animationDelay: `${i * 60}ms` }}>
                <i>{stats.days[i]}</i>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "profile") {
    const { profile } = samples;
    return (
      <div aria-hidden="true" className="afm afm-profile">
        <div className="afm-sheet">
          <Avatar initial={profile.initial} tone={3} />
          <b className="afm-title center">{profile.name}</b>
          <i className="afm-handle">{profile.handle}</i>
          <div className="afm-counts">
            {profile.counts.map((count) => (
              <span key={count.label}>
                <b>{count.value}</b>
                <i>{count.label}</i>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "story") {
    const { story } = samples;
    return (
      <div aria-hidden="true" className="afm afm-story">
        <div className="afm-sheet">
          <div className="afm-photo">
            <span className="afm-photo-place">{story.place}</span>
          </div>
          <div className="afm-storyfoot">
            <span className="afm-caption">{story.caption}</span>
            <em className="afm-likes">♥ {story.likes}</em>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "search") {
    const { search } = samples;
    return (
      <div aria-hidden="true" className="afm afm-search">
        <div className="afm-sheet">
          <div className="afm-searchbar">
            <span className="afm-searchicon" />
            <span className="afm-searchtext">{search.query}</span>
          </div>
          {search.results.map((result, i) => (
            <div className="afm-row" key={result.name}>
              <Avatar initial={result.initial} tone={i === 0 ? 1 : 4} size="sm" />
              <div className="afm-rowtext">
                <b>{result.name}</b>
                <i>{result.meta}</i>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { follow } = samples;
  return (
    <div aria-hidden="true" className="afm afm-follow">
      <div className="afm-sheet">
        {follow.people.map((person, i) => (
          <div className="afm-row" key={person.name}>
            <Avatar initial={person.initial} tone={i === 0 ? 2 : 3} size="sm" />
            <div className="afm-rowtext">
              <b>{person.name}</b>
              <i>{person.meta}</i>
            </div>
            <em className={person.ghost ? "afm-btn ghost" : "afm-btn"}>{person.action}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
