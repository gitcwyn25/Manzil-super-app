"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

type FontStyle = React.CSSProperties;
type SplitBy = "characters" | "words";
type ScrollPosition =
    | "top top"
    | "top center"
    | "top bottom"
    | "center top"
    | "center center"
    | "center bottom"
    | "bottom top"
    | "bottom center"
    | "bottom bottom"
    | (string & {});

type ScrollHighlightProps = {
    text?: string;
    font?: FontStyle;
    className?: string;
    containerStyle?: React.CSSProperties;
    dimColor?: string;
    highlightColor?: string;
    splitBy?: SplitBy;
    scrollStart?: ScrollPosition;
    scrollEnd?: ScrollPosition;
    scrub?: boolean;
    /** Keep the component compact when embedded inside an existing workspace. */
    spacer?: boolean;
};

const CHAR_STAGGER = 0.03;
const WORD_STAGGER = 0.1;

export default function ScrollHighlight({
    text = "Every word in this paragraph will light up as you scroll through it.",
    font = {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "60px",
        fontWeight: 600,
        letterSpacing: "-0.025em",
        lineHeight: "1.1em",
        textAlign: "left",
    },
    dimColor = "rgba(255, 255, 255, 0.15)",
    highlightColor = "#FFFFFF",
    splitBy = "words",
    scrollStart = "top center",
    scrollEnd = "bottom center",
    scrub = true,
    className,
    containerStyle,
    spacer = true,
}: ScrollHighlightProps) {
    const containerRef = useRef<HTMLParagraphElement>(null);
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chars = Array.from(text);
    const stagger = splitBy === "characters" ? CHAR_STAGGER : WORD_STAGGER;

    useEffect(() => {
        let disposed = false;
        let revert: (() => void) | undefined;

        const setup = async () => {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([
                import("gsap"),
                import("gsap/ScrollTrigger"),
            ]);
            if (disposed) return;

            gsap.registerPlugin(ScrollTrigger);
            const paragraph = containerRef.current;
            if (!paragraph) return;

            const targets = paragraph.querySelectorAll(
                splitBy === "characters" ? ".char" : ".word"
            );
            const ctx = gsap.context(() => {
                gsap.set(targets, { color: dimColor });
                gsap.to(targets, {
                    color: highlightColor,
                    stagger,
                    scrollTrigger: {
                        trigger: paragraph,
                        start: scrollStart,
                        end: scrollEnd,
                        scrub,
                    },
                });
            }, paragraph);
            revert = () => ctx.revert();
        };

        void setup();
        return () => {
            disposed = true;
            revert?.();
        };
    }, [
        text,
        dimColor,
        highlightColor,
        splitBy,
        stagger,
        scrollStart,
        scrollEnd,
        scrub,
    ]);

    return (
        <div
            className={className}
            style={spacer ? { paddingTop: "100dvh", paddingBottom: "100dvh", ...containerStyle } : containerStyle}
        >
            <p
                ref={containerRef}
                style={{
                    margin: 0,
                    display: "inline-block",
                    whiteSpace: "pre-wrap",
                    color: dimColor,
                    ...font,
                }}
            >
                {splitBy === "characters"
                    ? chars.map((char, index) => (
                          <span
                              key={`${char}-${index}`}
                              className="char"
                              style={{ display: "inline-block", color: dimColor }}
                          >
                              {char === " " ? "\u00A0" : char}
                          </span>
                      ))
                    : words.map((word, index) => (
                          <React.Fragment key={`${word}-${index}`}>
                              <span className="word" style={{ display: "inline-block", color: dimColor }}>
                                  {word}
                              </span>
                              {index < words.length - 1 ? " " : null}
                          </React.Fragment>
                      ))}
            </p>
        </div>
    );
}
