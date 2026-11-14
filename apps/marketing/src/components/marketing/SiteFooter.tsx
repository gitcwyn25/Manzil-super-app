import { ManzilLockup } from "@/components/brand/ManzilMark";
import { links, photoCredits } from "@/lib/links";

const COLUMNS = [
  {
    title: "Platform",
    items: [
      { label: "Platform", href: "/#platform" },
      { label: "Community", href: "/#community" },
      { label: "Discover", href: "/#discover" },
      { label: "Vision", href: "/#vision" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Join Manzil", href: links.getStarted },
      { label: "Log In", href: links.logIn },
      { label: "For Businesses", href: links.forBusinesses },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: links.about },
      { label: "Contact", href: links.contact },
      { label: "Docs", href: links.docs },
      { label: "Gurman", href: links.gurman },
      { label: "Instagram", href: links.instagram },
      { label: "YouTube", href: links.youtube },
      { label: "X", href: links.x },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: links.privacy },
      { label: "Terms", href: links.terms },
      { label: "Community rules", href: links.communityRules },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="theme-ink border-t border-border">
      <div className="shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <ManzilLockup />
          <p className="mt-5 max-w-[30ch] text-sm text-muted-foreground">
            The intelligence layer for local markets. Starting in Tashkent, Uzbekistan.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4 md:col-span-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="eyebrow text-muted-foreground">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i.label}>
                    <a href={i.href} className="text-sm text-foreground/85 hover:text-lime">
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="shell flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground md:flex-row md:justify-between">
        <span>© 2026 Manzil Group</span>
        <span>
          Photography:{" "}
          {photoCredits.map((p, i) => (
            <span key={p.source}>
              {i > 0 && " · "}
              <a href={p.source} className="underline underline-offset-2 hover:text-foreground">
                {p.subject}
              </a>{" "}
              by {p.author},{" "}
              <a href={p.licenseUrl} className="underline underline-offset-2 hover:text-foreground">
                {p.license}
              </a>
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
