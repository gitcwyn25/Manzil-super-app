import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalField } from "./SignalField";
import { links, photoCredits } from "@/lib/links";
import chorsu from "@/assets/chorsu-bazaar-tashkent.jpg.asset.json";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="theme-ink grain relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      <picture>
        <source
          type="image/avif"
          srcSet="/images/photos/chorsu-1280.avif 1280w, /images/photos/chorsu-1920.avif 1920w, /images/photos/chorsu-2400.avif 2400w"
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet="/images/photos/chorsu-1280.webp 1280w, /images/photos/chorsu-1920.webp 1920w, /images/photos/chorsu-2400.webp 2400w"
          sizes="100vw"
        />
        <img
          src={chorsu.url}
          width={chorsu.width}
          height={chorsu.height}
          alt="The tiled dome of Chorsu Bazaar in Tashkent"
          className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover object-[50%_40%]"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero-shade)" }}
      />
      <div
        className="absolute inset-0 -z-10 hidden md:block"
        style={{ background: "var(--gradient-side-shade)" }}
      />
      <SignalField />

      <div className="shell relative flex flex-1 flex-col justify-end pb-10 pt-32 md:pb-14">
        <p
          className="eyebrow animate-fade-up flex items-center gap-3 text-muted-foreground"
          style={{ animationDelay: "100ms" }}
        >
          <span className="inline-block h-px w-10 bg-lime" aria-hidden />
          Manzil / Local market intelligence
        </p>

        <h1
          id="hero-title"
          className="display-hero animate-fade-up mt-6 max-w-[13ch]"
          style={{ animationDelay: "220ms" }}
        >
          The intelligence layer for local markets.
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <p
            className="lede animate-fade-up text-foreground/80 md:col-span-6 lg:col-span-5"
            style={{ animationDelay: "380ms" }}
          >
            People know their cities. Manzil helps that knowledge travel — through community,
            discovery, and more informed everyday decisions. Starting in Tashkent.
          </p>
          <div
            className="animate-fade-up flex flex-wrap gap-3 md:col-span-6 md:justify-end lg:col-span-7"
            style={{ animationDelay: "520ms" }}
          >
            <Button asChild variant="accent" size="xl">
              <a href={links.getStarted}>Get Started</a>
            </Button>
            <Button asChild variant="line" size="xl">
              <a href="#how">
                How Manzil works <ArrowDown aria-hidden />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-14 flex items-center justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground">
          <span className="eyebrow">Chorsu · Tashkent, Uzbekistan</span>
          <span className="max-w-[26ch] text-right sm:max-w-none">
            Photo: Adam Harangozó,{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href={photoCredits[0].licenseUrl}
            >
              CC BY-SA 4.0
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
