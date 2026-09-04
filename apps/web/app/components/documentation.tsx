import type { Locale } from "@manzil/shared";
import Link from "next/link";
import type { ReactNode } from "react";
import { docGroups, docMarkdown, docs, type DocId } from "../lib/docs";

const notice: Record<Locale, string> = {
  uz: "Loyiha — nashrdan oldin malakali O‘zbekiston yuristi ko‘rib chiqishi kerak.",
  ru: "Черновик — документ должен быть рассмотрен квалифицированным юристом Узбекистана до публикации.",
  en: "Draft — this document must be reviewed by qualified Uzbekistan counsel before publication."
};

const copy: Record<Locale, {
  hub: string;
  overview: string;
  company: string;
  trust: string;
  business: string;
  updated: string;
  onThisPage: string;
  back: string;
  read: string;
  status: string;
  draftNote: string;
  allDocs: string;
}> = {
  uz: {
    hub: "Hujjatlar",
    overview: "Umumiy ko‘rinish",
    company: "Kompaniya",
    trust: "Ishonch va huquqiy",
    business: "Bizneslar uchun",
    updated: "Oxirgi yangilanish",
    onThisPage: "Sahifada",
    back: "Hujjatlarga qaytish",
    read: "O‘qish",
    status: "Draft workspace",
    draftNote: "Huquqiy hujjatlar hozircha draft holatida. Nashrdan oldin yuridik shaxs ma’lumotlari va amaldagi ma’lumotlar oqimi yurist bilan tekshiriladi.",
    allDocs: "Barcha hujjatlar"
  },
  ru: {
    hub: "Документация",
    overview: "Обзор",
    company: "Компания",
    trust: "Доверие и право",
    business: "Для бизнеса",
    updated: "Последнее обновление",
    onThisPage: "На этой странице",
    back: "Вернуться к документации",
    read: "Читать",
    status: "Draft workspace",
    draftNote: "Юридические документы пока находятся в статусе черновиков. До публикации юридические данные и фактические потоки данных будут проверены с юристом.",
    allDocs: "Все документы"
  },
  en: {
    hub: "Documentation",
    overview: "Overview",
    company: "Company",
    trust: "Trust & Legal",
    business: "For Businesses",
    updated: "Last updated",
    onThisPage: "On this page",
    back: "Back to documentation",
    read: "Read",
    status: "Draft workspace",
    draftNote: "Legal documents are currently drafts. Before publication, the legal entity details and actual data flows will be checked with counsel.",
    allDocs: "All documents"
  }
};

function localizedDocumentLabel(href: string, fallback: string, locale: Locale) {
  const path = href.replace(/^\/(uz|ru|en)(?=\/|$)/, "");
  const document = (Object.keys(docs) as DocId[]).find((id) => docs[id].path === path);
  return document ? docs[document].title[locale] : fallback;
}

function plainHeading(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function headingId(text: string) {
  return plainHeading(text)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function articleHeadings(source: string) {
  return source.split(/\r?\n/).flatMap((line) => {
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) return [];
    return [{ level: match[1].length, id: headingId(match[2]), label: plainHeading(match[2]) }];
  });
}

function inlineContent(text: string, locale: Locale): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^\)]+)\)$/.exec(part);
    if (link) {
      const href = link[2].replace(/^\/(uz|ru|en)(?=\/|$)/, `/${locale}`);
      return <Link href={href} key={`${part}-${index}`}>{localizedDocumentLabel(link[2], link[1], locale)}</Link>;
    }
    const strong = /^\*\*([^*]+)\*\*$/.exec(part);
    if (strong) return <strong key={`${part}-${index}`}>{strong[1]}</strong>;
    const italic = /^\*([^*]+)\*$/.exec(part);
    if (italic) return <em key={`${part}-${index}`}>{italic[1]}</em>;
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function markdown(source: string, locale: Locale) {
  const lines = source.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].replace(/^\uFEFF/, "");
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3";
      nodes.push(<Tag id={headingId(heading[2])} key={`heading-${index}`}>{inlineContent(heading[2], locale)}</Tag>);
      index += 1;
      continue;
    }

    if (/^> /.test(line)) {
      nodes.push(<blockquote key={`quote-${index}`}>{inlineContent(line.slice(2), locale)}</blockquote>);
      index += 1;
      continue;
    }

    if (/^(?:[-*] |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: ReactNode[] = [];
      while (index < lines.length && (ordered ? /^\d+\. /.test(lines[index]) : /^[-*] /.test(lines[index]))) {
        items.push(<li key={`item-${index}`}>{inlineContent(lines[index].replace(ordered ? /^\d+\. / : /^[-*] /, ""), locale)}</li>);
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      nodes.push(<List key={`list-${index}`}>{items}</List>);
      continue;
    }

    nodes.push(<p key={`paragraph-${index}`}>{inlineContent(line, locale)}</p>);
    index += 1;
  }

  return nodes;
}

