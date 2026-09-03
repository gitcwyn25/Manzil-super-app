"use client";

import type { Locale } from "@manzil/shared";
import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemePreference } from "./theme-provider";

type ThemeLabels = Record<ThemePreference, { label: string; description: string }>;

const labels: Record<Locale, ThemeLabels> = {
  uz: {
    day: { label: "Kun", description: "Yorug‘ ko‘rinish" },
    night: { label: "Tun", description: "To‘q ko‘rinish" },
    system: { label: "Tizim", description: "Qurilma sozlamasidan foydalanish" }
  },
  ru: {
    day: { label: "День", description: "Светлая тема" },
    night: { label: "Ночь", description: "Тёмная тема" },
    system: { label: "Система", description: "Настройка устройства" }
  },
  en: {
    day: { label: "Day", description: "Light appearance" },
    night: { label: "Night", description: "Dark appearance" },
    system: { label: "System", description: "Follow device setting" }
  }
};

const options: Array<{ value: ThemePreference; icon: React.ReactNode }> = [
  {
    value: "day",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </svg>
    )
  },
  {
    value: "night",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M20.3 15.4A8.5 8.5 0 0 1 8.6 3.7 8.5 8.5 0 1 0 20.3 15.4Z" />
      </svg>
    )
  },
  {
    value: "system",
    icon: (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    )
  }
];

function AppearanceIcon({ preference }: { preference: ThemePreference }) {
  return options.find((option) => option.value === preference)?.icon ?? options[2].icon;
}

export function ThemeSwitcher({ locale }: { locale: Locale }) {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const copy = labels[locale];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${copy[preference].label}: appearance`}
        className="theme-button"
        onClick={() => setOpen((value) => !value)}
        title={copy[preference].label}
        type="button"
      >
        <AppearanceIcon preference={preference} />
        <span className="theme-button__label">{copy[preference].label}</span>
        <svg aria-hidden="true" className="theme-button__chevron" fill="none" viewBox="0 0 24 24">
          <path d="m7 9 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div aria-label={locale === "uz" ? "Ko‘rinish" : locale === "ru" ? "Оформление" : "Appearance"} className="theme-dropdown" role="menu">
          <p className="theme-dropdown__eyebrow">{locale === "uz" ? "Ko‘rinish" : locale === "ru" ? "Оформление" : "Appearance"}</p>
          {options.map((option) => {
            const active = option.value === preference;
            return (
              <button
                aria-checked={active}
                className={active ? "active" : undefined}
                key={option.value}
                onClick={() => {
                  setPreference(option.value);
                  setOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                <span className="theme-option__icon">{option.icon}</span>
                <span className="theme-option__copy">
                  <strong>{copy[option.value].label}</strong>
                  <small>{copy[option.value].description}</small>
                </span>
                {active ? (
                  <svg aria-hidden="true" className="theme-option__check" fill="none" viewBox="0 0 24 24">
                    <path d="m5 12 4.5 4.5L19 7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
