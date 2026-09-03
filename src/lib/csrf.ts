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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true; // fail open only in a misconfigured env, never crash a request over this

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(appUrl).origin;
  } catch {
    return true;
  }

  const origin = req.headers.get('origin');
  if (origin) return origin === expectedOrigin;

  const referer = req.headers.get('referer');
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
