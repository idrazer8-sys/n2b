import { Prisma } from '@prisma/client';
import { db } from '@/src/lib/db';

/**
 * Whether booking `tableId` at `startsAt` would sit too close to another
 * CONFIRMED reservation already on that table. There's no `endsAt` on a
 * Reservation (seating duration varies too much to model), so "too close"
 * reuses the restaurant's own `reservationBufferMinutes` — the same number
 * that already governs how long before a booking the table stops taking
 * walk-in QR orders — as the minimum spacing required between two bookings
 * on the same table. Pass `excludeReservationId` when checking an edit to a
 * reservation against itself.
 */
export async function findConflictingReservation(
  restaurantId: string,
  tableId: string,
  startsAt: Date,
  bufferMinutes: number,
  excludeReservationId?: string
): Promise<{ id: string; startsAt: Date } | null> {
  const effectiveBuffer = bufferMinutes > 0 ? bufferMinutes : 1;
  const windowStart = new Date(startsAt.getTime() - effectiveBuffer * 60000);
  const windowEnd = new Date(startsAt.getTime() + effectiveBuffer * 60000);

  return db.reservation.findFirst({
    where: {
      restaurantId,
      tableId,
      status: 'CONFIRMED',
      startsAt: { gte: windowStart, lte: windowEnd },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    select: { id: true, startsAt: true },
  });
}

/**
 * Whether `err` is Postgres rejecting a write for violating the
 * reservation_no_overlapping_bookings EXCLUDE constraint (the DB-level
 * backstop behind findConflictingReservation's application-level check).
 * Prisma has no dedicated error code for EXCLUDE constraints — verified
 * live that this surfaces as a PrismaClientUnknownRequestError wrapping the
 * raw Postgres error (code 23P01), not a PrismaClientKnownRequestError with
 * a P2xxx code, so matching on the constraint name in the message is the
 * reliable way to identify it (a lone "23P01" would also match, since it's
 * the only exclusion constraint in this schema, but the name is unambiguous
 * even if that ever changes).
 */
export function isReservationExclusionViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientUnknownRequestError &&
    err.message.includes('reservation_no_overlapping_bookings')
  );
}

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
