"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NAV = [
  { label: "Dashboard", href: "/", hint: "overview" },
  { label: "Business queue", href: "/businesses", hint: "moderation approve reject" },
  { label: "Review queue", href: "/reviews", hint: "moderation flagged spam" },
  { label: "Users", href: "/users", hint: "ban suspend impersonate" },
  { label: "Audit log", href: "/audit", hint: "history actions" }
];

/** cmd+K / ctrl+K command palette for fast navigation between queues. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return NAV;
    return NAV.filter((n) => (n.label + " " + n.hint).toLowerCase().includes(q));
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
          }}
          placeholder="Jump to… (Business queue, Users, Audit)"
          value={query}
        />
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.map((r) => (
            <li key={r.href}>
              <button
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-panel-2"
                onClick={() => go(r.href)}
                type="button"
              >
                <span>{r.label}</span>
                <span className="text-xs text-muted">{r.hint}</span>
              </button>
            </li>
          ))}
          {results.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">No matches</li> : null}
        </ul>
      </div>
    </div>
  );
}

/** Small hint chip shown in the top bar. */
export function CommandHint() {
  return (
    <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[11px] text-muted">⌘K</kbd>
  );
}
