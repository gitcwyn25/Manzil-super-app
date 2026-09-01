// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "nav";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const BASE_CLASS =
  "inline-flex cursor-pointer touch-manipulation items-center justify-center whitespace-nowrap font-sans text-[15px] font-medium leading-none tracking-[-0.6px] transition-[opacity,transform] duration-200 ease [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.98] motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90";

/** Figma tablet/desktop CTA frame is 42px — keep the same on mobile (18px was a bad export) */
const CTA_SIZE = "h-[42px] min-h-[42px] px-5 py-3 ipad:px-6";

export const Button = ({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => {
  if (variant === "nav") {
    return (
      <button
        type={type}
        className={`${BASE_CLASS} min-h-11 rounded-[36px] bg-black px-5 py-3 text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type={type}
        className={`${BASE_CLASS} ${CTA_SIZE} rounded-[36px] border border-black/10 bg-black/[0.02] text-black/70 hover:bg-black/[0.04] ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <span className="relative inline-flex">
      {/* Linear-gradient shadow — soft fade under the pill */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[calc(100%-6px)] left-1/2 z-0 h-10 w-[92%] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.18)_40%,rgba(0,0,0,0)_100%)] blur-[12px]"
      />
      <button
        type={type}
        className={`${BASE_CLASS} ${CTA_SIZE} relative z-[1] overflow-hidden rounded-[36px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] text-white ${className}`}
        {...props}
      >
        <span className="relative z-[1]">{children}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_5px_rgba(0,0,0,0.25)]"
        />
      </button>
    </span>
  );
};
