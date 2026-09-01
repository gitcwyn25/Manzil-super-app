"use client";

import { useEffect, useRef, useState } from "react";
import type { BusinessPlatform, Locale, Occasion } from "@manzil/shared";

interface SightData {
  ariaLabel: string;
  kicker: string;
  title: string;
  desc: string;
  pin: string;
}

const SIGHTS: SightData[] = [
  {
    ariaLabel: "Chorsu bozori kartasi",
    kicker: "Toshkent Shahri",
    title: "Chorsu Bozori",
    desc: "Qadimiy moviy gumbaz ostidagi asriy bozor, sharqona ziravorlar va milliy lazzatlar markazi.",
    pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png"
  },
  {
    ariaLabel: "Hazrati Imom majmuasi kartasi",
    kicker: "Tarixiy Meros",
    title: "Hazrati Imom",
    desc: "Hazrati Usmon Qur'oni saqlanadigan ma'naviy maskan va qadimiy me'morchilik durdonasi.",
    pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png"
  },
  {
    ariaLabel: "Temuriylar muzeyi kartasi",
    kicker: "Madaniyat & San'at",
    title: "Temuriylar Muzeyi",
    desc: "Moviy gumbaz va Amir Temur saltanatining bebaho eksponatlari joylashgan go'sha.",
    pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png"
  },
  {
    ariaLabel: "Tashkent City kartasi",
    kicker: "Zamonaviy Ritm",
    title: "Tashkent City",
    desc: "Yevropacha fasadlar, zamonaviy favvoralar, shinam qahvaxonalar va sokin sayrgohlar.",
    pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png"
  },
  {
    ariaLabel: "Toshkent Metropoliteni kartasi",
    kicker: "Yerosti Saroyi",
    title: "Toshkent Metrosi",
    desc: "Sharqning birinchi va eng go'zal marmar ustunli san'at asari darajasidagi stansiyalari.",
    pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png"
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
  const cinemaRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  // Math helpers
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

  useEffect(() => {
    const section = cinemaRef.current;
    const track = trackRef.current;
    const controls = controlsRef.current;
    if (!section || !track) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetScroll = 0;
    let smoothScroll = 0;
    let initialized = false;
    let rafPending = false;

    // Infinite Slider Setup (3 identical sets = 15 cards)
    const originalCount = SIGHTS.length;
    let activeSight = originalCount; // start in middle set

    function renderCards() {
      if (!track) return;
      track.replaceChildren();
      for (let setIdx = 0; setIdx < 3; setIdx++) {
        SIGHTS.forEach((sight, idx) => {
          const card = document.createElement("article");
          card.className = "sight-card";
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", sight.ariaLabel);
          card.dataset.sightIndex = String(setIdx * originalCount + idx);

          const kicker = document.createElement("span");
          kicker.className = "sight-kicker";
          kicker.textContent = sight.kicker;

          const pin = document.createElement("img");
          pin.className = "sight-pin";
          pin.src = sight.pin;
          pin.alt = "";

          const h3 = document.createElement("h3");
          h3.textContent = sight.title;

          const p = document.createElement("p");
          p.textContent = sight.desc;

          card.appendChild(kicker);
          card.appendChild(pin);
          card.appendChild(h3);
          card.appendChild(p);

          card.addEventListener("click", () => {
            activeSight = Number(card.dataset.sightIndex);
            updateSightSlider();
          });

          track.appendChild(card);
        });
      }
    }

    renderCards();

    function updateSightSlider() {
      if (!track) return;
      const cards = track.querySelectorAll<HTMLElement>(".sight-card");
      if (!cards.length) return;
      const cardWidth = cards[0].offsetWidth;
      const gap = parseFloat(window.getComputedStyle(track).columnGap || "16") || 16;
      const shift = -(cardWidth + gap) * activeSight;
      root.style.setProperty("--sights-shift", `${shift}px`);

      cards.forEach((c) => {
        if (Number(c.dataset.sightIndex) === activeSight) {
          c.classList.add("is-active");
        } else {
          c.classList.remove("is-active");
        }
      });
    }

    function jumpSightSlider(targetIndex: number) {
      if (!track) return;
      track.classList.add("is-jumping");
      activeSight = targetIndex;
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

    function moveSlider(dir: number) {
      activeSight += dir;
      updateSightSlider();
    }

    const prevBtn = controls?.querySelector<HTMLButtonElement>(".sight-prev");
    const nextBtn = controls?.querySelector<HTMLButtonElement>(".sight-next");
    prevBtn?.addEventListener("click", () => moveSlider(-1));
    nextBtn?.addEventListener("click", () => moveSlider(1));

    function getScrollDistance() {
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const maxDist = section.offsetHeight - window.innerHeight;
      return clamp(-rect.top, 0, Math.max(0, maxDist));
    }

    function update() {
      rafPending = false;
      targetScroll = getScrollDistance();

      if (!initialized || reduceMotion.matches) {
        smoothScroll = targetScroll;
        initialized = true;
      } else {
        smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
      }
      if (Math.abs(smoothScroll - targetScroll) < 0.08) {
        smoothScroll = targetScroll;
      }

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

      // Variable writes (verbatim formulas)
      root.style.setProperty("--mx", (reduceMotion.matches ? 0 : mouseX).toFixed(4));
      root.style.setProperty("--my", (reduceMotion.matches ? 0 : mouseY).toFixed(4));

      root.style.setProperty("--back-opacity", String(1 - frame2.active * 0.06));
      root.style.setProperty("--back-x", `${(mouseX * -12).toFixed(2)}px`);
      root.style.setProperty("--back-y", `${(mouseY * -4).toFixed(2)}px`);
      root.style.setProperty("--back-scale", backScale.toFixed(4));
      root.style.setProperty("--four-y", `${(10 + progress * 10).toFixed(2)}vh`);
      root.style.setProperty("--four-scale", (0.78 + progress * 0.16).toFixed(4));
      root.style.setProperty("--bazaar-y", `${(20 - progress * 8).toFixed(2)}vh`);
      root.style.setProperty("--blur-px", `${(blurActive * 14).toFixed(2)}px`);
      root.style.setProperty("--back-brightness", (1 - blurActive * 0.255).toFixed(4));
      root.style.setProperty("--bazaar-blur-px", `${(frame2.active * 14).toFixed(2)}px`);
      root.style.setProperty("--bazaar-brightness", (1 - frame2.active * 0.255 - frame3.active * 0.06).toFixed(4));
      root.style.setProperty("--bazaar-saturation", (1 + frame3.active * 0.18).toFixed(4));
      root.style.setProperty("--shade-opacity", "1");
      root.style.setProperty("--shade-z", frame2.active > 0.02 ? "2" : "0");
      root.style.setProperty("--shade-top-alpha", (blurActive * 0.465).toFixed(4));
      root.style.setProperty("--shade-mid-alpha", (blurActive * 0.42).toFixed(4));
      root.style.setProperty("--shade-bottom-alpha", (blurActive * 0.51).toFixed(4));

      root.style.setProperty("--title-y", `${(introExit * -210).toFixed(2)}px`);
      root.style.setProperty("--title-scale", (1 - introExit * 0.08).toFixed(4));
      root.style.setProperty("--title-opacity", (1 - introExit).toFixed(4));

      root.style.setProperty("--bridge-x", `calc(-50% + ${(mouseX * 18).toFixed(2)}px)`);
      root.style.setProperty("--bridge-y", `${(mouseY * 8 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`);
      root.style.setProperty("--bridge-bottom", `${(5 - frame2.enter * 13).toFixed(2)}vh`);
      root.style.setProperty("--bridge-width", `${(67.2 + frame2.enter * 37.8).toFixed(2)}vw`);
      root.style.setProperty("--bridge-scale", (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4));

      root.style.setProperty("--split-left-x", `calc(-50% + ${(-splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      root.style.setProperty("--split-left-y", `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      root.style.setProperty("--split-left-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
      root.style.setProperty("--split-right-x", `calc(-50% + ${(splitDrift * 46).toFixed(2)}vw + ${(mouseX * 22).toFixed(2)}px)`);
      root.style.setProperty("--split-right-y", `${(mouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
      root.style.setProperty("--split-right-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

      root.style.setProperty("--frame2-opacity", frame2Opacity.toFixed(4));
      root.style.setProperty("--frame2-x", `calc(-50% + ${(mouseX * 10).toFixed(2)}px)`);
      root.style.setProperty("--frame2-y", `calc(-50% + ${(mouseY * 8 - frame2.exit * 150).toFixed(2)}px)`);
      root.style.setProperty("--frame2-scale", (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

      root.style.setProperty("--intro-copy-y", `${(introExit * 90).toFixed(2)}px`);
      root.style.setProperty("--intro-copy-opacity", (1 - introExit).toFixed(4));
      root.style.setProperty("--panel2-opacity", panel2Opacity.toFixed(4));
      root.style.setProperty("--panel2-y", `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`);
      root.style.setProperty("--panel3-opacity", panel3Opacity.toFixed(4));
      root.style.setProperty("--panel3-y", `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`);

      root.style.setProperty("--sights-opacity", sightsEnter.toFixed(4));
      root.style.setProperty("--sights-controls-opacity", sightsControlsEnter.toFixed(4));
      if (controls) {
        controls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
      }
      root.style.setProperty("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
      root.style.setProperty("--sights-y", "0px");
      root.style.setProperty("--sights-enter-x", `${((1 - sightsEnter) * 420).toFixed(2)}vw`);
      root.style.setProperty("--sights-scale", (1 / backScale).toFixed(4));
      root.style.setProperty("--sights-top", `${sightsParentTop.toFixed(2)}px`);
      root.style.setProperty("--sights-screen-top", `${sightsScreenTop.toFixed(2)}px`);

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
    const onPointerMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth - 0.5;
      targetMouseY = e.clientY / window.innerHeight - 0.5;
      requestTick();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    updateSightSlider();
    requestTick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("transitionend", normalizeSightSlider);
    };
  }, []);

  return (
    <section className="cinema-scroll" id="cinema" ref={cinemaRef} aria-label="Toshkent cinematic scroll story">
      <div className="stage">
        <div className="world">
          {/* 1. Sky / Farthest Background */}
          <img alt="" className="scene-img sky-img" src="/discover/sky-chorsu.jpg" />

          {/* 2. Site Header */}
          <header className="site-header" aria-label="Primary navigation">
            <a className="site-logo" href="#cinema">Toshkent · O&apos;zbekiston</a>
            <nav className="site-nav" aria-label="Main menu">
              <a href="#cinema">Kirish</a>
              <a href="#heritage">Meros</a>
              <a href="#lifestyle">Bozor</a>
              <a href="#catalog">Katalog</a>
            </nav>
            <button className="language-switcher" aria-label="Change language" type="button">
              <span>{locale.toUpperCase()}</span>
              <span aria-hidden="true">⌄</span>
            </button>
          </header>

          {/* 3. Back Stack with Sights Slider */}
          <div className="back-stack">
            <img alt="" className="scene-img back-img back-four" src="/discover/temur-museum.png" />
            <section className="sights-slider" aria-label="Toshkent sights slider">
              <div className="sights-track" ref={trackRef} />
            </section>
            <img alt="" className="scene-img back-img back-bazaar" src="/discover/tashkent-madrasah.png" />
          </div>

          {/* 4. Sights Controls */}
          <div className="sights-controls" aria-label="Slider controls" ref={controlsRef}>
            <button className="sight-nav sight-prev" aria-label="Previous sight" type="button">←</button>
            <button className="sight-nav sight-next" aria-label="Next sight" type="button">→</button>
          </div>

          {/* 5. Hero Title */}
          <h1 className="hero-title">TOSHKENT</h1>

          {/* 6. Splitframe Layers */}
          <img alt="" className="scene-img splitframe-img splitframe-left" src="/discover/tashkent-avenue.png" />
          <img alt="" className="scene-img splitframe-img splitframe-right" src="/discover/tashkent-avenue.png" />

          {/* 7. Foreground Bridge / Landmark Layer */}
          <img alt="" className="scene-img bridge-img" src="/discover/temur-museum.png" />

          {/* 8. Frame-Two Metro Close-up */}
          <img alt="" className="scene-img frame-two-img" src="/discover/tashkent-metro.png" />

          {/* 9. Shade Overlay */}
          <div className="shade" />
        </div>

        {/* 10. Intro Copy */}
        <section className="intro-copy" aria-label="Toshkent overview">
          <p>
            Asriy moviy gumbazlar, sharqona mehmondo&apos;stlik va zamonaviy shahar ritmi uyg&apos;unlashgan betakror poytaxt.
          </p>
          <div className="hero-tags" aria-label="Toshkent highlights">
            <span>Chorsu Bozori</span>
            <span>Hazrati Imom</span>
            <span>Tashkent City</span>
          </div>
        </section>

        {/* 11. Story Panel — Heritage */}
        <section className="story-panel story-panel-bridge" id="heritage" aria-label="Toshkent heritage details">
          <h2>Asriy meros va sharqona ruh.</h2>
          <p>
            Kukeldash madrasasi va qadimiy Chorsu maydoni asrlar davomida Ipak yo&apos;lining eng gavjum chorrahasi bo&apos;lib kelgan.
          </p>
          <dl className="facts">
            <div>
              <dt>2200+</dt>
              <dd>Yillik boy shahar tarixi</dd>
            </div>
            <div>
              <dt>1,450+</dt>
              <dd>Sara maskan va xizmatlar</dd>
            </div>
          </dl>
        </section>

        {/* 12. Story Panel — Lifestyle & Bazaar */}
        <section className="story-panel story-panel-bazaar" id="lifestyle" aria-label="Toshkent lifestyle details">
          <h2>Shahar hayoti har qadamda.</h2>
          <p>
            Sokin choyxonalar, zamonaviy qahvaxonalar, mazali to&apos;y oshi va mehmondo&apos;st insonlar sizni kutmoqda.
          </p>
          <a className="note-button" href="#catalog">
            <span aria-hidden="true">↗</span>
            <span>Barcha maskanlarni ko&apos;rish</span>
          </a>
        </section>
      </div>
    </section>
  );
}
