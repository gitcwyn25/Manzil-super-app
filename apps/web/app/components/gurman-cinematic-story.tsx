"use client";

import type { Locale } from "@manzil/shared";
import { useEffect, useRef } from "react";
import type { GurmanLandingCopy } from "../lib/gurman-landing-copy";

const VIDEO_ID = "CxOYDJKz5dc";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function sceneWeight(progress: number, start: number, end: number) {
  // Each scene owns its interval. It fades in after the previous scene has
  // fully left, so headlines never sit on top of one another during a fast
  // scroll or when the browser is catching up with smooth scrolling.
  const fade = 0.04;
  const enter = start === 0 ? 1 : clamp((progress - start) / fade);
  const exit = 1 - clamp((progress - (end - fade)) / fade);
  return enter * exit;
}

export function GurmanCinematicStory({
  copy,
  locale,
  includeVideo = true
}: {
  copy: GurmanLandingCopy;
  locale: Locale;
  includeVideo?: boolean;
}) {
  const scrollRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = scrollRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let initialized = false;
    let smoothProgress = 0;

    const update = () => {
      raf = 0;
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const travelled = clamp(-section.getBoundingClientRect().top, 0, distance);
      const target = travelled / distance;

      if (!initialized || reducedMotion.matches) {
        smoothProgress = target;
        initialized = true;
      } else {
        smoothProgress += (target - smoothProgress) * 0.14;
        if (Math.abs(smoothProgress - target) < 0.001) smoothProgress = target;
      }

      const hero = sceneWeight(smoothProgress, 0, 0.16);
      const evidence = sceneWeight(smoothProgress, 0.16, 0.32);
      const intelligence = sceneWeight(smoothProgress, 0.32, 0.5);
      const memory = sceneWeight(smoothProgress, 0.5, 0.68);
      const collaboration = sceneWeight(smoothProgress, 0.68, 0.86);
      const close = sceneWeight(smoothProgress, 0.86, 1.02);
      const sceneWeights = [hero, evidence, intelligence, memory, collaboration, close];
      const activeScene = sceneWeights.reduce(
        (best, weight, index) => (weight > sceneWeights[best] ? index : best),
        0
      );

      stage.querySelectorAll<HTMLElement>(".gurman-cinematic__scene").forEach((scene, index) => {
        const active = index === activeScene;
        scene.classList.toggle("is-active", active);
        scene.setAttribute("aria-hidden", active ? "false" : "true");
      });
      stage.querySelectorAll<HTMLElement>(".gurman-cinematic__progress-label").forEach((label, index) => {
        label.classList.toggle("is-current", index === activeScene);
      });

      stage.style.setProperty("--story-progress", smoothProgress.toFixed(4));
      stage.style.setProperty("--scene-hero", hero.toFixed(4));
      stage.style.setProperty("--scene-evidence", evidence.toFixed(4));
      stage.style.setProperty("--scene-intelligence", intelligence.toFixed(4));
      stage.style.setProperty("--scene-memory", memory.toFixed(4));
      stage.style.setProperty("--scene-collaboration", collaboration.toFixed(4));
      stage.style.setProperty("--scene-close", close.toFixed(4));

      if (Math.abs(smoothProgress - target) > 0.001) requestTick();
    };

    const requestTick = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    const onScroll = () => requestTick();
    const onResize = () => requestTick();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    reducedMotion.addEventListener?.("change", onResize);
    requestTick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reducedMotion.removeEventListener?.("change", onResize);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const storyLabels = [
    copy.hero.titleLine1,
    copy.trust.eyebrow,
    copy.intelligence.eyebrow,
    copy.memory.eyebrow,
    copy.collaboration.eyebrow,
    copy.cta.eyebrow
  ];

  return (
    <section
      ref={scrollRef}
      aria-label={copy.hero.badge}
      className="gurman-cinematic"
      id="gurman-story"
    >
      <div ref={stageRef} className="gurman-cinematic__stage">
        <div aria-hidden="true" className="gurman-cinematic__atmosphere">
          <span className="gurman-cinematic__ring gurman-cinematic__ring--one" />
          <span className="gurman-cinematic__ring gurman-cinematic__ring--two" />
          <span className="gurman-cinematic__beam" />
        </div>

        <header className="gurman-cinematic__header">
          <a href={`/${locale}/gurman`} className="gurman-cinematic__brand">
            Manzil <span>/</span> Gurman
          </a>
          <span className="gurman-cinematic__status">{copy.hero.badge}</span>
          <a className="gurman-cinematic__skip" href={`/${locale}/concierge`}>
            {copy.cta.button} <span aria-hidden="true">→</span>
          </a>
        </header>

        <div className="gurman-cinematic__progress" aria-hidden="true">
          <span className="gurman-cinematic__progress-line" />
          {storyLabels.map((label, index) => (
            <span className="gurman-cinematic__progress-label" key={`${label}-${index}`}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              {label}
            </span>
          ))}
        </div>

        <article className="gurman-cinematic__scene gurman-cinematic__scene--hero">
          <div className="gurman-cinematic__hero-copy">
            <p className="gurman-cinematic__eyebrow">{copy.hero.badge}</p>
            <h1>
              {copy.hero.titleLine1}
              <strong>{copy.hero.titleLine2}</strong>
            </h1>
            <p className="gurman-cinematic__lead">{copy.hero.subtitle}</p>
            <form action={`/${locale}/concierge`} method="get" className="gurman-cinematic__planner">
              <label htmlFor="gurman-cinematic-query">{copy.hero.inputLabel}</label>
              <div>
                <input
                  id="gurman-cinematic-query"
                  name="q"
                  type="search"
                  maxLength={500}
                  placeholder={copy.hero.inputPlaceholder}
                />
                <button type="submit">
                  {copy.hero.cta} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
            <div className="gurman-cinematic__proof">
              <span>{copy.hero.trustReviews}</span>
              <span>{copy.hero.trustPlaces}</span>
              <a href="#gurman-evidence">{copy.hero.howItWorksCta} <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="gurman-cinematic__hero-mark" aria-hidden="true">
            <span>G</span>
            <small>Gurman<br />AI</small>
          </div>
        </article>

        <article id="gurman-evidence" className="gurman-cinematic__scene gurman-cinematic__scene--evidence">
          <div className="gurman-cinematic__chapter-number">02</div>
          <div className="gurman-cinematic__chapter-copy">
            <p className="gurman-cinematic__eyebrow">{copy.trust.eyebrow}</p>
            <h2>{copy.trust.title}</h2>
            <p className="gurman-cinematic__lead">{copy.trust.body}</p>
          </div>
          <div className="gurman-cinematic__evidence-list">
            {copy.trust.cards.map((card, index) => (
              <div className="gurman-cinematic__evidence-row" key={card.title}>
                <span>0{index + 1}</span>
                <div>
                  <p>{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                </div>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="gurman-cinematic__scene gurman-cinematic__scene--intelligence">
          <div className="gurman-cinematic__chapter-number">03</div>
          <div className="gurman-cinematic__chapter-copy">
            <p className="gurman-cinematic__eyebrow">{copy.intelligence.eyebrow}</p>
            <h2>{copy.intelligence.title}</h2>
            <p className="gurman-cinematic__lead">{copy.intelligence.body}</p>
          </div>
          <div className="gurman-cinematic__pipeline" aria-label={copy.intelligence.pipeline.label}>
            <p>{copy.intelligence.pipeline.label}</p>
            <div className="gurman-cinematic__pipeline-track">
              {copy.intelligence.pipeline.steps.map((step, index) => (
                <span key={step}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  {step}
                </span>
              ))}
            </div>
          </div>
          <div className="gurman-cinematic__boundary">
            <span>01</span>
            <strong>{copy.intelligence.principles[0]?.title}</strong>
            <p>{copy.intelligence.principles[0]?.body}</p>
          </div>
        </article>

        <article className="gurman-cinematic__scene gurman-cinematic__scene--memory">
          <div className="gurman-cinematic__chapter-number">04</div>
          <div className="gurman-cinematic__chapter-copy">
            <p className="gurman-cinematic__eyebrow">{copy.memory.eyebrow}</p>
            <h2>{copy.memory.title}</h2>
            <p className="gurman-cinematic__lead">{copy.memory.body}</p>
          </div>
          <div className="gurman-cinematic__memory-layout">
            <div className="gurman-cinematic__memory-note">
              <p>{copy.memory.philosophy.label}</p>
              <h3>{copy.memory.philosophy.title}</h3>
              <span>{copy.memory.philosophy.body}</span>
              <ul>
                {copy.memory.philosophy.items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="gurman-cinematic__memory-tiers">
              <p>{copy.memory.tiersLabel}</p>
              {copy.memory.tiers.map((tier) => (
                <div key={tier.title}>
                  <span>{tier.number}</span>
                  <strong>{tier.title}</strong>
                  <small>{tier.body}</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="gurman-cinematic__scene gurman-cinematic__scene--collaboration">
          <div className="gurman-cinematic__chapter-number">05</div>
          <div className="gurman-cinematic__chapter-copy">
            <p className="gurman-cinematic__eyebrow">{copy.collaboration.eyebrow}</p>
            <h2>{copy.collaboration.title}</h2>
            <p className="gurman-cinematic__lead">{copy.collaboration.body}</p>
          </div>
          <div className="gurman-cinematic__collab-panel">
            <div>
              <p>{copy.collaboration.mediator.label}</p>
              <h3>{copy.collaboration.mediator.title}</h3>
              <p>{copy.collaboration.mediator.body}</p>
            </div>
            <ol>
              {copy.collaboration.flow.steps.map((step, index) => (
                <li key={step}><span>0{index + 1}</span>{step}</li>
              ))}
            </ol>
          </div>
        </article>

        <article className="gurman-cinematic__scene gurman-cinematic__scene--close">
          <div className="gurman-cinematic__close-layout">
            {includeVideo ? (
              <div className="gurman-cinematic__video-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
                  title="Gurman AI introduction"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : null}
            <div className="gurman-cinematic__close-copy">
              <p className="gurman-cinematic__eyebrow">{copy.cta.eyebrow}</p>
              <h2>{copy.cta.title}</h2>
              <p className="gurman-cinematic__lead">{copy.cta.body}</p>
              <a className="gurman-cinematic__close-button" href={`/${locale}/concierge`}>
                {copy.cta.button} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
