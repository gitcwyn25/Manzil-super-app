"use client";

import { useState } from "react";
import type { CleverWaitlistCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverWaitlistCard({ copy }: { copy: CleverWaitlistCopy }) {
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("Samarqand");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="clever-section clever-waitlist" id="waitlist">
      <div className="container">
        <div className="clever-waitlist-card">
          <div className="clever-waitlist-card__glow" />

          <Reveal as="div" variant="fade-up">
            <span className="clever-badge clever-badge--glow">
              <Icon name="globe" size={14} />
              <span>{copy.badge}</span>
            </span>
          </Reveal>

          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="clever-waitlist-card__title">{copy.title}</h2>
          </Reveal>

          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-waitlist-card__subtitle">{copy.subtitle}</p>
          </Reveal>

          {submitted ? (
            <div className="clever-waitlist-card__success">
              <div className="clever-waitlist-card__success-icon">
                <Icon name="verified" size={32} />
              </div>
              <h3 className="clever-waitlist-card__success-title">{copy.successTitle}</h3>
              <p className="clever-waitlist-card__success-body">{copy.successBody}</p>
            </div>
          ) : (
            <form className="clever-waitlist-card__form" onSubmit={handleSubmit}>
              <div className="clever-waitlist-card__inputs">
                <select
                  aria-label="City"
                  className="clever-waitlist-card__select"
                  onChange={(e) => setCity(e.target.value)}
                  value={city}
                >
                  <option value="Samarqand">Samarqand</option>
                  <option value="Buxoro">Buxoro</option>
                  <option value="Namangan">Namangan</option>
                  <option value="Andijon">Andijon</option>
                  <option value="Farg'ona">Farg&apos;ona</option>
                  <option value="Xiva / Urganch">Xiva / Urganch</option>
                  <option value="Qarshi">Qarshi</option>
                  <option value="Nukus">Nukus</option>
                </select>

                <input
                  className="clever-waitlist-card__input"
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={copy.placeholder}
                  required
                  type="text"
                  value={contact}
                />

                <button className="clever-btn clever-btn--primary" type="submit">
                  <span>{copy.cta}</span>
                  <Icon name="arrow_forward" size={16} />
                </button>
              </div>
              <p className="clever-waitlist-card__note">{copy.note}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
