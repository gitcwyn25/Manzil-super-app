import * as Sentry from "@sentry/nextjs";

/**
 * Server-side (Node runtime) Sentry config. Loaded from `instrumentation.ts`.
 *
 * A missing DSN no-ops rather than throwing, so local development and CI builds
 * run without Sentry credentials.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Server-rendered requests carry Clerk session cookies; never forward them.
    sendDefaultPii: false
  });
}