function businessLinks(locale: Locale) {
  return [
    { href: `/${locale}/business/register`, label: locale === "uz" ? "Biznesni qo‘shish" : locale === "ru" ? "Добавить бизнес" : "Add a business" },
    { href: `/${locale}/dashboard`, label: locale === "uz" ? "Biznes kabineti" : locale === "ru" ? "Кабинет бизнеса" : "Business dashboard" },
    { href: `/${locale}/contact`, label: locale === "uz" ? "Noto‘g‘ri ma’lumot haqida xabar berish" : locale === "ru" ? "Сообщить о неверной информации" : "Report incorrect information" }
  ];
}

function DocsSidebar({ locale, activeId }: { locale: Locale; activeId: DocId | "hub" }) {
  const t = copy[locale];
  const groups: Array<{ label: string; ids: DocId[] }> = [
    { label: t.company, ids: ["about", "founders", "contact", "trust"] },
    { label: t.trust, ids: ["terms", "privacy", "cookies", "reviews", "ai-transparency"] }
  ];

  return (
    <aside className="docs-sidebar" aria-label={t.hub}>
      <div className="docs-sidebar__label">{t.hub}</div>
      <nav className="docs-sidebar__nav">
        <Link className={activeId === "hub" ? "is-active" : undefined} href={`/${locale}/docs`} aria-current={activeId === "hub" ? "page" : undefined}>{t.overview}</Link>
        {groups.map((group) => (
          <div className="docs-sidebar__group" key={group.label}>
            <span>{group.label}</span>
            {group.ids.map((id) => <Link className={activeId === id ? "is-active" : undefined} href={`/${locale}${docs[id].path}`} aria-current={activeId === id ? "page" : undefined} key={id}>{docs[id].title[locale]}</Link>)}
          </div>
        ))}
        <div className="docs-sidebar__group">
          <span>{t.business}</span>
          <Link href={`/${locale}/business/register`}>{businessLinks(locale)[0].label}</Link>
          <Link href={`/${locale}/business`}>{locale === "uz" ? "Biznes sahifasi" : locale === "ru" ? "Страница для бизнеса" : "Business overview"}</Link>
        </div>
      </nav>
      <div className="docs-sidebar__footer">
        <span>{t.status}</span>
        <div className="docs-sidebar__languages">
          {["uz", "ru", "en"].map((item) => <Link href={`/${item}/docs`} key={item}>{item.toUpperCase()}</Link>)}
        </div>
      </div>
    </aside>
  );
}

function HubToc({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <aside className="docs-toc" aria-label={t.onThisPage}>
      <span>{t.onThisPage}</span>
      <a href="#company">{t.company}</a>
      <a href="#trust-legal">{t.trust}</a>
      <a href="#for-businesses">{t.business}</a>
    </aside>
  );
}

function ArticleToc({ id, locale }: { id: DocId; locale: Locale }) {
  const t = copy[locale];
  const headings = articleHeadings(docMarkdown(id, locale));
  return (
    <aside className="docs-toc docs-article-toc" aria-label={t.onThisPage}>
      <span>{t.onThisPage}</span>
      <Link href={`/${locale}/docs`}>← {t.allDocs}</Link>
      <span className="docs-toc__rule" />
      {headings.map((heading) => (
        <a className={`docs-toc__heading docs-toc__heading--${heading.level}`} href={`#${heading.id}`} key={heading.id}>
          {heading.label}
        </a>
      ))}
    </aside>
  );
}

