import { ArrowRight, ArrowUpRight, Compass, MessagesSquare, Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ManzilMark } from "@/components/brand/ManzilMark";
import { Reveal } from "@/hooks/use-reveal";
import { links } from "@/lib/links";
import { cn } from "@/lib/utils";
import { ProductConcept } from "./ProductConcept";
import metro from "@/assets/metro.webp";

/* ---------- shared bits ---------- */

function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-3 text-muted-foreground">
      {index && <span className="text-signal">{index}</span>}
      {index && <span className="h-px w-6 bg-border" aria-hidden />}
      {children}
    </p>
  );
}

type Status = "IN PROGRESS" | "IN EXPLORATION" | "VISION";
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "label-status inline-flex items-center gap-1.5 text-muted-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}

/* ---------- 02 — Thesis ---------- */

export function Thesis() {
  return (
    <section id="how" aria-labelledby="thesis-title" className="relative py-28 md:py-40">
      <div className="shell grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-3">
          <Eyebrow index="02">Core thesis</Eyebrow>
        </Reveal>
        <div className="md:col-span-9">
          <Reveal as="h2" id="thesis-title" className="display-xl max-w-[16ch]">
            Better information. <span className="text-muted-foreground">Better decisions.</span>
          </Reveal>
          <Reveal delay={120} className="mt-12 grid gap-10 md:grid-cols-9">
            <div className="signal-rule mt-3 md:col-span-3" aria-hidden />
            <p className="lede text-foreground/80 md:col-span-6">
              The best local insight often lives in people's experiences, but it can be difficult to
              find when you need it. Manzil gives those experiences a useful home and connects them
              to the places they describe.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- 03 — Problem ---------- */

const PROBLEMS = [
  {
    title: "Hard to discover",
    body: "Useful information is scattered across profiles, posts, chats, listings and recommendations.",
  },
  {
    title: "Hard to evaluate",
    body: "Context about quality, experience and offerings can be incomplete or inconsistent.",
  },
  {
    title: "Hard to connect",
    body: "People's stories are not always linked to the exact places other people want to explore.",
  },
];

export function Problem() {
  return (
    <section
      id="why"
      aria-labelledby="problem-title"
      className="border-t border-border bg-card py-24 md:py-32"
    >
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <Eyebrow index="03">The problem</Eyebrow>
          </Reveal>
          <Reveal as="h2" id="problem-title" className="display-lg max-w-[20ch] md:col-span-9">
            Local knowledge exists. It's just fragmented.
          </Reveal>
        </div>
        <div className="mt-16 grid border-t border-border md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 120}
              className={cn(
                "py-10 md:px-8 md:py-12",
                i > 0 && "border-t border-border md:border-l md:border-t-0",
                i === 0 && "md:pl-0",
              )}
            >
              <span className="eyebrow text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">{p.title}</h3>
              <p className="mt-3 max-w-[34ch] text-foreground/75">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 04 — One platform ---------- */

const MODULES = [
  {
    id: "community",
    label: "The home experience",
    icon: MessagesSquare,
    title: "Community",
    tagline: "Local knowledge, shared by people.",
    body: "Share experiences, ask questions and exchange local insight. Community is the starting point in the Manzil customer app.",
    status: null,
  },
  {
    id: "discover",
    label: "Inside Manzil",
    icon: Compass,
    title: "Discover",
    tagline: "From conversation to discovery, without leaving Manzil.",
    body: "We're bringing place and service discovery into the same Manzil app and account, alongside Community.",
    status: "IN PROGRESS" as Status,
  },
  {
    id: "connected",
    label: "One continuous journey",
    icon: Link2,
    title: "Connected context",
    tagline: "Every story, linked to its place.",
    body: "We're connecting posts with the places they describe, so local experiences can carry useful context within Community.",
    status: "IN PROGRESS" as Status,
  },
];

export function Platform() {
  return (
    <section id="platform" aria-labelledby="platform-title" className="py-28 md:py-40">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <Eyebrow index="04">One Manzil. One community.</Eyebrow>
          </Reveal>
          <div className="md:col-span-9">
            <Reveal as="h2" id="platform-title" className="display-xl max-w-[18ch]">
              Discover a place. Hear its story. Share yours.
            </Reveal>
            <Reveal delay={120} as="p" className="lede mt-8 max-w-[52ch] text-foreground/75">
              One app. One account. Community is the starting point; Discover and connected
              experiences are being brought into the same Manzil journey.
            </Reveal>
          </div>
        </div>

        <div className="mt-20 space-y-24 md:space-y-32">
          {MODULES.map((m, i) => (
            <article
              key={m.id}
              id={m.id}
              aria-labelledby={`${m.id}-title`}
              className="grid scroll-mt-24 items-center gap-10 md:grid-cols-12"
            >
              <Reveal
                className={cn(
                  m.id === "connected" ? "md:col-span-7" : "md:col-span-5",
                  i % 2 === 1 && "md:order-2 md:col-start-8",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="eyebrow text-muted-foreground">
                    0{i + 1} / {m.label}
                  </span>
                  {m.status && <StatusTag status={m.status} />}
                </div>
                <h3 id={`${m.id}-title`} className="display-lg mt-6 flex items-center gap-3">
                  <m.icon className="size-7 text-signal" aria-hidden />
                  {m.title}
                </h3>
                <p className="mt-4 text-xl font-semibold tracking-tight">{m.tagline}</p>
                <p className="mt-4 max-w-[46ch] text-foreground/75">{m.body}</p>
              </Reveal>
              <Reveal
                delay={150}
                className={cn(
                  "min-w-0",
                  m.id === "connected" ? "md:col-span-12" : "md:col-span-6",
                  m.id !== "connected" &&
                    (i % 2 === 1 ? "md:order-1 md:col-start-1" : "md:col-start-7"),
                )}
              >
                <ProductConcept
                  concept={m.id as "community" | "discover" | "connected"}
                  className={cn("mx-auto w-full", m.id === "connected" ? "max-w-6xl" : "max-w-sm")}
                />
              </Reveal>
            </article>
          ))}
        </div>

        <Reveal className="mt-24 flex flex-wrap items-center gap-6 border-t border-border pt-10">
          <Button asChild variant="accent" size="xl">
            <a href={links.getStarted}>
              Join Manzil <ArrowRight aria-hidden />
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Create your Manzil account and start with Community.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 05 — App preview (concept) ---------- */

export function AppPreview() {
  return (
    <section
      aria-labelledby="app-title"
      className="theme-ink relative overflow-hidden py-28 md:py-40"
    >
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Reveal>
              <Eyebrow index="05">Inside the app</Eyebrow>
            </Reveal>
            <Reveal as="h2" id="app-title" delay={80} className="display-xl mt-6">
              A home for local knowledge.
            </Reveal>
          </div>
          <Reveal as="p" delay={160} className="lede text-foreground/75 md:col-span-5">
            Start with what people are sharing. The concept shows Discover and linked place context
            alongside Community, connected to one Manzil account.
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-16">
          <ProductConcept concept="desktop" />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 06 — Trust ---------- */

export function Trust() {
  const path = ["Community post", "Related place", "Discover context", "Better decision"];
  return (
    <section aria-labelledby="trust-title" className="py-28 md:py-40">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <Eyebrow index="06">Trust &amp; information</Eyebrow>
          </Reveal>
          <div className="md:col-span-9">
            <Reveal as="h2" id="trust-title" className="display-xl max-w-[18ch]">
              The useful details live in the conversation.
            </Reveal>
          </div>
        </div>

        <Reveal delay={100} className="mt-16">
          <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {path.map((step, i) => (
              <li key={step} className="relative bg-background p-6 md:p-8">
                <span className="eyebrow text-muted-foreground">Step 0{i + 1}</span>
                <p className="mt-8 text-xl font-bold tracking-tight">{step}</p>
                {i < path.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute right-5 top-6 size-4 text-signal md:right-6 md:top-8"
                  />
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {[
            {
              t: "Clear community rules",
              b: "Contributions follow published rules for respectful, honest sharing.",
              href: links.communityRules,
              cta: "Read the rules",
            },
            {
              t: "Facts and opinions, kept distinct",
              b: "Official business details and people's personal experiences offer different kinds of context. Read them together when deciding where to go.",
            },
            {
              t: "Clear privacy information",
              b: "Read our privacy policy for information about personal data, location and your choices.",
              href: links.privacy,
              cta: "Privacy policy",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 100} className="border-t border-border pt-6">
              <h3 className="text-lg font-bold tracking-tight">{c.t}</h3>
              <p className="mt-2 text-foreground/75">{c.b}</p>
              {c.href && (
                <a
                  href={c.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-4"
                >
                  {c.cta} <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 07 — Why local markets ---------- */

export function Markets() {
  return (
    <section
      aria-labelledby="markets-title"
      className="theme-ink grain relative isolate overflow-hidden"
    >
      <img
        src={metro}
        alt="Ornate columns and chandeliers of Mustaqillik Maydoni metro station, Tashkent"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-side-shade)" }}
      />
      <div className="absolute inset-0 -z-10 bg-background/40" />
      <div className="shell grid min-h-[80svh] content-end gap-10 py-24 md:grid-cols-12 md:py-32">
        <div className="md:col-span-7">
          <Reveal>
            <Eyebrow index="07">Why this matters</Eyebrow>
          </Reveal>
          <Reveal as="h2" id="markets-title" delay={80} className="display-xl mt-6">
            Clearer markets start with shared knowledge.
          </Reveal>
        </div>
        <Reveal delay={160} className="space-y-5 text-foreground/80 md:col-span-5">
          <p className="lede">
            When information is uneven, choosing well takes luck or connections. Customers guess;
            good small businesses go unnoticed.
          </p>
          <p>
            Manzil starts with something people already do — telling each other where to go and what
            to expect — and gives it a place where it can be found, connected and built on. A more
            transparent local economy starts with better information.
          </p>
          <p className="pt-4 text-xs text-muted-foreground">
            Mustaqillik Maydoni station · Photo: Tim Adams,{" "}
            <a
              className="underline underline-offset-2"
              href="https://creativecommons.org/licenses/by/4.0/"
            >
              CC BY 4.0
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 08 — Vision ---------- */

const ROADMAP: { title: string; body: string; status: Status }[] = [
  {
    title: "Richer business information",
    body: "Structured, up-to-date details for places and services, maintained with the businesses themselves.",
    status: "IN EXPLORATION",
  },
  {
    title: "Menus & offerings",
    body: "What a place actually offers, linked to what people say about it.",
    status: "IN EXPLORATION",
  },
  {
    title: "Prices over time",
    body: "Understanding how everyday prices change — only once the data is reliable enough to trust.",
    status: "VISION",
  },
  {
    title: "Gurman",
    body: "Context-aware, personal guidance built on community knowledge.",
    status: "VISION",
  },
];

export function Vision() {
  return (
    <section id="vision" aria-labelledby="vision-title" className="py-28 md:py-40">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <Eyebrow index="08">Roadmap</Eyebrow>
          </Reveal>
          <div className="md:col-span-9">
            <Reveal as="h2" id="vision-title" className="display-xl max-w-[16ch]">
              From local knowledge to market intelligence.
            </Reveal>
            <Reveal as="p" delay={100} className="lede mt-8 max-w-[54ch] text-foreground/75">
              Where we're heading. None of the following is live yet — each item is labelled for
              exactly where it stands.
            </Reveal>
          </div>
        </div>

        <ul className="mt-16 border-t border-border">
          {ROADMAP.map((r, i) => (
            <Reveal
              as="li"
              key={r.title}
              delay={i * 80}
              className="grid gap-4 border-b border-border py-8 md:grid-cols-12 md:items-baseline"
            >
              <span className="eyebrow text-muted-foreground md:col-span-1">0{i + 1}</span>
              <h3 className="text-2xl font-bold tracking-tight md:col-span-4">{r.title}</h3>
              <p className="text-foreground/75 md:col-span-5">{r.body}</p>
              <div className="md:col-span-2 md:text-right">
                <StatusTag status={r.status} />
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-10">
          <a
            href={links.gurmanWaitlist}
            className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-4"
          >
            Interested in Gurman? Join the waitlist{" "}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 09 — Business ---------- */

export function Business() {
  return (
    <section
      aria-labelledby="business-title"
      className="border-y border-border bg-card py-24 md:py-32"
    >
      <div className="shell grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <Reveal>
            <Eyebrow index="09">For businesses</Eyebrow>
          </Reveal>
          <Reveal as="h2" id="business-title" delay={80} className="display-lg mt-6 max-w-[22ch]">
            A clearer connection between businesses and their communities.
          </Reveal>
        </div>
        <Reveal delay={160} className="md:col-span-5">
          <p className="text-foreground/80">
            Business tools live in their own workspace, separate from the customer app — for keeping
            official information accurate, sharing updates and responding through the right
            channels.
          </p>
          <Button asChild variant="line" size="xl" className="mt-8">
            <a href={links.forBusinesses}>
              For Businesses <ArrowUpRight aria-hidden />
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 10 — Final CTA ---------- */

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-title"
      className="theme-ink relative overflow-hidden py-32 md:py-48"
    >
      <ManzilMark className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] text-foreground opacity-[0.04] md:w-[40rem]" />
      <div className="shell relative">
        <Reveal as="h2" id="final-title" className="display-hero max-w-[14ch]">
          Your city has a story. Be part of it.
        </Reveal>
        <Reveal delay={150} className="mt-12 flex flex-wrap items-center gap-3">
          <Button asChild variant="accent" size="xl">
            <a href={links.getStarted}>Get Started</a>
          </Button>
          <Button asChild variant="quiet" size="xl">
            <a href={links.logIn}>Log In</a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
