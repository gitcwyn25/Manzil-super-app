import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ManzilMark } from "@/components/brand/ManzilMark";
import { EntryHeader } from "@/components/marketing/EntryHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { CORPORATE_ORIGIN, links } from "@/lib/links";

const TITLE = "Gurman | A forthcoming Manzil experience";
const DESCRIPTION =
  "Gurman is a forthcoming Manzil experience. Express your interest through the Gurman waitlist.";

export const Route = createFileRoute("/gurman/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `${CORPORATE_ORIGIN}/gurman` },
    ],
    links: [{ rel: "canonical", href: `${CORPORATE_ORIGIN}/gurman` }],
  }),
  component: GurmanPage,
});

function GurmanPage() {
  return (
    <>
      <EntryHeader current="gurman" />
      <main id="main" tabIndex={-1}>
        <section className="theme-ink overflow-hidden">
          <div className="shell grid min-h-[36rem] items-center gap-14 py-16 md:min-h-[42rem] md:grid-cols-[1.25fr_1fr] md:gap-20 md:py-24">
            <div>
              <p className="eyebrow text-lime">A forthcoming Manzil experience</p>
              <h1 className="mt-8 font-display text-[clamp(4.5rem,12vw,10.5rem)] font-bold leading-none tracking-[-0.065em]">
                Gurman.
              </h1>
              <p className="lede mt-8 max-w-[34ch] text-muted-foreground">
                A new chapter is taking shape. Be part of the beginning.
              </p>
              <Button asChild variant="accent" size="xl" className="mt-10">
                <a href={links.gurmanWaitlistEntry}>
                  Join the waitlist <ArrowUpRight aria-hidden />
                </a>
              </Button>
              <p className="mt-4 max-w-[38ch] text-sm leading-6 text-muted-foreground">
                Continue to our waitlist form on Tally to submit your response.
              </p>
            </div>
            <div
              className="relative mx-auto flex aspect-square w-full max-w-[25rem] items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <div className="absolute inset-8 rounded-full border border-border" />
              <div className="absolute inset-x-0 top-1/2 border-t border-border" />
              <div className="absolute inset-y-0 left-1/2 border-l border-border" />
              <ManzilMark className="relative w-[57%] text-lime" />
              <span className="eyebrow absolute bottom-6 bg-background px-3 text-muted-foreground">
                Gurman / Manzil
              </span>
            </div>
          </div>
          <div className="shell">
            <div className="signal-rule" />
          </div>
        </section>
        <section className="py-16 md:py-24" aria-labelledby="gurman-introduction">
          <div className="shell grid gap-8 md:grid-cols-[1fr_1.25fr] md:gap-20">
            <p className="eyebrow text-muted-foreground">The next chapter</p>
            <div className="max-w-xl">
              <h2 id="gurman-introduction" className="display-lg">
                From Manzil.
                <br />
                Still taking shape.
              </h2>
              <p className="lede mt-7 text-muted-foreground">
                Gurman is a forthcoming Manzil experience. We are preparing what comes next, and the
                waitlist is a place to express your interest.
              </p>
              <p className="mt-5 leading-7 text-muted-foreground">
                Launch details will be shared when they are ready.
              </p>
              <a
                href="/"
                className="mt-9 inline-flex items-center gap-2 rounded-sm py-2 text-sm font-semibold"
              >
                <ArrowLeft className="size-4" aria-hidden /> Back to Manzil
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
