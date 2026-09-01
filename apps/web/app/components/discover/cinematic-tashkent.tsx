"use client";

import { useEffect, useRef, useState } from "react";
import type { BusinessPlatform, Locale, Occasion } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";

const ASSETS = {
  sky: "https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png",
  backFour: "https://raft-blast-61784561.figma.site/_assets/v11/8a7f8af50e0ce92ec2e228e7b0b4112178c51cf1.png",
  bazaar: "https://raft-blast-61784561.figma.site/_assets/v11/864afe00e41e2fa20a5aa546e15cb807e0f81384.png",
  splitLeft: "https://raft-blast-61784561.figma.site/_assets/v11/7536d7b60a1fce482cf6edf3f0bffd3bad5d0f8a.png",
  splitRight: "https://raft-blast-61784561.figma.site/_assets/v11/392db6a6a6b98e868bd7f8d3f55bb719d51e5028.png",
  bridge: "https://raft-blast-61784561.figma.site/_assets/v11/c6a6d8ef49bca43f708aa852692942c45ec950d4.png",
  frameTwo: "https://raft-blast-61784561.figma.site/_assets/v11/ba75252bab2b1c510987b74837770f7bc8a6b2d4.png",
  icon1: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png",
  icon2: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png",
  icon3: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png"
};

const DEFAULT_SIGHTS = [
  {
    kicker: "Milliy Oshxona",
    name: "Rayhon Milliy Taomlar",
    desc: "Toshkentning mashhur milliy taomlari, shinam muhit va qulay xizmat.",
    pin: ASSETS.icon1,
    slug: "rayhon-milliy-taomlar"
  },
  {
    kicker: "Qahva & Nonvoyxona",
    name: "Breadly Bakery & Café",
    desc: "Yangi pishirilgan kruassanlar, sifatli espresso va sokin atmosfera.",
    pin: ASSETS.icon2,
    slug: "breadly-bakery"
  },
  {
    kicker: "Avto Xizmatlar",
    name: "Iwash Avtomoyka",
    desc: "Premium avtomobil parvarishi, professional detailing va tezkor xizmat.",
    pin: ASSETS.icon3,
    slug: "iwash-avtomoyka"
  },
  {
    kicker: "Lounge & Qahva",
    name: "Vanilla Lounge Café",
    desc: "Zamonaviy shahar manzarasi, xushbo'y desertlar va do'stona jamoa.",
    pin: ASSETS.icon1,
    slug: "vanilla-lounge"
  },
  {
    kicker: "Choyxona & Osh",
    name: "Markaziy Plov Center",
    desc: "Haqiqiy to'y oshi, sharqona mehmondo'stlik va 5 yulduzli obro'.",
    pin: ASSETS.icon2,
    slug: "plov-center"
  }
];

