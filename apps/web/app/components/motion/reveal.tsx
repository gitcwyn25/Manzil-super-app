"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";

type RevealVariant = "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right" | "blur-up";

/**
 * Scroll-triggered entrance animation wrapper.
 * SSR-safe: content is rendered immediately and only animated once the
 * IntersectionObserver confirms visibility. Respects prefers-reduced-motion
 * via the `.reveal` CSS rules in globals.css.
 */
export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  as: Tag = "div",
  className,
  once = true,
  style
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "span" | "li" | "article";
  className?: string;
  once?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Deferred to a task rather than set synchronously: a synchronous setState
    // inside an effect triggers a cascading render. The one-frame delay is
    // invisible and this path only runs where IntersectionObserver is absent.
    if (typeof IntersectionObserver === "undefined") {
      const immediate = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(immediate);
    }

    // Safety net: if the observer never fires (hidden tab, headless render,
    // odd layout), reveal anyway so the section is never left blank.
    const fallback = window.setTimeout(() => setShown(true), 700);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.clearTimeout(fallback);
            setShown(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    observer.observe(node);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [once]);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal reveal-${variant}${shown ? " is-shown" : ""}${className ? ` ${className}` : ""}`}
      style={{
        ...style,
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggers Reveal animations across its direct children.
 */
export function RevealStagger({
  children,
  variant = "fade-up",
  step = 90,
  start = 0,
  className,
  as = "div"
}: {
  children: ReactNode;
  variant?: RevealVariant;
  step?: number;
  start?: number;
  className?: string;
  as?: "div" | "section" | "span";
}) {
  const items = Children.toArray(children);
  const Tag = as;

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <Reveal delay={start + index * step} key={isValidElement(child) && child.key != null ? child.key : index} variant={variant}>
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}

/**
 * Adds `is-shown` to a single child element instead of wrapping it —
 * useful when an extra div would break a CSS grid.
 */
export function RevealInline({
  children,
  delay = 0
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current?.parentElement;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const child = Children.only(children);
  if (!isValidElement<{ className?: string; style?: CSSProperties }>(child)) return <>{children}</>;

  return (
    <>
      <span aria-hidden="true" hidden ref={ref} />
      {cloneElement(child, {
        className: `${child.props.className ?? ""} reveal reveal-fade-up${shown ? " is-shown" : ""}`.trim(),
        style: { ...child.props.style, transitionDelay: `${delay}ms` }
      })}
    </>
  );
}
