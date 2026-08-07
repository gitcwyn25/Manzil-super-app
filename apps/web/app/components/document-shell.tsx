import { defaultLocale, type Locale } from "@manzil/shared";
import { fontVariables } from "../fonts";
import { MotionProvider } from "./motion/motion-provider";
import { ServiceWorkerRegistration } from "./service-worker";

/**
 * The `<html>` / `<body>` document.
 *
 * This used to live in `app/layout.tsx`, which has no locale segment, so it
 * hard-coded `lang="uz"` and an inline script rewrote `documentElement.lang`
 * after parse. The consequence measured in production: `/ru` and `/en` were
 * served to crawlers and to assistive technology as Uzbek, and the correction
 * only ever existed for visitors who run JavaScript.
 *
 * Moving the document here — rendered by `app/[locale]/layout.tsx`, which does
 * know the locale — makes `lang` correct in the SSR HTML itself. The root
 * layout is now a pass-through, so the two documents that live outside the
 * locale segment (the offline fallback and the root 404) render this shell
 * directly.
 */
export function DocumentShell({
  children,
  lang = defaultLocale
}: {
  children: React.ReactNode;
  lang?: Locale;
}) {
  return (
    <html className={fontVariables} lang={lang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Progressive enhancement gate: reveal start-states apply only when
            JS is present, so content is never hidden for no-JS / crawlers. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {/* Safety net for the JS-disabled path: Framer Motion inlines the
            hidden start-state (opacity:0) during SSR, so without this a
            no-JS visitor or a non-executing crawler would see blank reveals.
            `!important` beats the inline style; only rendered when JS is off. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1 !important;transform:none !important;filter:none !important}"}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
