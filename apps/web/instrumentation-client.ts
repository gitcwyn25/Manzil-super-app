import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry. Next.js loads this automatically on the client.
 *
 * Session replay is deliberately left off: it records real users' screens, and
 * turning it on for a consumer app in Uzbekistan is a privacy decision to make
 * explicitly rather than inherit from a default.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,

    ignoreErrors: [
      // Browser-extension and network noise that is not actionable.
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Failed to fetch",
      "NetworkError when attempting to fetch resource"
    ]
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
