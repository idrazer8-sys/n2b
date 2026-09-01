import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

import { db } from './db';

const STAFF_COOKIE = 'staff_session';

export type Portal =
  | 'MANAGER'
  | 'WAITER'
  | 'KITCHEN';

const ROLE_RANK = {
  STAFF: 0,
  MANAGER: 1,
  OWNER: 2,
} as const;

const secret = () =>
  new TextEncoder().encode(
    requireEnv('AUTH_SECRET')
  );

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required env var: ${name}`
    );
  }

  return value;
}

export async function hashPassword(
  password: string
) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

export async function createStaffSession(
  userId: string,
  portal: Portal = 'MANAGER'
) {
  const token = await new SignJWT({
    sub: userId,
    portal,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret());

  cookies().set(
    STAFF_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    }
  );
}

export function clearStaffSession() {
  cookies().set(
    STAFF_COOKIE,
    '',
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }
  );
}

export async function getCurrentSession() {
  const token =
    cookies().get(
      STAFF_COOKIE
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        secret()
      );

    const userId =
      typeof payload.sub ===
      'string'
        ? payload.sub
        : null;

    if (!userId) {
      return null;
    }

    const rawPortal =
      payload.portal;

    const portal: Portal =
      rawPortal === 'WAITER' ||
      rawPortal === 'KITCHEN'
        ? rawPortal
        : 'MANAGER';

    const user =
      await db.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      return null;
    }

    return {
      user,
      portal,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session =
    await getCurrentSession();

  return session?.user ?? null;
}

type AccessOptions = {
  skipMembershipCheck?: boolean;
};

export async function requireRestaurantAccess(
  restaurantId: string,
  minRole:
    keyof typeof ROLE_RANK = 'STAFF',
  options?: AccessOptions
) {
  const session =
    await getCurrentSession();

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      message:
        'Not authenticated',
    };
  }

  const membership =
    await db.restaurantStaff.findUnique({
      where: {
        userId_restaurantId: {
          userId:
            session.user.id,
          restaurantId,
        },
      },
    });

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      message:
        'Not authorized for this restaurant',
    };
  }

  /*
   * Archived staff accounts lose access immediately.
   *
   * Managers/Owners created before the archive system
   * also have isActive=true by default.
   */
  if (!membership.isActive) {
    return {
      ok: false as const,
      status: 403,
      message:
        'This staff account is archived',
    };
  }

  if (
    ROLE_RANK[
      membership.role
    ] <
    ROLE_RANK[minRole]
  ) {
    return {
      ok: false as const,
      status: 403,
      message:
        'Not authorized for this restaurant',
    };
  }

  if (!options?.skipMembershipCheck) {
    const membershipCheck =
      await checkMembershipActive(
        restaurantId
      );

    if (!membershipCheck.ok) {
      return membershipCheck;
    }
  }

  return {
    ok: true as const,
    user:
      session.user,
    role:
      membership.role,
    membership,
  };
}

/**
 * A restaurant only has usable dashboard/portal access while its
 * platform membership is TRIALING or ACTIVE. This is checked here
 * (rather than per-route) since requireRestaurantAccess and
 * requireRestaurantPortalAccess are the only two gates every
 * protected route funnels through — customer-facing routes never
 * call either of these.
 */
async function checkMembershipActive(
  restaurantId: string
) {
  const membership =
    await db.membership.findUnique({
      where: { restaurantId },
    });

  if (
    !membership ||
    !['TRIALING', 'ACTIVE'].includes(
      membership.status
    )
  ) {
    return {
      ok: false as const,
      status: 402,
      message:
        'This restaurant does not have an active membership',
    };
  }

  return { ok: true as const };
}

/**
 * Server-side helper for APIs that belong to
 * a specific application portal.
 *
 * It checks:
 * - authenticated user
 * - active membership
 * - restaurant
 * - requested portal
 * - minimum role
 */
export async function requireRestaurantPortalAccess(
  restaurantId: string,
  portal: Portal,
  minRole:
    keyof typeof ROLE_RANK = 'STAFF',
  options?: AccessOptions
) {
  const session =
    await getCurrentSession();

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      message:
        'Not authenticated',
    };
  }

  const membership =
    await db.restaurantStaff.findUnique({
      where: {
        userId_restaurantId: {
          userId:
            session.user.id,
          restaurantId,
        },
      },
    });

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      message:
        'Not authorized for this restaurant',
    };
  }

  if (!membership.isActive) {
    return {
      ok: false as const,
      status: 403,
      message:
        'This staff account is archived',
    };
  }

  if (
    ROLE_RANK[
      membership.role
    ] <
    ROLE_RANK[minRole]
  ) {
    return {
      ok: false as const,
      status: 403,
      message:
        'Not authorized for this restaurant',
    };
  }

  /*
   * IMPORTANT:
   *
   * Portal authorization is derived from RestaurantStaff
   * (the database), never from the "portal" claim baked into
   * the session cookie at login time.
   *
   * - OWNER/MANAGER can enter ANY portal (Manager, Kitchen,
   *   Waiter) using the SAME session, without logging in again.
   * - STAFF can only enter the single portal configured for
   *   their account (membership.staffPortal).
   *
   * This is what lets a single login screen work for everyone,
   * while still enforcing real authorization server-side.
   */
  const allowedPortal =
    membership.role === 'OWNER' ||
    membership.role === 'MANAGER' ||
    membership.staffPortal === portal;

  if (!allowedPortal) {
    return {
      ok: false as const,
      status: 403,
      message:
        'Wrong portal',
    };
  }

  if (!options?.skipMembershipCheck) {
    const membershipCheck =
      await checkMembershipActive(
        restaurantId
      );

    if (!membershipCheck.ok) {
      return membershipCheck;
    }
  }

  return {
    ok: true as const,
    user:
      session.user,
    role:
      membership.role,
    portal,
    membership,
  };
}

/*
 * Very small platform-admin gate for internal tools (e.g. the support
 * escalation inbox at /admin/support). No new role/model — just an
 * allowlist of emails from an env var, checked against the logged-in
 * user. Not tied to any specific restaurant.
 */
export async function requirePlatformAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      message: 'Not authenticated',
    };
  }

  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.includes(user.email.toLowerCase())) {
    return {
      ok: false as const,
      status: 403,
      message: 'Not authorized',
    };
  }

  return {
    ok: true as const,
    user,
  };
}