export function CinematicTashkent({
  locale,
  businesses,
  occasions
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  occasions: Occasion[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Map real businesses to sights
  const sightsData = businesses.length >= 5
    ? businesses.slice(0, 5).map((b, i) => ({
        kicker: b.categorySlug ? b.categorySlug.toUpperCase() : "TOSHKENT",
        name: b.name,
        desc: pickLocalized(b.description, locale) || `${b.district} tumanidagi sara maskan.`,
        pin: [ASSETS.icon1, ASSETS.icon2, ASSETS.icon3][i % 3],
        slug: b.slug
      }))
    : DEFAULT_SIGHTS;

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const controls = controlsRef.current;
    if (!section || !track || !controls) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetScroll = 0;
    let smoothScroll = 0;
    let initialized = false;
    let rafPending = false;

    // Infinite Slider Setup
    const originalCount = sightsData.length;
    let activeSight = originalCount;

    function buildClones() {
      if (!track) return;
      track.replaceChildren();
      for (let setIdx = 0; setIdx < 3; setIdx++) {
        sightsData.forEach((item, itemIdx) => {
          const card = document.createElement("a");
          card.className = "sight-card";
          card.href = `/${locale}/businesses/${item.slug}`;
          card.dataset.sightIndex = String(setIdx * originalCount + itemIdx);
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `Open ${item.name} card`);

          card.innerHTML = `
            <span class="sight-kicker">${item.kicker}</span>
            <img class="sight-pin" src="${item.pin}" alt="" />
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
          `;

          card.addEventListener("click", (e) => {
            activeSight = Number(card.dataset.sightIndex);
            updateSightSlider();
          });

          track.appendChild(card);
        });
      }
      updateSightSlider();
    }

    function updateSightSlider() {
      if (!track) return;
      const cards = track.querySelectorAll<HTMLElement>(".sight-card");
      if (!cards.length) return;
      const cardWidth = cards[0].offsetWidth;
      const gap = parseFloat(window.getComputedStyle(track).columnGap || "20");
      document.documentElement.style.setProperty("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);

      cards.forEach((c) => {
        c.classList.toggle("is-active", Number(c.dataset.sightIndex) === activeSight);
      });
    }

    function jumpSightSlider(i: number) {
      if (!track) return;
      track.classList.add("is-jumping");
      activeSight = i;
      updateSightSlider();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          track.classList.remove("is-jumping");
        });
      });
    }

    function normalizeSightSlider() {
      if (activeSight >= originalCount * 2) {
        jumpSightSlider(activeSight - originalCount);
      } else if (activeSight < originalCount) {
        jumpSightSlider(activeSight + originalCount);
      }
    }

    track.addEventListener("transitionend", normalizeSightSlider);

    // Math Helpers
    const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
    const smoothstep = (e0: number, e1: number, v: number) => {
      const x = clamp((v - e0) / (e1 - e0));
      return x * x * (3 - 2 * x);
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const segmentInOut = (s: number, a: number, b: number, c: number, d: number) => {
      const enter = smoothstep(a, b, s);
      const exit = smoothstep(c, d, s);
      return { enter, exit, active: enter * (1 - exit) };
    };

    const getScrollDist = () => {
      if (!section) return 0;
      return clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);
    };

    function update() {
      rafPending = false;
      targetScroll = getScrollDist();

      if (!initialized || reduceMotion.matches) {
        smoothScroll = targetScroll;
        initialized = true;
      } else {
        smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
      }

      if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

      mouseX = lerp(mouseX, targetMouseX, 0.12);
      mouseY = lerp(mouseY, targetMouseY, 0.12);

      const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
      const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
      const progress = clamp(smoothScroll / 2700);
      const introExit = smoothstep(90, 650, smoothScroll);
      const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
      const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
      const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
      const blurActive = clamp(frame2.active + frame3.active);
      const frame2Opacity = frame2.active * (1 - frame3.enter);
      const splitDrift = Math.pow(frame2.enter, 1.5);
      const panel2Opacity = frame2.active * (1 - frame2.exit);
      const panel3Opacity = frame3.active * (1 - frame3.exit);
      const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
      const sharedHeroY = progress * -74;
      const sharedHeroScale = progress * 0.23;
      const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
      const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

      const root = document.documentElement.style;
      root.setProperty("--mx", reduceMotion.matches ? "0" : mouseX.toFixed(4));
      root.setProperty("--my", reduceMotion.matches ? "0" : mouseY.toFixed(4));
      root.setProperty("--back-opacity", (1 - frame2.active * 0.06).toFixed(4));
      root.setProperty("--back-x", `${(mouseX * -12).toFixed(2)}px`);
      root.setProperty("--back-y", `${(mouseY * -4).toFixed(2)}px`);
      root.setProperty("--back-scale", backScale.toFixed(4));
      root.setProperty("--four-y", `${(10 + progress * 10).toFixed(2)}vh`);
      root.setProperty("--four-scale", (0.78 + progress * 0.16).toFixed(4));
      root.setProperty("--bazaar-y", `${(20 - progress * 8).toFixed(2)}vh`);
      root.setProperty("--blur-px", `${(blurActive * 14).toFixed(2)}px`);
      root.setProperty("--back-brightness", (1 - blurActive * 0.255).toFixed(4));
      root.setProperty("--bazaar-blur-px", `${(frame2.active * 14).toFixed(2)}px`);
      root.setProperty("--bazaar-brightness", (1 - frame2.active * 0.255 - frame3.active * 0.06).toFixed(4));
      root.setProperty("--bazaar-saturation", (1 + frame3.active * 0.18).toFixed(4));
      root.setProperty("--shade-opacity", "1");
      root.setProperty("--shade-z", frame2.active > 0.02 ? "2" : "0");
      root.setProperty("--shade-top-alpha", (blurActive * 0.465).toFixed(4));
      root.setProperty("--shade-mid-alpha", (blurActive * 0.42).toFixed(4));
      root.setProperty("--shade-bottom-alpha", (blurActive * 0.51).toFixed(4));

      root.setProperty("--title-y", `${(introExit * -210).toFixed(2)}px`);
      root.setProperty("--title-scale", (1 - introExit * 0.08).toFixed(4));
      root.setProperty("--title-opacity", (1 - introExit).toFixed(4));

      root.setProperty("--bridge-x", `calc(-50% + ${(mouseX * 18).toFixed(2)}px)`);
      root.setProperty("--bridge-y", `${(mouseY * 8 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`);
      root.setProperty("--bridge-bottom", `${(5 - frame2.enter * 13).toFixed(2)}vh`);
      root.setProperty("--bridge-width", `${(67.2 + frame2.enter * 37.8).toFixed(2)}vw`);
      root.setProperty("--bridge-scale", (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4));

      root.setProperty("--split-left-x", `calc(-50% + ${(-splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      root.setProperty("--split-left-y", `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      root.setProperty("--split-left-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
      root.setProperty("--split-right-x", `calc(-50% + ${(splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      root.setProperty("--split-right-y", `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      root.setProperty("--split-right-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

      root.setProperty("--frame2-opacity", frame2Opacity.toFixed(4));
      root.setProperty("--frame2-x", `calc(-50% + ${(mouseX * 10).toFixed(2)}px)`);
      root.setProperty("--frame2-y", `calc(-50% + ${(mouseY * 8 - frame2.exit * 150).toFixed(2)}px)`);
      root.setProperty("--frame2-scale", (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

      root.setProperty("--intro-copy-y", `${(introExit * 90).toFixed(2)}px`);
      root.setProperty("--intro-copy-opacity", (1 - introExit).toFixed(4));
      root.setProperty("--panel2-opacity", panel2Opacity.toFixed(4));
      root.setProperty("--panel2-y", `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`);
      root.setProperty("--panel3-opacity", panel3Opacity.toFixed(4));
      root.setProperty("--panel3-y", `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`);

      root.setProperty("--sights-opacity", sightsEnter.toFixed(4));
      root.setProperty("--sights-controls-opacity", sightsControlsEnter.toFixed(4));
      if (controls) {
        controls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
      }
      root.setProperty("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
      root.setProperty("--sights-y", "0px");
      root.setProperty("--sights-enter-x", `${((1 - sightsEnter) * 420).toFixed(2)}vw`);
      root.setProperty("--sights-scale", (1 / backScale).toFixed(4));
      root.setProperty("--sights-top", `${sightsParentTop.toFixed(2)}px`);
      root.setProperty("--sights-screen-top", `${sightsScreenTop.toFixed(2)}px`);

      if (
        Math.abs(smoothScroll - targetScroll) > 0.08 ||
        Math.abs(mouseX - targetMouseX) > 0.001 ||
        Math.abs(mouseY - targetMouseY) > 0.001
      ) {
        requestTick();
      }
    }

    function requestTick() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(update);
      }
    }

    const onScroll = () => requestTick();
    const onResize = () => {
      updateSightSlider();
      requestTick();
    };
    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = e.clientX / window.innerWidth - 0.5;
      targetMouseY = e.clientY / window.innerHeight - 0.5;
      requestTick();
    };

    buildClones();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    requestTick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [locale, sightsData]);

  const moveSlider = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>(".sight-card");
    if (!cards.length) return;
    const originalCount = sightsData.length;
    let active = Number(track.querySelector(".is-active")?.getAttribute("data-sight-index") || originalCount);
    active += dir;
    const cardWidth = cards[0].offsetWidth;
    const gap = parseFloat(window.getComputedStyle(track).columnGap || "20");
    document.documentElement.style.setProperty("--sights-shift", `${-(cardWidth + gap) * active}px`);
    cards.forEach((c) => {
      c.classList.toggle("is-active", Number(c.dataset.sightIndex) === active);
    });
  };

  return (
    <section className="cinema-scroll" id="cinema" ref={sectionRef} aria-label="Toshkent cinematic scroll story">
      <div className="stage">
        <div className="world">
          {/* Layer 0: Sky */}
          <img className="scene-img sky-img" src={ASSETS.sky} alt="" />

          {/* Layer 1: Back Stack */}
          <div className="back-stack">
            <img className="scene-img back-img back-four" src={ASSETS.backFour} alt="" />

            {/* Sights Slider (Verified Places) */}
            <section className="sights-slider" aria-label="Toshkent sara maskanlari">
              <div className="sights-track" ref={trackRef}>
                {/* Dynamically populated with 3-set clones */}
              </div>
            </section>

            <img className="scene-img back-img back-bazaar" src={ASSETS.bazaar} alt="" />
          </div>

          {/* Sights Controls */}
          <div className="sights-controls" ref={controlsRef} aria-label="Slider controls">
            <button
              className="sight-nav sight-prev"
              type="button"
              aria-label="Previous sight"
              onClick={() => moveSlider(-1)}
            >
              ←
            </button>
            <button
              className="sight-nav sight-next"
              type="button"
              aria-label="Next sight"
              onClick={() => moveSlider(1)}
            >
              →
            </button>
          </div>

          {/* Hero Title */}
          <h1 className="hero-title">TOSHKENT</h1>

          {/* Splitframe Architecture Depth Layers */}
          <img className="scene-img splitframe-img splitframe-left" src={ASSETS.splitLeft} alt="" />
          <img className="scene-img splitframe-img splitframe-right" src={ASSETS.splitRight} alt="" />
          <img className="scene-img bridge-img" src={ASSETS.bridge} alt="" />
          <img className="scene-img frame-two-img" src={ASSETS.frameTwo} alt="" />

          {/* Ambient Lighting Shade */}
          <div className="shade" />
        </div>

        {/* Intro Copy (0–650px) */}
        <section className="intro-copy" aria-label="Toshkent overview">
          <p>
            Qadimiy an&apos;analar, zamonaviy shahar ritmi va minglab sara maskanlar bitta qulay platformada.
          </p>
          <div className="hero-tags" aria-label="Toshkent tumanlari">
            <span>Chilonzor</span>
            <span>Mirobod</span>
            <span>Yunusobod</span>
            <span>Yakkasaroy</span>
            <span>Shayxontohur</span>
          </div>
        </section>

        {/* Story Panel 1: Tadbirlar & Marosimlar (560–1620px) */}
        <section className="story-panel story-panel-bridge" aria-label="Tadbirlar & Marosimlar">
          <h2>Toshkentning eng sara tadbirlari.</h2>
          <p>
            To&apos;y va marosimlar, jonli konsertlar, madaniy festivallar va oilaviy bayramlar uchun eng mos maskanlar.
          </p>
          <dl className="facts">
            <div>
              <dt>1,450+</dt>
              <dd>Tasdiqlangan maskanlar</dd>
            </div>
            <div>
              <dt>100%</dt>
              <dd>Haqiqiy mehmonlar sharhlari</dd>
            </div>
          </dl>
        </section>

        {/* Story Panel 2: Gastronomiya & Madaniyat (1760–2700px) */}
        <section className="story-panel story-panel-bazaar" aria-label="Shahar madaniyati">
          <h2>Sharqona lazzat va zamonaviy qulaylik.</h2>
          <p>
            An&apos;anaviy choyxonalar, shinam qahvaxonalar va sifatli avto xizmatlar — barchasi yoningizda.
          </p>
          <a className="note-button" href="#catalog">
            <span aria-hidden="true">↓</span>
            <span>Barcha katalogga o&apos;tish</span>
          </a>
        </section>
      </div>
    </section>
  );
}
