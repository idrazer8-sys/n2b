// Edge-runtime Sentry init — covers middleware.ts, which runs on the Edge
// runtime rather than Node.js and so can't share sentry.server.config.ts
// (which uses Node-only APIs transitively through the SDK's Node
// integrations).
//
// Loaded via instrumentation.ts's register() hook.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
});
