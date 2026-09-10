"use client";

import type { Locale } from "@manzil/shared";
import { ArrowRight, ChevronDown, Compass } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export interface ShiftingDropDownCategory {
  id: string;
  slug: string;
  label: Record<Locale, string>;
  icon: ReactNode;
  color: string;
  description?: Record<Locale, string>;
}

export interface ShiftingDropDownGroup {
  id: string;
  label: Record<Locale, string>;
  description?: Record<Locale, string>;
  icon: ReactNode;
  accent: string;
  categories: ShiftingDropDownCategory[];
}

interface ShiftingDropDownProps {
  locale: Locale;
  groups: ShiftingDropDownGroup[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

type Direction = "l" | "r" | null;

const ALL_LABEL: Record<Locale, string> = {
  uz: "Barchasi",
  ru: "Все категории",
  en: "All categories"
};

const VIEW_ALL_LABEL: Record<Locale, string> = {
  uz: "Barcha maskanlarni ko'rish",
  ru: "Посмотреть все места",
  en: "View all places"
};

function localize(copy: Record<Locale, string>, locale: Locale) {
  return copy[locale] ?? copy.en;
}

export function ShiftingDropDown({
  locale,
  groups,
  selectedCategory,
  onSelectCategory
}: ShiftingDropDownProps) {
  const instanceId = useId().replace(/:/g, "");

  return (
    <div className="category-menu-shell">
      <Tabs
        instanceId={instanceId}
        groups={groups}
        locale={locale}
        onSelectCategory={onSelectCategory}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

function Tabs({
  instanceId,
  groups,
  locale,
  onSelectCategory,
  selectedCategory
}: ShiftingDropDownProps & { instanceId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>(null);

  const handleSetSelected = (value: string | null) => {
    if (selected && value) {
      const previousIndex = groups.findIndex((group) => group.id === selected);
      const nextIndex = groups.findIndex((group) => group.id === value);
      setDirection(previousIndex > nextIndex ? "r" : "l");
    } else if (value === null) {
      setDirection(null);
    }

    setSelected(value);
  };

  const tabId = (id: string) => `${instanceId}-category-tab-${id}`;
  const overlayId = `${instanceId}-category-overlay`;
  const selectedGroup = groups.find((group) => group.id === selected) ?? null;

  return (
    <div
      className="category-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          handleSetSelected(null);
        }
      }}
      onMouseLeave={() => handleSetSelected(null)}
    >
      <button
        aria-current={selectedCategory === "all" ? "page" : undefined}
        className={`category-menu__all ${selectedCategory === "all" ? "is-active" : ""}`}
        onClick={() => onSelectCategory("all")}
        type="button"
      >
        <Compass aria-hidden="true" size={17} strokeWidth={1.8} />
        <span>{ALL_LABEL[locale]}</span>
      </button>

      {groups.map((group) => {
        const isOpen = selected === group.id;
        const isActive = group.categories.some((category) => category.slug === selectedCategory);

        return (
          <button
            aria-controls={isOpen ? overlayId : undefined}
            aria-expanded={isOpen}
            aria-current={isActive ? "page" : undefined}
            className={`category-menu__tab ${isOpen || isActive ? "is-active" : ""}`}
            id={tabId(group.id)}
            key={group.id}
            onClick={() => handleSetSelected(isOpen ? null : group.id)}
            onFocus={() => handleSetSelected(group.id)}
            onMouseEnter={() => handleSetSelected(group.id)}
            style={{ "--category-accent": group.accent } as React.CSSProperties}
            type="button"
          >
            <span className="category-menu__tab-icon" aria-hidden="true">
              {group.icon}
            </span>
            <span>{localize(group.label, locale)}</span>
            <ChevronDown
              aria-hidden="true"
              className={`category-menu__chevron ${isOpen ? "is-open" : ""}`}
              size={15}
              strokeWidth={2}
            />
          </button>
        );
      })}

      <AnimatePresence initial={false}>
        {selectedGroup ? (
          <DropdownContent
            direction={direction}
            group={selectedGroup}
            instanceId={instanceId}
            locale={locale}
            onClose={() => handleSetSelected(null)}
            onSelectCategory={onSelectCategory}
            overlayId={overlayId}
            tabId={tabId(selectedGroup.id)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DropdownContent({
  direction,
  group,
  instanceId,
  locale,
  onClose,
  onSelectCategory,
  overlayId,
  tabId
}: {
  direction: Direction;
  group: ShiftingDropDownGroup;
  instanceId: string;
  locale: Locale;
  onClose: () => void;
  onSelectCategory: (slug: string) => void;
  overlayId: string;
  tabId: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [nubLeft, setNubLeft] = useState(0);

  useEffect(() => {
    const moveNub = () => {
      const hoveredTab = document.getElementById(tabId);
      const overlay = overlayRef.current;

      if (!hoveredTab || !overlay) return;

      const tabRect = hoveredTab.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      setNubLeft(tabRect.left + tabRect.width / 2 - overlayRect.left);
    };

    moveNub();
    window.addEventListener("resize", moveNub);
    return () => window.removeEventListener("resize", moveNub);
  }, [tabId]);

  const groupLabel = localize(group.label, locale);
  const groupDescription = group.description ? localize(group.description, locale) : null;

  return (
    <motion.div
      ref={overlayRef}
      animate={{ opacity: 1, y: 0 }}
      aria-label={groupLabel}
      className="category-menu__dropdown"
      exit={{ opacity: 0, y: 8 }}
      id={overlayId}
      initial={{ opacity: 0, y: 8 }}
      key={group.id}
      role="menu"
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="category-menu__bridge" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="category-menu__nub"
        style={{ left: nubLeft }}
      />

      <motion.div
        animate={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: direction === "l" ? 24 : direction === "r" ? -24 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <div className="category-menu__dropdown-header">
          <span
            className="category-menu__dropdown-icon"
            style={{ "--category-accent": group.accent } as React.CSSProperties}
          >
            {group.icon}
          </span>
          <div>
            <p className="category-menu__dropdown-kicker">Manzil</p>
            <h3>{groupLabel}</h3>
            {groupDescription ? <p>{groupDescription}</p> : null}
          </div>
        </div>

        <div className="category-menu__items">
          {group.categories.map((category) => (
            <button
              aria-current={selectedCategoryFor(group, category.slug) ? "page" : undefined}
              className="category-menu__item"
              key={category.id}
              onClick={() => {
                onSelectCategory(category.slug);
                onClose();
              }}
              role="menuitem"
              type="button"
            >
              <span
                className="category-menu__item-icon"
                style={{ "--category-accent": category.color } as React.CSSProperties}
              >
                {category.icon}
              </span>
              <span className="category-menu__item-copy">
                <strong>{localize(category.label, locale)}</strong>
                {category.description ? <small>{localize(category.description, locale)}</small> : null}
              </span>
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          ))}
        </div>

        <button
          className="category-menu__view-all"
          onClick={() => {
            onSelectCategory("all");
            onClose();
          }}
          type="button"
        >
          <span>{VIEW_ALL_LABEL[locale]}</span>
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
}

function selectedCategoryFor(group: ShiftingDropDownGroup, slug: string) {
  return group.categories.some((category) => category.slug === slug);
}
