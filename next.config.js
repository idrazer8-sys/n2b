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
  `connect-src 'self'${isProd ? '' : ' ws://localhost:* http://localhost:*'}`,
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
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
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
module.exports = nextConfig;
