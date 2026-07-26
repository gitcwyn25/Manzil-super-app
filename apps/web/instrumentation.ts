import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Runs once per runtime before the app handles
 * traffic, and is the supported place to initialise Sentry on the server —
 * the Node and Edge runtimes are separate processes and each needs its own init.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Captures errors thrown inside React Server Components and route handlers.
 * Without this, server-side render failures surface as a generic 500 to the
 * user and nothing at all in Sentry.
 */
export const onRequestError = Sentry.captureRequestError;
