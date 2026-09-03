import * as Sentry from '@sentry/nextjs';

// Next.js's documented hook for one-time, runtime-aware startup code. Each
// serverless/edge runtime gets its own Sentry.init() (see the two config
// files below) because the SDK's Node vs. Edge integrations aren't
// interchangeable.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown while rendering (server components, route
// handlers that don't already catch-and-report themselves) — the class of
// production crash that otherwise fails silently with nothing but a
// generic 500 reaching the user.
export const onRequestError = Sentry.captureRequestError;
