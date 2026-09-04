"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const NAV = [
  { label: "Today", href: "/", hint: "decision queue overview" },
  { label: "Waitlist", href: "/waitlist", hint: "Gurman city pro intake" },
  { label: "Outbox", href: "/outbox", hint: "queued attributable email drafts" },
  { label: "Signature profile", href: "/signature", hint: "operator attribution version" },
  { label: "Companies", href: "/businesses", hint: "claims verification activation" },
  { label: "Reviews", href: "/reviews", hint: "trust moderation" },
  { label: "Payment exceptions", href: "/payments", hint: "reconciliation provider truth" },
  { label: "Campaigns", href: "/campaigns", hint: "consent approval growth" },
  { label: "Signed activity", href: "/audit", hint: "audit attribution" },
  { label: "Team & access", href: "/team", hint: "employees roles signatures" },
  { label: "Analytics", href: "/analytics", hint: "platform signals" }
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return normalized ? NAV.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(normalized)) : NAV;
  }, [query]);

  useEffect(() => setActive(0), [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0))); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter" && results[active]) { event.preventDefault(); go(results[active].href); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only"><DialogTitle>Jump to a Manzil queue</DialogTitle><DialogDescription>Search and navigate the operations console.</DialogDescription></DialogHeader>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} className="h-14 border-0 px-0 shadow-none focus-visible:ring-0" placeholder="Jump to a queue or workspace…" />
          <kbd className="hidden shrink-0 rounded border border-border bg-panel-3 px-1.5 py-1 font-data text-[10px] text-muted-foreground sm:inline">ESC</kbd>
        </div>
        <div className="border-b border-border px-4 py-2 font-data text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{results.length} destinations</div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {results.map((item, index) => (
            <Button key={item.href} variant="ghost" className={`h-auto min-h-12 w-full justify-start px-3 py-2 text-left ${index === active ? "bg-panel-3 text-foreground" : ""}`} onMouseEnter={() => setActive(index)} onClick={() => go(item.href)}>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="block truncate text-xs font-normal text-muted-foreground">{item.hint}</span></span>
              {index === active ? <ArrowRight className="size-4 text-ceramic" /> : null}
            </Button>
          ))}
          {results.length === 0 ? <p className="px-3 py-10 text-center text-sm text-muted-foreground">No matching queue. Try a business, waitlist, or audit term.</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CommandHint() {
  return <kbd className="rounded border border-border bg-panel-3 px-1.5 py-0.5 font-data text-[10px] text-muted-foreground">⌘K</kbd>;
}