export function DocumentationHub({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const totalDocs = Object.keys(docs).length;

  return (
    <section className="docs-page docs-hub">
      <div className="docs-shell">
        <DocsSidebar locale={locale} activeId="hub" />
        <main className="docs-main">
          <header className="docs-hero">
            <div className="docs-hero__topline">
              <span className="docs-eyebrow">Manzil / {t.hub}</span>
              <span className="docs-status"><i aria-hidden="true" />{t.status}</span>
            </div>
            <div className="docs-hero__copy">
              <p>{t.hub}</p>
              <h1>{locale === "uz" ? "Manzil haqida bilishingiz kerak bo‘lgan hamma narsa." : locale === "ru" ? "Всё главное о Manzil — в одном месте." : "Everything you need to know about Manzil."}</h1>
              <span>{locale === "uz" ? "Kompaniya, xizmat, ishonch va biznes bo‘yicha qisqa va aniq ma’lumotlar." : locale === "ru" ? "Короткие и понятные материалы о компании, сервисе, доверии и работе с бизнесом." : "Short, clear guidance about the company, the service, trust, and working with businesses."}</span>
            </div>
            <div className="docs-hero__footer">
              <span>{String(totalDocs).padStart(2, "0")} {locale === "uz" ? "ta hujjat" : locale === "ru" ? "документов" : "documents"}</span>
              <span className="docs-hero__line" aria-hidden="true" />
              <span>{locale === "uz" ? "3 til" : locale === "ru" ? "3 языка" : "3 languages"}</span>
            </div>
          </header>

          <section className="docs-highlight" aria-label={locale === "uz" ? "Manzil tamoyili" : locale === "ru" ? "Принцип Manzil" : "Manzil principle"}>
            <p className="docs-highlight__text">
              {locale === "uz" ? "Mahalliy joylarni topishdan tortib, biznes ishonchini tekshirishgacha — Manzil aniqroq yo‘l ko‘rsatadi." : locale === "ru" ? "От поиска мест до доверия к бизнесу — Manzil помогает выбирать увереннее." : "From finding local places to trusting local businesses, Manzil helps you choose with more confidence."}
            </p>
          </section>

          <div className="docs-groups">
            {docGroups.map((group, groupIndex) => {
              const id = groupIndex === 0 ? "company" : groupIndex === 1 ? "trust-legal" : "for-businesses";
              return (
                <section className={`docs-group docs-group--${groupIndex + 1}`} id={id} key={group.title.en}>
                  <div className="docs-group__heading">
                    <span className="docs-group__number">0{groupIndex + 1}</span>
                    <h2>{group.title[locale]}</h2>
                  </div>
                  {group.ids.length ? (
                    <div className="docs-grid">
                      {group.ids.map((docId) => (
                        <Link className={`docs-card${docId === "ai-transparency" ? " docs-card--accent" : ""}`} href={`/${locale}${docs[docId].path}`} key={docId}>
                          <span className="docs-card__arrow" aria-hidden="true">↗</span>
                          <h3>{docs[docId].title[locale]}</h3>
                          <p>{docs[docId].description[locale]}</p>
                          <span className="docs-card__read">{t.read}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="docs-business-links">
                      {businessLinks(locale).map((link) => <Link href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></Link>)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <aside className="docs-hub-note">
            <span className="docs-hub-note__mark" aria-hidden="true">i</span>
            <p>{t.draftNote}</p>
          </aside>
        </main>
        <HubToc locale={locale} />
      </div>
    </section>
  );
}

export function DocumentationPage({ id, locale }: { id: DocId; locale: Locale }) {
  const doc = docs[id];
  const t = copy[locale];
  const content = docMarkdown(id, locale);

  return (
    <article className="docs-page docs-article">
      <div className="docs-shell">
        <DocsSidebar locale={locale} activeId={id} />
        <main className="docs-main docs-article-main">
          <nav className="docs-breadcrumb" aria-label={t.hub}>
            <Link href={`/${locale}`}>Manzil</Link><span aria-hidden="true">/</span><Link href={`/${locale}/docs`}>{t.hub}</Link><span aria-hidden="true">/</span><span>{doc.title[locale]}</span>
          </nav>
          <header className="docs-article__head">
            <div className="docs-article__eyebrow">{doc.legal ? "TRUST & LEGAL" : "MANZIL"}</div>
            <h1>{doc.title[locale]}</h1>
            <div className="docs-article__lead">
              <p>{doc.description[locale]}</p>
            </div>
            <div className="docs-language" aria-label="Language versions">
              {["uz", "ru", "en"].map((item) => <Link aria-current={item === locale ? "page" : undefined} href={`/${item}${doc.path}`} key={item}>{item.toUpperCase()}</Link>)}
            </div>
            {doc.legal && <p className="docs-notice">{notice[locale]}</p>}
            <small>{t.updated}: 2 September 2026</small>
          </header>
          <div className="docs-article__content">{markdown(content, locale)}</div>
          <Link className="docs-back" href={`/${locale}/docs`}>← {t.back}</Link>
        </main>
        <ArticleToc id={id} locale={locale} />
      </div>
    </article>
  );
}
