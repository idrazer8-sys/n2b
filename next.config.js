/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Stripe is only ever reached via a full-page redirect to Stripe's own
// hosted Checkout/Billing Portal pages (window.location = checkoutUrl) —
// there is no embedded Stripe.js, Elements iframe, or client-side fetch to
// stripe.com anywhere in this app (verified via grep before writing this).
// A top-level navigation isn't governed by CSP at all, so the policy below
// doesn't need to allowlist stripe.com for that redirect to keep working.
//
// script-src needs 'unsafe-inline' because Next.js App Router injects
// inline hydration/streaming bootstrap scripts with no src attribute.
// The alternative — per-request CSP nonces — is deliberately NOT used here:
// this app is pinned to Next.js 14.2.35, which has a known nonce-handling
// XSS advisory (GHSA-ffhc-5mcf-pf4q) for exactly that setup. Revisit this
// once the Next.js major version is upgraded past that advisory.
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  // Restaurant logo/cover images are user-supplied URLs on arbitrary
  // https hosts (see images.remotePatterns below), so img-src can't be
  // pinned to a fixed allowlist.
  `img-src 'self' https: data:`,
  // Sentry's error/performance ingest — only ever contacted if SENTRY_DSN /
  // NEXT_PUBLIC_SENTRY_DSN are actually configured; harmless to allow when
  // they aren't, since nothing calls out to these hosts in that case.
  `connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io${
    isProd ? '' : ' ws://localhost:* http://localhost:*'
  }`,
  `frame-src 'none'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  // frame-ancestors above already blocks framing in modern browsers;
  // X-Frame-Options is kept as a fallback for older ones.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  // Ignored by browsers over plain HTTP (local dev), so safe to always send.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    // Required on this Next.js version for instrumentation.ts (Sentry's
    // server/edge init hook, and onRequestError) to actually run — it
    // defaults to off here, unlike newer Next.js versions where it's
    // stable. Revisit removing this explicit flag after a Next.js upgrade.
    instrumentationHook: true,
    // pdfkit loads its standard-font .afm data files at runtime via
    // fs.readFileSync(path.join(__dirname, ...)) — letting webpack bundle
    // it (the default) breaks that relative lookup. Keeping it external
    // makes the PDF financial report export work under Vercel's Node.js
    // runtime.
    serverComponentsExternalPackages: ['pdfkit'],
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

// Wrapping is safe even with zero Sentry env vars configured: without
// SENTRY_AUTH_TOKEN the plugin skips source-map upload (with a console
// warning, not a build failure) and the app just runs as if unwrapped.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  // This app's Stripe webhook and other API routes are Node.js Route
  // Handlers, not Vercel Cron — nothing here needs the wizard's default
  // tunneling/monitoring extras.
  automaticVercelMonitors: false,
});
