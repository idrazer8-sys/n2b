import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  jwtVerify,
} from 'jose';

const STAFF_COOKIE =
  'staff_session';

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? ''
  );

async function getPortal(
  request: NextRequest
) {
  const token =
    request.cookies.get(
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

    const portal =
      payload.portal;

    if (
      portal === 'WAITER' ||
      portal === 'KITCHEN' ||
      portal === 'MANAGER'
    ) {
      return portal;
    }

    return null;
  } catch {
    return null;
  }
}

export async function middleware(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  const waiterMatch =
    pathname.match(
      /^\/staff\/([^/]+)$/
    );

  const waiterTablesMatch =
    pathname.match(
      /^\/staff\/([^/]+)\/tables$/
    );

  const kitchenMatch =
    pathname.match(
      /^\/kitchen\/([^/]+)$/
    );

  const kitchenLogin =
    pathname.match(
      /^\/kitchen\/([^/]+)\/login$/
    );

  const waiterLogin =
    pathname.match(
      /^\/staff\/([^/]+)\/login$/
    );

  if (
    waiterLogin ||
    kitchenLogin
  ) {
    return NextResponse.next();
  }

  if (
    waiterMatch ||
    waiterTablesMatch
  ) {
    const restaurantId =
      waiterMatch?.[1] ??
      waiterTablesMatch?.[1];

    const portal =
      await getPortal(
        request
      );

    /*
     * OWNER/MANAGER share ONE login with every other role and
     * must be able to enter Waiter without signing in again, so
     * a MANAGER-portal session is accepted here too. Real
     * authorization (which restaurant, which role) is always
     * re-checked server-side via requireRestaurantAccess /
     * requireRestaurantPortalAccess against the database.
     */
    if (
      portal !== 'WAITER' &&
      portal !== 'MANAGER'
    ) {
      const url =
        new URL(
          '/login',
          request.url
        );

      return NextResponse.redirect(
        url
      );
    }
  }

  if (kitchenMatch) {
    const restaurantId =
      kitchenMatch[1];

    const portal =
      await getPortal(
        request
      );

    /*
     * Same reasoning as the Waiter check above: MANAGER/OWNER
     * can open Kitchen with the same session they used to log
     * into the dashboard.
     */
    if (
      portal !== 'KITCHEN' &&
      portal !== 'MANAGER'
    ) {
      const url =
        new URL(
          '/login',
          request.url
        );

      return NextResponse.redirect(
        url
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/staff/:path*',
    '/kitchen/:path*',
  ],
};