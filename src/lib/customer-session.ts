import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

// A CustomerSession is how we tell "which customer at table 7" apart from
// "which customer at table 12" WITHOUT ever asking for an account. It's a
// signed cookie, scoped to one restaurant+table, that the browser holds for
// the duration of the visit (12h). No PII is stored in it.
const COOKIE_PREFIX = 'cust_session_';
const SESSION_TTL_HOURS = 12;

const secret = () => new TextEncoder().encode(requireEnv('CUSTOMER_SESSION_SECRET'));

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// One cookie per restaurant (not global) so a customer who visits two
// different restaurants in our system doesn't get sessions confused, and so
// a stale cookie from restaurant A is never presented as identity at
// restaurant B.
function cookieName(restaurantId: string) {
  return `${COOKIE_PREFIX}${restaurantId}`;
}

export async function getOrCreateCustomerSession(restaurantId: string, tableId: string) {
  const existingToken = cookies().get(cookieName(restaurantId))?.value;

  if (existingToken) {
    try {
      const { payload } = await jwtVerify(existingToken, secret());
      const sessionId = payload.sid as string;
      const session = await db.customerSession.findUnique({ where: { id: sessionId } });
      // Reuse the existing session only if it's still valid AND for the
      // SAME table — walking to a different table starts a fresh session.
      if (
        session &&
        session.tableId === tableId &&
        session.expiresAt > new Date() &&
        !session.paidAt
      ) {
        return session;
      }
    } catch {
      // fall through to create a new one
    }
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  const session = await db.customerSession.create({
    data: { restaurantId, tableId, expiresAt },
  });

  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_HOURS}h`)
    .sign(secret());

  cookies().set(cookieName(restaurantId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });

  return session;
}

// Verifies a customer session belongs to the restaurant/table it claims —
// used by order-status and checkout endpoints so a customer session minted
// at table 3 can't be replayed to view or pay for table 9's orders.
export async function verifyCustomerSession(
  restaurantId: string,
  token: string | undefined
): Promise<{ id: string; tableId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const sessionId = payload.sid as string;
    const session = await db.customerSession.findUnique({ where: { id: sessionId } });
    if (!session || session.restaurantId !== restaurantId || session.expiresAt < new Date()) {
      return null;
    }
    return { id: session.id, tableId: session.tableId };
  } catch {
    return null;
  }
}

export function readSessionTokenFromCookies(restaurantId: string) {
  return cookies().get(cookieName(restaurantId))?.value;
}
