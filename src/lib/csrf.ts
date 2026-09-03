import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

// Every session cookie in this app (staff and customer) is already
// SameSite=Lax, which browsers refuse to attach to a cross-site fetch/XHR
// POST — that alone blocks the classic "attacker page silently POSTs to our
// API using the victim's cookies" CSRF attack. This is a defense-in-depth
// layer on top of that: for state-changing requests, confirm the Origin (or,
// failing that, Referer) header actually points at this app, so a request
// that somehow *does* carry the cookie (an older browser, a SameSite
// misconfiguration, a same-site-but-different-app subdomain) still gets
// rejected if it didn't originate from our own frontend.
//
// Deliberately permissive when both headers are absent — some proxies and
// privacy tools strip them from legitimate same-origin requests, and this
// check is a backstop behind SameSite, not the primary defense.
export function verifySameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Outside production, accept any localhost/127.0.0.1 origin regardless of
  // port. NEXT_PUBLIC_APP_URL is a single fixed value, but a local dev
  // server's actual port varies (default 3000, but this project's own
  // .env happens to say 3001, someone might run --port 3005, etc.) — CSRF
  // Origin-checking is a production concern (a real attacker's page vs.
  // this app's real domain); it has nothing meaningful to protect against
  // on a developer's own machine, where the friction of a port mismatch
  // outweighs the near-zero local risk.
  if (process.env.NODE_ENV !== 'production') {
    const candidate = origin || referer;
    if (!candidate) return true;
    try {
      const { hostname } = new URL(candidate);
      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    } catch {
      // fall through to the strict check below
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true; // fail open only in a misconfigured env, never crash a request over this

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(appUrl).origin;
  } catch {
    return true;
  }

  if (origin) return origin === expectedOrigin;

  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

export function crossOriginRejection() {
  return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
}
