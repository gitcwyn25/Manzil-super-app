"use client";

import type { Locale } from "@manzil/shared";
import CloudSky from "@/components/originkit/ui/cloud-sky";
import type { CleverHeroCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverHero({ copy, locale }: { copy: CleverHeroCopy; locale: Locale }) {
  return (
    <section className="clever-hero" id="hero">
      <CloudSky
        className="clever-hero__cloud-sky"
        background="#edf6ff"
        baseColor="#e6f0f9"
        accentColor="#ffffff"
        density={68}
        speed={18}
        size={105}
        clouds={{ softness: 125, shadow: 55, cirrus: 28 }}
        sun={{ x: 78, y: 88, glow: "rgba(255, 249, 222, 0.78)" }}
        pointer={{ parallax: 26, wind: 22, damping: 18 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          pointerEvents: "none",
          borderRadius: 0
        }}
      />
      <div aria-hidden="true" className="clever-hero__glow clever-hero__glow--top" />
      <div aria-hidden="true" className="clever-hero__glow clever-hero__glow--bottom" />

      <div className="container clever-hero__container">
        <div className="clever-hero__content">
          <Reveal as="div" variant="fade-up">
            <div className="clever-hero__pill-wrapper">
              <span className="clever-hero__pill">
                <span aria-hidden="true" className="clever-hero__avatar-stack">
                  <span className="clever-hero__avatar clever-hero__avatar--1">UZ</span>
                  <span className="clever-hero__avatar clever-hero__avatar--2">M</span>
                  <span className="clever-hero__avatar clever-hero__avatar--3">★</span>
                </span>
                <span className="clever-hero__pill-text">{copy.memberBadge}</span>
                <Icon name="arrow_forward" size={14} className="clever-hero__pill-arrow" />
              </span>
            </div>
          </Reveal>

          <Reveal as="div" delay={80} variant="fade-up">
            <h1 className="clever-hero__title">
              <span className="clever-hero__title-line">{copy.title1}</span>
              <span className="clever-hero__title-accent">{copy.title2}</span>
            </h1>
          </Reveal>

          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-hero__subtitle">{copy.subtitle}</p>
          </Reveal>

          <Reveal as="div" delay={240} variant="fade-up">
            <div className="clever-hero__actions">
              <a className="clever-btn clever-btn--primary" href={`/${locale}/discover`}>
                <Icon name="search" size={18} />
                <span>{copy.explore}</span>
                <Icon name="arrow_forward" size={16} />
              </a>
              <a className="clever-btn clever-btn--glass" href={`/${locale}/waitlist/gurman`}>
                <Icon name="sparkles" size={18} />
                <span>{copy.secondaryCta}</span>
              </a>
            </div>
          </Reveal>

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
        </div>

        <Reveal as="div" delay={180} variant="fade-up">
          <div aria-label={copy.systemAriaLabel} className="clever-hero__system" role="img">
            <div aria-hidden="true" className="clever-hero__companion">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                src="/media/gurman/wonder-sitting-transparent.webm"
              />
            </div>
            <div className="clever-hero__system-topline">
              <span>Manzil</span>
              <span className="clever-hero__system-line" />
              <span>Discover → Gurman</span>
            </div>

            <div className="clever-hero__system-cards">
              <div className="clever-hero__system-card clever-hero__system-card--live">
                <div className="clever-hero__system-card-head">
                  <span className="clever-status clever-status--live">
                    <span aria-hidden="true" className="clever-status__dot" />
                    {copy.systemLiveLabel}
                  </span>
                  <Icon name="search" size={18} />
                </div>
                <strong>{copy.systemLiveTitle}</strong>
                <span className="clever-hero__system-card-meta">Manzil Discover</span>
              </div>

              <div aria-hidden="true" className="clever-hero__system-connector">
                <Icon name="arrow_forward" size={18} />
              </div>

              <div className="clever-hero__system-card clever-hero__system-card--future">
                <div className="clever-hero__system-card-head">
                  <span className="clever-status clever-status--preview">{copy.systemFutureLabel}</span>
                  <Icon name="sparkles" size={18} />
                </div>
                <strong>{copy.systemFutureTitle}</strong>
                <span className="clever-hero__system-card-meta">{copy.systemFutureNote}</span>
              </div>
            </div>

            <div className="clever-hero__system-chips" aria-hidden="true">
              {copy.systemChips.map((chip) => (
                <span className="clever-hero__system-chip" key={chip}>{chip}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
