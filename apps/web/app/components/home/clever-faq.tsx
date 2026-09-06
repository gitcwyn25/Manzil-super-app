"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CleverFaqCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";

export function CleverFaq({ copy }: { copy: CleverFaqCopy }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      aria-labelledby="manzil-faq-title"
      className="clever-section clever-faq"
      id="faq"
    >
      <div className="container clever-faq__container">
        <div className="clever-faq__grid">
          <Reveal as="div" className="clever-faq__intro" variant="fade-up">
            <h2 className="clever-faq__title" id="manzil-faq-title">
              {copy.title}
            </h2>
            <p className="clever-faq__subtitle">{copy.subtitle}</p>
            <a
              className="clever-faq__contact"
              href="mailto:tursunovsunnatilla223@gmail.com"
            >
              {copy.contactCta}
            </a>
            <div aria-hidden="true" className="clever-faq__companion">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                src="/media/gurman/faq-reading-transparent.webm"
              />
            </div>
          </Reveal>

          <div
            aria-label={copy.badge}
            className="clever-faq__thread"
            role="list"
          >
            {copy.items.map((item, idx) => {
              const isOpen = openIdx === idx;
              const questionId = `manzil-faq-question-${idx}`;
              const answerId = `manzil-faq-answer-${idx}`;

              return (
                <motion.div
                  aria-label={item.question}
                  className="clever-faq__message"
                  role="listitem"
                  initial={{ opacity: 0, y: 18 }}
                  key={questionId}
                  layout
                  transition={{
                    delay: idx * 0.06,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    aria-controls={answerId}
                    aria-expanded={isOpen}
                    className="clever-faq__question"
                    id={questionId}
                    layout="position"
                    onClick={() => toggle(idx)}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                  >
                    {item.question}
                  </motion.button>

                  <AnimatePresence initial={false} mode="sync">
                    {isOpen && (
                      <motion.div
                        aria-labelledby={questionId}
                        className="clever-faq__answer"
                        id={answerId}
                        initial={{ height: 0, opacity: 0, y: -8 }}
                        role="region"
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p>{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
