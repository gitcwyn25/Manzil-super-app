"use client";

import { defaultLocale, isLocale, type Locale } from "@manzil/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatePanel } from "./pxs/state-panel";

type BusinessNotFoundCopy = { title: string; body: string; action: string };

const COPY: Record<Locale, BusinessNotFoundCopy> = {
  uz: {
    title: "Bu joy topilmadi",
    body: "Biznes sahifasi o'chirilgan, ko'chirilgan yoki havola eskirgan bo'lishi mumkin.",
    action: "Joylarni qidirish"
  },
  ru: {
    title: "Это место не найдено",
    body: "Страница бизнеса могла быть удалена, перемещена или ссылка устарела.",
    action: "Искать места"
  },
  en: {
    title: "This place wasn't found",
    body: "The business page may have moved, been removed, or the link may be out of date.",
    action: "Find places"
  }
};

export function BusinessNotFound() {
  const pathname = usePathname() ?? "";
  const [, first] = pathname.split("/");
  const locale = isLocale(first) ? first : defaultLocale;
  const copy = COPY[locale];

  return (
    <main className="section-block container pxs-status-page">
      <StatePanel
        actions={
          <Link className="btn btn-primary vm-cta" href={`/${locale}/discover`}>
            {copy.action}
          </Link>
        }
        body={copy.body}
        icon="location"
        title={copy.title}
        variant="inline"
      />
    </main>
  );
}
