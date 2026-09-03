// Server-side (Node.js runtime) Sentry init — covers API routes, the
// Stripe webhook handler, and server components/actions.
//
// Loaded via instrumentation.ts's register() hook (Next.js's documented
// entry point for this), not imported directly anywhere else.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // No DSN configured = the SDK becomes an inert no-op (this is standard
  // Sentry SDK behavior, not something coded here) — safe to always call
  // init() even before you've set up a Sentry project.
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  // Payment/webhook code paths are exactly the ones worth full fidelity on
  // when something does go wrong — the volume here is low (order events,
  // not page views), so 100% error capture costs little.
  sampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
