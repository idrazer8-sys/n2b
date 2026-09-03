// Client-side (browser) Sentry init — the current Next.js/Sentry
// convention file name (replaces the older sentry.client.config.ts, which
// @sentry/nextjs now warns is deprecated). Auto-loaded by the Sentry
// webpack plugin wired up in next.config.js; nothing else needs to import
// this file.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
