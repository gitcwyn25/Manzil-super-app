"use client";

import type { Locale } from "@manzil/shared";
import { motion } from "framer-motion";
import { Icon } from "./vm/icons";

/**
 * One drifting shape in the hero backdrop.
 *
 * Ported from the geometric-hero technique and re-tuned for the Vibrant
 * Marketplace palette: electric blue and mint at low opacity, so the backdrop
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
    transition: { duration: 0.9, delay: 0.2 + index * 0.14, ease: [0.25, 0.4, 0.25, 1] as const }
  })
};

export type GurmanHeroCopy = {
  badge: string;
  titleLine1: string;
  /** The accent phrase — rendered in primary blue with the squiggle underline. */
  titleLine2: string;
  subtitle: string;
  inputLabel: string;
  inputPlaceholder: string;
  cta: string;
  /** Where the planner form submits (the concierge route). */
  ctaHref: string;
  trustReviews: string;
  trustPlaces: string;
  waitlistCta: string;
  bento: {
    brandTitle: string;
    brandHint: string;
    askTitle: string;
    askHint: string;
    reviewsTitle: string;
    reviewsHint: string;
    placesTitle: string;
    placesHint: string;
  };
};

/**
 * The Discover planner hero (Vibrant Marketplace).
 *
 * Copy stance per D8: aspirational energy, honest claims — Gurman AI
 * recommends real places from real reviews; it does not promise bookings or
 * generated itineraries. The planner input is a plain GET form into
 * /{locale}/concierge, so it works with no JS at all.
 *
 * The right-hand bento is decorative and lg-only: instead of the mock's
 * fabricated itinerary (venues, times, "AI Matched 98%"), it tells the honest
 * three-step story — you ask, Gurman reads real reviews, you get real places.
 *
 * e2e welds: .gurman-hero, .gurman-hero__badge (contains "Gurman AI"),
 * .gurman-hero__cta — all kept on the new DOM. Motion is decorative only;
 * every element carries data-reveal so the noscript rule in the root layout
 * forces it visible when JS is off.
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
          tint="linear-gradient(90deg, rgba(0,88,188,0.10), transparent)"
          width={600}
        />
        <DriftShape
          className="gurman-shape--two"
          delay={0.5}
          height={120}
          rotate={-15}
          tint="linear-gradient(90deg, rgba(108,248,187,0.22), transparent)"
          width={500}
        />
        <DriftShape
          className="gurman-shape--three"
          delay={0.4}
          height={80}
          rotate={-8}
          tint="linear-gradient(90deg, rgba(0,112,235,0.08), transparent)"
          width={300}
        />
        <DriftShape
          className="gurman-shape--four"
          delay={0.6}
          height={60}
          rotate={20}
          tint="linear-gradient(90deg, rgba(108,248,187,0.16), transparent)"
          width={200}
        />
      </div>

      <div className="gurman-hero__inner">
        <div className="gurman-hero__copy">
          <motion.span
            animate="visible"
            className="gurman-hero__badge"
            custom={0}
            data-reveal=""
            initial="hidden"
            variants={fadeUp}
          >
            <Icon name="sparkles" size={14} />
            {copy.badge}
          </motion.span>

          <motion.h1
            animate="visible"
            className="gurman-hero__title"
            custom={1}
            data-reveal=""
            initial="hidden"
            variants={fadeUp}
          >
            <span>{copy.titleLine1}</span>
            <span className="gurman-hero__title-accent">
              {copy.titleLine2}
              <svg
                aria-hidden="true"
                className="gurman-hero__squiggle"
                preserveAspectRatio="none"
                viewBox="0 0 100 10"
              >
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            animate="visible"
            className="gurman-hero__sub"
            custom={2}
            data-reveal=""
            initial="hidden"
            variants={fadeUp}
          >
            {copy.subtitle}
          </motion.p>

          <motion.form
            action={copy.ctaHref}
            animate="visible"
            className="gurman-hero__planner"
            custom={3}
            data-reveal=""
            initial="hidden"
            method="get"
            variants={fadeUp}
          >
            <span className="gurman-hero__planner-well">
              <Icon className="gurman-hero__planner-icon" name="robot" size={20} />
              <input
                aria-label={copy.inputLabel}
                className="gurman-hero__planner-input"
                name="q"
                placeholder={copy.inputPlaceholder}
                type="search"
              />
            </span>
            <button className="btn btn-primary vm-cta gurman-hero__cta" type="submit">
              {copy.cta}
              <Icon name="arrow_forward" size={18} />
            </button>
          </motion.form>

          <motion.div
            animate="visible"
            className="gurman-hero__trust"
            custom={4}
            data-reveal=""
            initial="hidden"
            variants={fadeUp}
          >
            <span className="gurman-hero__trust-item">
              <Icon name="check_circle" size={16} />
              {copy.trustReviews}
            </span>
            <span className="gurman-hero__trust-item">
              <Icon name="check_circle" size={16} />
              {copy.trustPlaces}
            </span>
            <a className="gurman-hero__secondary" href={`/${locale}/waitlist/gurman`}>
              {copy.waitlistCta}
            </a>
          </motion.div>
        </div>

        <motion.div
          animate="visible"
          className="gurman-hero__bento"
          custom={2}
          data-reveal=""
          initial="hidden"
          variants={fadeUp}
        >
          <div className="gurman-bento__tile gurman-bento__tile--brand">
            <Icon className="gurman-bento__glyph" name="sparkles" size={96} />
            <span className="gurman-bento__title">{copy.bento.brandTitle}</span>
            <span className="gurman-bento__hint">{copy.bento.brandHint}</span>
          </div>
          <div className="gurman-bento__tile gurman-bento__tile--ask">
            <Icon name="send" size={28} />
            <span className="gurman-bento__title">{copy.bento.askTitle}</span>
            <span className="gurman-bento__hint">{copy.bento.askHint}</span>
          </div>
          <div className="gurman-bento__tile gurman-bento__tile--reviews">
            <Icon className="gurman-bento__glyph" name="star_filled" size={84} />
            <span className="gurman-bento__title">{copy.bento.reviewsTitle}</span>
            <span className="gurman-bento__hint">{copy.bento.reviewsHint}</span>
          </div>
          <div className="gurman-bento__tile gurman-bento__tile--places">
            <Icon name="storefront" size={28} />
            <span className="gurman-bento__title">{copy.bento.placesTitle}</span>
            <span className="gurman-bento__hint">{copy.bento.placesHint}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
