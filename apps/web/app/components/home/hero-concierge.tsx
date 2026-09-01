"use client";

import type { Locale } from "@manzil/shared";
import { GurmanAiBackground } from "../gurman-ai-background";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export type HeroConciergeCopy = {
  badge: string;
  /** Line 1 renders white, line 2 in the mint accent (per the approved PNG). */
  title1: string;
  title2: string;
  subtitle: string;
  /** Primary (mint) CTA → /{locale}/discover. */
  explore: string;
  /** Ghost CTA → /{locale}/concierge, where Gurman AI actually runs. */
  how: string;
  chatName: string;
  chatStatus: string;
  chatAi: string;
  chatUser: string;
};

/**
 * The homepage hero — the one deliberate GREEN brand moment (D6): a
 * secondary-green gradient with mint accents while everything below stays
 * blue-first. The brand wordmark in the sticky header above remains primary
 * blue.
 *
 * Copy stance per D8: the headline carries the AI energy, the paragraph and
 * the chat mockup claim only what Gurman AI does — recommendations from real
 * reviews and real catalog data. No bookings, no invented venues.
 *
 * The Three.js particle swarm animation brings the AI concierge presence to life,
 * paired with accessible server-rendered content and responsive layout.
 */
export function HeroConcierge({ copy, locale }: { copy: HeroConciergeCopy; locale: Locale }) {
  return (
    <section className="vm-hero">
      <GurmanAiBackground opacity={0.55} dotColor="#F4F1EA" accentColor="#00FFCB" />
      <div aria-hidden="true" className="vm-hero__orbs">
        <span className="vm-hero__orb vm-hero__orb--one" />
        <span className="vm-hero__orb vm-hero__orb--two" />
        <span className="vm-hero__orb vm-hero__orb--three" />
      </div>

      <div className="vm-hero__inner">
        <div className="vm-hero__copy">
          <Reveal as="div" variant="fade-up">
            <span className="vm-hero__badge">
              <Icon name="sparkles" size={16} />
              {copy.badge}
            </span>
          </Reveal>

          <Reveal as="div" delay={80} variant="fade-up">
            <h1 className="vm-hero__title">
              <span>{copy.title1}</span>
              <span className="vm-hero__title-accent">{copy.title2}</span>
            </h1>
          </Reveal>

          <Reveal as="div" delay={160} variant="fade-up">
            <p className="vm-hero__sub">{copy.subtitle}</p>
          </Reveal>

          <Reveal as="div" delay={240} variant="fade-up">
            <div className="vm-hero__actions">
              <a className="vm-hero__cta" href={`/${locale}/discover`}>
                <Icon name="search" size={18} />
                {copy.explore}
              </a>
              <a className="vm-hero__ghost" href={`/${locale}/concierge`}>
                <Icon name="robot" size={18} />
                {copy.how}
              </a>
            </div>
          </Reveal>
        </div>

        {/* Static chat illustration (lg+ only): an honest exchange — Gurman
            offers review-grounded recommendations, the visitor asks. */}
        <div className="vm-hero__preview">
          <div className="vm-hero__chat">
            <div className="vm-hero__chat-head">
              <span className="vm-hero__chat-avatar">
                <Icon name="robot" size={20} />
              </span>
              <span className="vm-hero__chat-id">
                <span className="vm-hero__chat-name">{copy.chatName}</span>
                <span className="vm-hero__chat-status">{copy.chatStatus}</span>
              </span>
            </div>
            <p className="vm-hero__bubble vm-hero__bubble--ai">{copy.chatAi}</p>
            <p className="vm-hero__bubble vm-hero__bubble--user">{copy.chatUser}</p>
          </div>
        </div>
      </div>

      {/* Wave divider: 60px curve filled with the page background, easing the
          green hero into the light canvas below. */}
      <svg
        aria-hidden="true"
        className="vm-hero__wave"
        preserveAspectRatio="none"
        viewBox="0 0 1440 64"
      >
        <path
          d="M0 64 L0 40 C 240 8 480 0 720 14 C 960 28 1200 30 1440 12 L1440 64 Z"
          fill="currentColor"
        />
      </svg>
    </section>
  );
}
