"use client";

import { useState } from "react";
import type { CleverFaqCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverFaq({ copy }: { copy: CleverFaqCopy }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="clever-section clever-faq" id="faq">
      <div className="container clever-faq__container">
        {/* Section Header */}
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="help_circle" size={14} />
              <span>{copy.badge}</span>
            </span>
          </Reveal>
          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="clever-heading">{copy.title}</h2>
          </Reveal>
          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-subheading">{copy.subtitle}</p>
          </Reveal>
        </div>

        {/* Accordion List */}
        <div className="clever-faq__list">
          {copy.items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal as="div" delay={idx * 60} key={idx} variant="fade-up">
                <div
                  className={`clever-faq-item ${isOpen ? "clever-faq-item--open" : ""}`}
                >
                  <button
                    aria-expanded={isOpen}
                    className="clever-faq-item__question"
                    onClick={() => toggle(idx)}
                    type="button"
                  >
                    <span>{item.question}</span>
                    <span className="clever-faq-item__toggle">
                      <Icon name={isOpen ? "chevron_down" : "chevron_right"} size={16} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="clever-faq-item__answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
