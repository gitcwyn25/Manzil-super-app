"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const PROMPT_SUGGESTIONS = [
  "Shanba oqshomi uchun 4 kishiga tinch kafe",
  "Mirobodda oilaviy tushlik uchun milliy restoran",
  "Romantik date night uchun shinam maskan",
  "Yunusobodda premium avtomoyka va detayling"
];

export default function Hero06Content() {
  const shouldReduceMotion = useReducedMotion();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      window.location.href = `/uz/concierge?q=${encodeURIComponent(prompt)}`;
    }
  };

  return (
    <section className="originkit-hero-06">
      <div className="originkit-hero-06__backdrop" />
      <div className="originkit-hero-06__grid-overlay" />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="originkit-hero-06__container"
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Badge */}
        <div className="originkit-hero-06__badge">
          <span className="originkit-hero-06__badge-dot" />
          <span>Gurman AI · Tashkent Local Intelligence</span>
        </div>

        {/* Title */}
        <h1 className="originkit-hero-06__title">
          Qayerga borishni rejalashtiryapsiz?{" "}
          <span className="originkit-hero-06__title-gradient">
            Gurman AI topadi.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="originkit-hero-06__desc">
          Istagingizni tabiiy tilda yozing — Gurman AI Manzil katalogidagi tasdiqlangan
          restoranlar, kafelar va xizmatlarni siz uchun saralaydi.
        </p>

        {/* Prompt Composer */}
        <form className="originkit-hero-06__composer" onSubmit={handleSubmit}>
          <textarea
            aria-label="So'rovingiz"
            className="originkit-hero-06__textarea"
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Masalan: shanba oqshomi uchun 4 kishiga tinch kafe kerak, 300 000 so'mgacha..."
            rows={3}
            value={prompt}
          />

          <div className="originkit-hero-06__composer-bottom">
            <div className="originkit-hero-06__chips">
              {PROMPT_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  className="originkit-hero-06__chip"
                  onClick={() => setPrompt(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>

            <button className="originkit-hero-06__submit" type="submit">
              <span>Tavsiya olish</span>
              <span>→</span>
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
