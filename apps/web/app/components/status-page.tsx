import { defaultLocale, type Locale } from "@manzil/shared";
import Link from "next/link";

/**
 * Shared layout for the 404 and 500 pages.
 *
 * Both used to be Next's unstyled defaults. A crash page that looks like the
 * product — and offers a way back into it — is the difference between "the
 * site is broken" and "that page isn't there".
 *
 * Trilingual copy is inlined rather than read from `getUiCopy`: these pages
 * render in situations where the locale segment may not have matched at all
 * (root 404) or where a data layer just failed (500), so they must not depend
 * on anything that can itself throw.
 */

type StatusCopy = { code: string; title: string; body: string; action: string };

export const NOT_FOUND_COPY: Record<Locale, StatusCopy> = {
  uz: {
    code: "404",
    title: "Sahifa topilmadi",
    body: "Bu manzilda sahifa yo'q. U ko'chirilgan yoki havola noto'g'ri bo'lishi mumkin.",
    action: "Bosh sahifaga qaytish"
  },
  ru: {
    code: "404",
    title: "Страница не найдена",
    body: "По этому адресу страницы нет. Возможно, она перемещена или ссылка неверна.",
    action: "На главную"
  },
  en: {
    code: "404",
    title: "Page not found",
    body: "There is no page at this address. It may have moved, or the link may be wrong.",
    action: "Back to home"
  }
};

export const ERROR_COPY: Record<Locale, StatusCopy> = {
  uz: {
    code: "500",
    title: "Nimadir noto'g'ri ketdi",
    body: "Bu sahifani yuklashda xatolik yuz berdi. Qayta urinib ko'ring — muammo bizning tomonda.",
    action: "Qayta urinish"
  },
  ru: {
    code: "500",
    title: "Что-то пошло не так",
    body: "Не удалось загрузить страницу. Попробуйте ещё раз — проблема на нашей стороне.",
    action: "Повторить"
  },
  en: {
    code: "500",
    title: "Something went wrong",
    body: "This page failed to load. Try again — the problem is on our side.",
    action: "Try again"
  }
};

export function StatusPage({
  copy,
  locale = defaultLocale,
  action
}: {
  copy: StatusCopy;
  locale?: Locale;
  /** A retry button for error boundaries; the 404 links home instead. */
  action?: React.ReactNode;
}) {
  return (
    <main className="section-block container" style={{ textAlign: "center", paddingBlock: "6rem" }}>
      <p className="section-kicker" style={{ letterSpacing: "0.18em" }}>
        {copy.code}
      </p>
      <h1 className="display-4" style={{ marginBottom: "0.75rem" }}>
        {copy.title}
      </h1>
      <p style={{ margin: "0 auto 2rem", maxWidth: "46ch" }}>{copy.body}</p>
      {action ?? (
        <Link className="btn btn-primary vm-cta" href={`/${locale}`}>
          {copy.action}
        </Link>
      )}
    </main>
  );
}
