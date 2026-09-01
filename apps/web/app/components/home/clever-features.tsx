"use client";

import { useState } from "react";
import type { Locale } from "@manzil/shared";
import type { CleverFeaturesCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverFeatures({ copy, locale }: { copy: CleverFeaturesCopy; locale: Locale }) {
  const [activeTab, setActiveTab] = useState(copy.tabs[0]?.id ?? "concierge");

  const currentTab = copy.tabs.find((t) => t.id === activeTab) ?? copy.tabs[0];

  return (
    <section className="clever-section clever-features" id="features">
      <div className="container">
        {/* Section Header */}
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="trending_up" size={14} />
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

        {/* Tab Buttons */}
        <div className="clever-tabs-nav">
          {copy.tabs.map((tab) => (
            <button
              className={`clever-tab-btn ${activeTab === tab.id ? "clever-tab-btn--active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Panel */}
        {currentTab && (
          <div className="clever-feature-panel">
            <div className="clever-feature-panel__content">
              <div className="clever-feature-panel__badge">
                <Icon name="sparkles" size={14} />
                <span>{currentTab.badge}</span>
              </div>
              <h3 className="clever-feature-panel__title">{currentTab.title}</h3>
              <p className="clever-feature-panel__desc">{currentTab.description}</p>

              <ul className="clever-feature-panel__bullets">
                {currentTab.bullets.map((bullet, idx) => (
                  <li className="clever-feature-panel__bullet-item" key={idx}>
                    <span className="clever-feature-panel__bullet-icon">
                      <Icon name="verified" size={16} />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="clever-feature-panel__actions">
                <a
                  className="clever-btn clever-btn--primary clever-btn--sm"
                  href={
                    currentTab.id === "concierge"
                      ? `/${locale}/concierge`
                      : currentTab.id === "business"
                      ? `/${locale}/business`
                      : `/${locale}/discover`
                  }
                >
                  <span>{currentTab.label}</span>
                  <Icon name="arrow_forward" size={14} />
                </a>
              </div>
            </div>

            {/* Visual preview card / metric stat box */}
            <div className="clever-feature-panel__visual">
              <div className="clever-stat-card">
                <div className="clever-stat-card__metric">{currentTab.metricValue}</div>
                <div className="clever-stat-card__label">{currentTab.metricLabel}</div>
                <div className="clever-stat-card__bars">
                  <span className="clever-stat-bar clever-stat-bar--1" />
                  <span className="clever-stat-bar clever-stat-bar--2" />
                  <span className="clever-stat-bar clever-stat-bar--3" />
                  <span className="clever-stat-bar clever-stat-bar--4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
