"use client";

import { useState } from "react";

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
export function AudienceFeatures({ content }: { content: AudienceContent }) {
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
            <CardMock kind={card.mock} />
          </article>
        ))}
      </div>
    </div>
  );
}

/** Small self-contained UI mockups rendered in CSS — no images, no icons. */
function CardMock({ kind }: { kind: AudienceCard["mock"] }) {
  if (kind === "listing") {
    return (
      <div aria-hidden="true" className="afm afm-listing">
        <div className="afm-sheet">
          <div className="afm-row"><span className="afm-dot" /><div><b>Business name</b><i>Category · District</i></div></div>
          <div className="afm-line w70" />
          <div className="afm-line w45" />
          <div className="afm-chiprow"><span>Open</span><span>Verified</span></div>
        </div>
      </div>
    );
  }

  if (kind === "review") {
    return (
      <div aria-hidden="true" className="afm afm-review">
        <div className="afm-sheet">
          <div className="afm-stars">★★★★★</div>
          <div className="afm-line w80" />
          <div className="afm-line w60" />
          <div className="afm-reply"><b>Owner reply</b><div className="afm-line w70" /></div>
        </div>
      </div>
    );
  }

  if (kind === "inbox") {
    return (
      <div aria-hidden="true" className="afm afm-inbox">
        <div className="afm-sheet">
          <b className="afm-title">Announcements</b>
          <div className="afm-msg"><span className="afm-dot gold" /><div className="afm-line w75" /></div>
          <div className="afm-msg"><span className="afm-dot teal" /><div className="afm-line w55" /></div>
          <div className="afm-msg"><span className="afm-dot terra" /><div className="afm-line w65" /></div>
        </div>
      </div>
    );
  }

  if (kind === "stats") {
    return (
      <div aria-hidden="true" className="afm afm-stats">
        <div className="afm-sheet">
          <b className="afm-title">This week</b>
          <div className="afm-bars">
            <span style={{ height: "34%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "42%" }} />
            <span style={{ height: "76%" }} />
            <span style={{ height: "64%" }} />
            <span style={{ height: "90%" }} />
            <span style={{ height: "70%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div aria-hidden="true" className="afm afm-profile">
        <div className="afm-sheet">
          <div className="afm-avatar" />
          <b className="afm-title center">Your name</b>
          <div className="afm-counts"><span><b>128</b><i>Posts</i></span><span><b>2.4k</b><i>Followers</i></span><span><b>310</b><i>Following</i></span></div>
        </div>
      </div>
    );
  }

  if (kind === "story") {
    return (
      <div aria-hidden="true" className="afm afm-story">
        <div className="afm-sheet">
          <div className="afm-photo" />
          <div className="afm-actions"><span /><span /><span /></div>
          <div className="afm-line w70" />
        </div>
      </div>
    );
  }

  if (kind === "search") {
    return (
      <div aria-hidden="true" className="afm afm-search">
        <div className="afm-sheet">
          <div className="afm-searchbar" />
          <div className="afm-row"><span className="afm-thumb a" /><div><b>Coffee shop</b><i>★ 4.7 · 1.2 km</i></div></div>
          <div className="afm-row"><span className="afm-thumb b" /><div><b>Restaurant</b><i>★ 4.8 · 2.0 km</i></div></div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="afm afm-follow">
      <div className="afm-sheet">
        <div className="afm-row"><span className="afm-avatar sm" /><div><b>Friend</b><i>Followed you</i></div><em className="afm-btn">Follow</em></div>
        <div className="afm-row"><span className="afm-avatar sm alt" /><div><b>Friend</b><i>Shared a story</i></div><em className="afm-btn ghost">View</em></div>
      </div>
    </div>
  );
}
