/**
 * Sentry configuration for error monitoring.
 * Initialized in the browser (client) only.
 */

import * as Sentry from "@sentry/nextjs";

export function register(): void {
  if (typeof window === "undefined") return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],
  });
}
