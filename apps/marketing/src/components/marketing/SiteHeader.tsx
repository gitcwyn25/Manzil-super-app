import { useEffect, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ManzilLockup } from "@/components/brand/ManzilMark";
import { links } from "@/lib/links";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Platform", href: "/#platform" },
  { label: "Community", href: "/#community" },
  { label: "Discover", href: "/#discover" },
  { label: "Why Manzil", href: "/#why" },
  { label: "Vision", href: "/#vision" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "theme-ink fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
        <a href="/#top" aria-label="Manzil — back to top" className="rounded-sm">
          <ManzilLockup />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href={links.forBusinesses}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            For Businesses
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="quiet" className="hidden sm:inline-flex">
            <a href={links.logIn}>Log In</a>
          </Button>
          <Button asChild variant="accent">
            <a href={links.getStarted}>Get Started</a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="quiet" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="theme-ink w-full border-border p-0 sm:max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center px-6">
                  <ManzilLockup />
                </div>
                <nav aria-label="Mobile" className="flex flex-col px-3 pt-4">
                  {NAV.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={item.href}
                        className="rounded-md px-3 py-3 text-lg font-semibold tracking-tight hover:bg-accent"
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  ))}
                  <a
                    href={links.forBusinesses}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-3 text-lg font-semibold tracking-tight hover:bg-accent"
                  >
                    For Businesses <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-border p-6">
                  <Button asChild variant="accent" size="xl">
                    <a href={links.getStarted}>Get Started — create an account</a>
                  </Button>
                  <Button asChild variant="line" size="xl">
                    <a href={links.logIn}>Log In — I already have an account</a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
