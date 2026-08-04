"use client";

import type { Locale } from "@manzil/shared";
import { motion } from "framer-motion";

/**
 * One drifting shape in the hero backdrop.
 *
 * Ported from the geometric-hero technique but re-tuned for Manzil: the source
 * used indigo/rose/violet on near-black, which fights the "Modern Heritage"
 * palette. These use the existing teal and gold at low opacity so the backdrop
 * reads as depth rather than as a second brand.
 */
function DriftShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  tint
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  tint: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, rotate }}
      className={`gurman-shape ${className ?? ""}`}
      initial={{ opacity: 0, y: -120, rotate: rotate - 12 }}
      transition={{
        duration: 2.2,
        delay,
        // Exponential-style ease: decelerates smoothly like a real object,
        // rather than the bounce/elastic curves the design system rejects.
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.1 }
      }}
    >
      <motion.div
        animate={{ y: [0, 14, 0] }}
        style={{ width, height, background: tint }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="gurman-shape__body"
      />
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.4 + index * 0.16, ease: [0.25, 0.4, 0.25, 1] as const }
  })
};

export type GurmanHeroCopy = {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  waitlistCta: string;
};

/**
 * Hero for the Gurman AI assistant.
 *
 * Motion is decorative only — the headline, subtitle and CTA are all present in
 * the DOM regardless of animation state, so the section is complete for
 * crawlers and for anyone with reduced-motion enabled (see the media query in
 * globals.css, which flattens these transitions).
 */
export function GurmanHero({ copy, locale }: { copy: GurmanHeroCopy; locale: Locale }) {
  return (
    <section className="gurman-hero">
      <div className="gurman-hero__wash" />

      <div aria-hidden="true" className="gurman-hero__shapes">
        <DriftShape
          className="gurman-shape--one"
          delay={0.3}
          height={140}
          rotate={12}
          tint="linear-gradient(90deg, rgba(15,91,61,0.18), transparent)"
          width={600}
        />
        <DriftShape
          className="gurman-shape--two"
          delay={0.5}
          height={120}
          rotate={-15}
          tint="linear-gradient(90deg, rgba(197,160,89,0.18), transparent)"
          width={500}
        />
        <DriftShape
          className="gurman-shape--three"
          delay={0.4}
          height={80}
          rotate={-8}
          tint="linear-gradient(90deg, rgba(15,91,61,0.14), transparent)"
          width={300}
        />
        <DriftShape
          className="gurman-shape--four"
          delay={0.6}
          height={60}
          rotate={20}
          tint="linear-gradient(90deg, rgba(197,160,89,0.14), transparent)"
          width={200}
        />
      </div>

      <div className="gurman-hero__inner">
        <div className="gurman-hero__copy">
          <motion.span
            animate="visible"
            className="gurman-hero__badge"
            custom={0}
            initial="hidden"
            variants={fadeUp}
          >
            <span className="gurman-hero__dot" />
            {copy.badge}
          </motion.span>

          <motion.h2
            animate="visible"
            className="gurman-hero__title"
            custom={1}
            initial="hidden"
            variants={fadeUp}
          >
            <span>{copy.titleLine1}</span>
            <span className="gurman-hero__title-accent">{copy.titleLine2}</span>
          </motion.h2>

          <motion.p
            animate="visible"
            className="gurman-hero__sub"
            custom={2}
            initial="hidden"
            variants={fadeUp}
          >
            {copy.subtitle}
          </motion.p>

          <motion.a
            animate="visible"
            className="gurman-hero__cta"
            custom={3}
            href={copy.ctaHref}
            initial="hidden"
            variants={fadeUp}
          >
            {copy.cta}
          </motion.a>

          <a className="gurman-hero__secondary" href={`/${locale}/waitlist/gurman`}>
            {copy.waitlistCta}
          </a>
        </div>

      </div>
    </section>
  );
}
