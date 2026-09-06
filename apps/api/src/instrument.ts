import * as Sentry from "@sentry/nestjs";
import type { ErrorEvent } from "@sentry/nestjs";

/**
 * Sentry initialisation.
 *
 * Must run before any instrumented module (express, prisma, ioredis) is
 * imported — Sentry patches those modules at require time, so initialising
 * after they load produces a silently degraded SDK with no traces. `main.ts`
 * therefore imports this file before anything else.
 *
 * A missing DSN is not an error: local development and CI run without one, and
 * the SDK no-ops cleanly rather than failing the boot.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    release: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.SENTRY_RELEASE,

    // Sample rather than capture everything: traces are billed per event, and
    // Manzil's traffic does not need 100% to spot a regression.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),

    // Never ship request bodies or headers to a third party by default. Bodies
    // here contain phone numbers, addresses, and Clerk tokens.
    sendDefaultPii: false,

    beforeSend(event: ErrorEvent) {
      // Defence in depth: strip credential-bearing headers even if a future
      // integration starts attaching them.
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-manzil-user-id"];
        delete event.request.headers["x-manzil-role"];
      }

      return event;
    },

    ignoreErrors: [
      // Rate-limit rejections are an expected, healthy response — alerting on
      // them would bury real errors under attacker-generated noise.
      "ThrottlerException: Too Many Requests"
    ]
  });
}
