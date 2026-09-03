import type { Locale } from "@manzil/shared";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type DocId = "about" | "contact" | "trust" | "terms" | "privacy" | "cookies" | "reviews" | "founders";

type DocMeta = { path: string; source?: string; legal?: boolean; title: Record<Locale, string>; description: Record<Locale, string> };

export const docs: Record<DocId, DocMeta> = {
  about: { path: "/about", source: "about", title: { uz: "Manzil haqida", ru: "О Manzil", en: "About Manzil" }, description: { uz: "Manzilning maqsadi, tamoyillari va ishlash usuli.", ru: "Цель, принципы и подход Manzil.", en: "Manzil’s purpose, principles, and approach." } },
  founders: { path: "/founders", title: { uz: "Ta’sischilar", ru: "Основатели", en: "Founders" }, description: { uz: "Manzil ortidagi jamoa haqida ma’lumot.", ru: "Информация о команде Manzil.", en: "Information about the people behind Manzil." } },
  contact: { path: "/contact", source: "contact", title: { uz: "Kontaktlar", ru: "Контакты", en: "Contact Manzil" }, description: { uz: "Savollar, biznes va ma’lumotlarni tuzatish uchun aloqa kanallari.", ru: "Каналы связи для вопросов, бизнеса и исправления данных.", en: "Channels for questions, business matters, and data corrections." } },
  trust: { path: "/trust", source: "trust", title: { uz: "Ishonch markazi", ru: "Центр доверия", en: "Trust Center" }, description: { uz: "Manzil ma’lumot, sharh va AI tavsiyalarini qanday ishonchli saqlashi.", ru: "Как Manzil работает с данными, отзывами и рекомендациями AI.", en: "How Manzil handles data, reviews, and AI recommendations." } },
  terms: { path: "/legal/terms", source: "terms-of-service", legal: true, title: { uz: "Xizmatlardan foydalanish shartlari", ru: "Условия использования", en: "Terms of Service" }, description: { uz: "Manzil xizmatlaridan foydalanish shartlari loyihasi.", ru: "Проект условий использования Manzil.", en: "Draft terms for using Manzil." } },
  privacy: { path: "/legal/privacy", source: "privacy-policy", legal: true, title: { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности", en: "Privacy Policy" }, description: { uz: "Manzil shaxsiy ma’lumotlarga qanday ishlov berishini tushuntiruvchi draft.", ru: "Проект о том, как Manzil обрабатывает персональные данные.", en: "Draft explaining how Manzil handles personal data." } },
  cookies: { path: "/legal/cookies", source: "cookie-policy", legal: true, title: { uz: "Cookie siyosati", ru: "Политика cookie", en: "Cookie Policy" }, description: { uz: "Cookie va o‘xshash texnologiyalar bo‘yicha draft.", ru: "Проект о cookie и похожих технологиях.", en: "Draft policy for cookies and similar technologies." } },
  reviews: { path: "/legal/reviews", source: "community-and-reviews-policy", legal: true, title: { uz: "Sharhlar va hamjamiyat qoidalari", ru: "Правила отзывов и сообщества", en: "Reviews and Community Rules" }, description: { uz: "Halol, foydali va hurmatli sharhlar uchun qoidalar.", ru: "Правила честных, полезных и уважительных отзывов.", en: "Rules for honest, useful, and respectful reviews." } },
};

export const docGroups: Array<{ title: Record<Locale, string>; ids: DocId[] }> = [
  { title: { uz: "Kompaniya", ru: "Компания", en: "Company" }, ids: ["about", "founders", "contact", "trust"] },
  { title: { uz: "Ishonch va huquqiy", ru: "Доверие и право", en: "Trust & Legal" }, ids: ["terms", "privacy", "cookies", "reviews"] },
  { title: { uz: "Bizneslar uchun", ru: "Для бизнеса", en: "For Businesses" }, ids: [] }
];

function documentationRoot() {
  const candidates = [
    join(process.cwd(), "ceo-office", "manzil-docs"),
    join(process.cwd(), "..", "..", "ceo-office", "manzil-docs"),
    join(process.cwd(), "..", "ceo-office", "manzil-docs")
  ];
  const root = candidates.find((candidate) => existsSync(candidate));
  if (!root) throw new Error("Manzil documentation source folder was not found.");
  return root;
}

export function docMarkdown(id: DocId, locale: Locale) {
  if (id === "founders") {
    const placeholder = {
      uz: "## Ta’sischilar\n\n### [Ta’sischi 1 — ism-familiya]\n\nLavozimi va biografiyasi nashrdan oldin tasdiqlanadi.\n\n### [Ta’sischi 2 — ism-familiya]\n\nLavozimi va biografiyasi nashrdan oldin tasdiqlanadi.",
      ru: "## Основатели\n\n### [Основатель 1 — имя и фамилия]\n\nДолжность и биография будут подтверждены до публикации.\n\n### [Основатель 2 — имя и фамилия]\n\nДолжность и биография будут подтверждены до публикации.",
      en: "## Founders\n\n### [Founder 1 — full name]\n\nThe role and biography will be confirmed before publication.\n\n### [Founder 2 — full name]\n\nThe role and biography will be confirmed before publication."
    } satisfies Record<Locale, string>;
    return placeholder[locale];
  }
  const source = docs[id].source!;
  const suffix = locale === "uz" ? "" : locale;
  return readFileSync(join(documentationRoot(), suffix, `${source}.md`), "utf8");
}

export function docByPath(parts: string[]): DocId | "hub" | null {
  const path = `/${parts.join("/")}`.replace(/\/$/, "") || "/docs";
  if (path === "/docs") return "hub";
  return (Object.keys(docs) as DocId[]).find((id) => docs[id].path === path) ?? null;
}
