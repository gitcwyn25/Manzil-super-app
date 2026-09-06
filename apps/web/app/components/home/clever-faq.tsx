"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CleverFaqCopy } from "../../lib/landing-copy";
import { CompanionLoop } from "../media/companion-loop";
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
              <CompanionLoop
                className="companion-loop"
                src="/media/gurman/faq-reading-transparent-alpha.webp"
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
                  layout="position"
                  transition={{
                    delay: idx * 0.06,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                    layout: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    aria-controls={answerId}
                    aria-expanded={isOpen}
                    className="clever-faq__question"
                    id={questionId}
                    onClick={() => toggle(idx)}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                  >
                    {item.question}
                  </motion.button>

                  <AnimatePresence initial={false} mode="wait">
                    {isOpen && (
                      <motion.div
                        aria-labelledby={questionId}
                        className="clever-faq__answer-shell"
                        id={answerId}
                        initial={{ height: 0, marginTop: 0, opacity: 0, paddingBottom: 0 }}
                        role="region"
                        animate={{
                          height: "auto",
                          marginTop: "0.7rem",
                          opacity: 1,
                          paddingBottom: "0.45rem"
                        }}
                        exit={{ height: 0, marginTop: 0, opacity: 0, paddingBottom: 0 }}
                        transition={{
                          height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                          marginTop: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.28, ease: "easeOut" },
                          paddingBottom: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                        }}
                      >
                        <div className="clever-faq__answer">
                          <p>{item.answer}</p>
                        </div>
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
