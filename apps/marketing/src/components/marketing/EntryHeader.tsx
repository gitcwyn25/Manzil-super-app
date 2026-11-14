import { ArrowLeft } from "lucide-react";
import { ManzilLockup } from "@/components/brand/ManzilMark";
import { links } from "@/lib/links";

/** A compact, fully server-rendered header for the corporate entry pages. */
export function EntryHeader({ current }: { current: "docs" | "gurman" }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <header className="theme-ink border-b border-border">
        <div className="shell flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5">
          <a href="/" aria-label="Manzil home" className="rounded-sm">
            <ManzilLockup />
          </a>
          <nav aria-label="Page navigation" className="flex items-center gap-5 text-sm sm:gap-8">
            {(["docs", "gurman"] as const).map((page) => (
              <a
                key={page}
                href={links[page]}
                aria-current={current === page ? "page" : undefined}
                className="rounded-sm py-2 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-lime"
              >
                {page === "docs" ? "Docs" : "Gurman"}
              </a>
            ))}
            <a
              href="/"
              className="hidden items-center gap-2 rounded-sm py-2 text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to Manzil
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
