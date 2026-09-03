// Stub for the `server-only` package (aliased in vitest.config.ts).
//
// The real package's only job is to throw at build time if it's ever
// bundled into client code — a guard against importing server-side modules
// (this app's pricing engine, auth, Stripe helpers, etc.) into the browser.
// It has nothing to check in a Vitest run: tests execute in plain Node,
// there is no client/server bundle split to police. Aliasing it to this
// empty module is what lets tests import real modules like
// src/lib/pricing.ts directly instead of re-implementing their logic.
export {};
