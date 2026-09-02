import { db } from '@/src/lib/db';

/**
 * Whether `tableId` cannot currently be scanned for ordering because a
 * confirmed reservation is starting within `bufferMinutes`.
 *
 * The block only looks *forward* in time (now <= reservation.startsAt <=
 * now + bufferMinutes), matching the manager's mental model: "don't let
 * walk-ins seat themselves at a table we're about to need for a booking."
 * Once the reservation's start time has passed, the block clears on its
 * own — staff take over from there.
 */
export async function isTableReservationBlocked(
  restaurantId: string,
  tableId: string,
  bufferMinutes: number,
  now: Date = new Date()
): Promise<boolean> {
  if (!bufferMinutes || bufferMinutes <= 0) {
    return false;
  }

  const windowEnd = new Date(now.getTime() + bufferMinutes * 60000);

  const blocking = await db.reservation.findFirst({
    where: {
      restaurantId,
      tableId,
      status: 'CONFIRMED',
      startsAt: { gt: now, lte: windowEnd },
    },
    select: { id: true },
  });

  return Boolean(blocking);
}

/**
 * Tables a customer could be redirected to when their own table is
 * reservation-blocked: active tables that are neither reservation-blocked
 * themselves nor currently hosting an active party.
 */
export async function listAvailableTables(
  restaurantId: string,
  bufferMinutes: number,
  excludeTableId?: string
): Promise<{ id: string; label: string }[]> {
  const now = new Date();

  const tables = await db.table.findMany({
    where: {
      restaurantId,
      isActive: true,
      ...(excludeTableId ? { id: { not: excludeTableId } } : {}),
    },
    select: { id: true, label: true },
    orderBy: { label: 'asc' },
  });

  const results: { id: string; label: string }[] = [];

  for (const table of tables) {
    const blocked = await isTableReservationBlocked(
      restaurantId,
      table.id,
      bufferMinutes,
      now
    );

    if (blocked) {
      continue;
    }

    const session = await db.customerSession.findFirst({
      where: { restaurantId, tableId: table.id },
      orderBy: { createdAt: 'desc' },
      select: {
        paidAt: true,
        orders: {
          where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
          select: { id: true, paidAt: true },
        },
      },
    });

    if (!session) {
      results.push(table);
      continue;
    }

    const activeOrders = session.orders.filter((order) => order.paidAt === null);
    const isFreeAgain = session.paidAt !== null || activeOrders.length === 0;

    if (isFreeAgain) {
      results.push(table);
    }
  }

  return results;
}
