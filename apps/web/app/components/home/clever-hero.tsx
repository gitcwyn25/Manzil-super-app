"use client";

import type { Locale } from "@manzil/shared";
import type { CleverHeroCopy } from "../../lib/landing-copy";
import { GurmanAiBackground } from "../gurman-ai-background";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverHero({ copy, locale }: { copy: CleverHeroCopy; locale: Locale }) {
  return (
    <section className="clever-hero" id="hero">
      <GurmanAiBackground opacity={0.45} dotColor="#F4F1EA" accentColor="#00FFCB" />

      {/* Decorative ambient gradients */}
      <div aria-hidden="true" className="clever-hero__glow clever-hero__glow--top" />
      <div aria-hidden="true" className="clever-hero__glow clever-hero__glow--bottom" />

      <div className="container clever-hero__container">
        {/* Eyebrow avatar pill */}
        <Reveal as="div" variant="fade-up">
          <div className="clever-hero__pill-wrapper">
            <span className="clever-hero__pill">
              <span className="clever-hero__avatar-stack" aria-hidden="true">
                <span className="clever-hero__avatar clever-hero__avatar--1">UZ</span>
                <span className="clever-hero__avatar clever-hero__avatar--2">AI</span>
                <span className="clever-hero__avatar clever-hero__avatar--3">★</span>
              </span>
              <span className="clever-hero__pill-text">{copy.memberBadge}</span>
              <Icon name="arrow_forward" size={14} className="clever-hero__pill-arrow" />
            </span>
          </div>
        </Reveal>

        {/* Main headline */}
        <Reveal as="div" delay={80} variant="fade-up">
          <h1 className="clever-hero__title">
            <span className="clever-hero__title-line">{copy.title1}</span>
            <span className="clever-hero__title-accent">{copy.title2}</span>
          </h1>
        </Reveal>

        {/* Subtitle */}
        <Reveal as="div" delay={160} variant="fade-up">
          <p className="clever-hero__subtitle">{copy.subtitle}</p>
        </Reveal>

        {/* Action buttons */}
        <Reveal as="div" delay={240} variant="fade-up">
          <div className="clever-hero__actions">
            <a className="clever-btn clever-btn--primary" href={`/${locale}/discover`}>
              <Icon name="search" size={18} />
              <span>{copy.explore}</span>
              <Icon name="arrow_forward" size={16} />
            </a>
            <a className="clever-btn clever-btn--glass" href={`/${locale}/concierge`}>
              <Icon name="sparkles" size={18} />
              <span>{copy.how}</span>
            </a>
          </div>
        </Reveal>

        {/* Trust strip */}
        <Reveal as="div" delay={320} variant="fade-up">
          <div className="clever-hero__trust">
            {copy.microPerks.map((perk, i) => (
              <span className="clever-hero__trust-item" key={i}>
                <Icon name="verified" size={16} className="clever-hero__trust-icon" />
                <span>{perk}</span>
              </span>
            ))}
          </div>
        </Reveal>

        {/* Glass chat preview widget */}
        <Reveal as="div" delay={400} variant="fade-up">
          <div className="clever-hero__preview-wrapper">
            <div className="clever-hero__chat-card">
              <div className="clever-hero__chat-header">
                <div className="clever-hero__chat-avatar">
                  <Icon name="robot" size={20} />
                  <span className="clever-hero__chat-online" />
                </div>
                <div className="clever-hero__chat-meta">
                  <div className="clever-hero__chat-name">{copy.chatName}</div>
                  <div className="clever-hero__chat-status">{copy.chatStatus}</div>
                </div>
                <span className="clever-hero__chat-badge">AI Live</span>
              </div>

              <div className="clever-hero__chat-body">
                <div className="clever-hero__bubble clever-hero__bubble--user">
                  <p>{copy.chatUser}</p>
                </div>
                <div className="clever-hero__bubble clever-hero__bubble--ai">
                  <span className="clever-hero__bubble-icon">
                    <Icon name="sparkles" size={16} />
                  </span>
                  <p>{copy.chatAi}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
