// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";


import type { Locale } from "@manzil/shared";
import { Footer } from "./footer";

function asset(file: string) {
  return `/originkit/footer-02/${file}`;
}

/** Section 21 footer shell from https://github.com/diip3sh/sections */
export function Section21Footer({ locale }: { locale: Locale }) {
  return (
    <section
      aria-label="Manzil site footer"
      className="manzil-footer-02-shell relative isolate flex w-full flex-col items-center justify-end overflow-hidden px-4 pb-8 pt-12 ipad:px-10 ipad:pt-16 desktop-sm:px-12 desktop-sm:pt-24"
    >
      {/* Soft multi-color wash behind the footer card */}
      <div
        aria-hidden="true"
        className="manzil-footer-02-wash pointer-events-none absolute inset-x-0 top-0 z-0 flex h-[55%] min-h-[280px] w-full justify-center overflow-hidden ipad:h-[60%] desktop-sm:h-[70%] desktop-sm:min-h-[320px]"
        style={{
          maskImage:
            "linear-gradient(to bottom, #000 0%, #000 35%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, #000 35%, transparent 100%)",
        }}
      >
        <img
          src={asset("gradient-shapes.svg")}
          alt=""
          width={2238}
          height={545}
          className="absolute top-[-30%] left-1/2 h-auto w-[280%] max-w-none -translate-x-1/2 scale-110 opacity-90 blur-[40px] ipad:top-[-40%] ipad:w-[220%] ipad:blur-[60px] desktop-sm:top-[-55%] desktop-sm:w-[200%] desktop-sm:scale-125 desktop-sm:blur-[80px] full-hd:w-[240%] full-hd:scale-150 full-hd:blur-[90px] ultrawide:top-[-60%] ultrawide:w-[280%] ultrawide:scale-[1.75] ultrawide:blur-[100px]"
        />
      </div>

      <div className="manzil-footer-02-frame relative z-10 mx-auto w-full max-w-[95dvw] wide-lg:max-w-[1440px]">
        <Footer locale={locale} />
      </div>
    </section>
  );
}
