import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { getOrCreateCustomerSession } from '@/src/lib/customer-session';
import { isTableReservationBlocked, listAvailableTables } from '@/src/lib/reservations';
import { rateLimit, clientIp } from '@/src/lib/rate-limit';

// Public, unauthenticated endpoint — this is what the customer's browser
// calls after tapping the NFC tag / scanning the QR code. Requires a valid
// table token (?t=) scoped to this exact restaurant slug; an unknown or
// foreign-restaurant token is rejected rather than silently falling back.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const ip = clientIp(req.headers);
  // Generous limit — real customers reload this on every page visit and a
  // table of several people can hit it near-simultaneously. This exists to
  // cap abuse (spamming CustomerSession rows), not to throttle normal use.
  const limited = await rateLimit(`menu:${ip}`, 120, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get('t');
  if (!token) {
    return NextResponse.json({ error: 'Missing table token' }, { status: 400 });
  }

  const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });
  if (!restaurant || !restaurant.isActive) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const table = await db.table.findUnique({ where: { token } });
  if (!table || table.restaurantId !== restaurant.id || !table.isActive) {
    return NextResponse.json({ error: 'Invalid or inactive table' }, { status: 404 });
  }

  // If a reservation is about to start at this table, block ordering until
  // staff seat the reserved party — but tell the customer which other
  // tables are free right now, so they aren't just left stuck.
  const reservationBlocked = await isTableReservationBlocked(
    restaurant.id,
    table.id,
    restaurant.reservationBufferMinutes
  );

  if (reservationBlocked) {
    const availableTables = await listAvailableTables(
      restaurant.id,
      restaurant.reservationBufferMinutes,
      table.id
    );

    return NextResponse.json(
      {
        blocked: true,
        reason: 'RESERVATION_SOON',
        table: { id: table.id, label: table.label },
        availableTables,
      },
      { status: 409 }
    );
  }

  // Mint (or reuse) this customer's session up front, so the very first
  // response already carries the cookie the cart/checkout calls will need.
  const customerSession = await getOrCreateCustomerSession(restaurant.id, table.id);

  const categories = await db.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: 'asc' },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
        include: { modifiers: { include: { options: true }, orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  return NextResponse.json({
    restaurant: {
      name: restaurant.name,
      logoUrl: restaurant.logoUrl,
      currency: restaurant.currency,
      isOpen: restaurant.isOpen,
      brandPrimaryColor: restaurant.brandPrimaryColor,
      brandFontPairing: restaurant.brandFontPairing,
      menuBackgroundUrl: restaurant.menuBackgroundUrl,
    },
    table: { id: table.id, label: table.label },
    session: { id: customerSession.id, partySize: customerSession.partySize },
    categories,
  });
}
