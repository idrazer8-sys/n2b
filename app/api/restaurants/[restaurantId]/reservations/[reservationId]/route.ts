import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { findConflictingReservation, isReservationExclusionViolation } from '@/src/lib/reservations';

const patchSchema = z.object({
  tableId: z.string().min(1).optional(),
  startsAt: z.string().min(1).optional(),
  partySize: z.number().int().min(1).max(60).optional(),
  customerName: z.string().trim().min(1).max(120).nullable().optional(),
  customerPhone: z.string().trim().min(1).max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
});

type RouteContext = {
  params: { restaurantId: string; reservationId: string };
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const existing = await db.reservation.findFirst({
      where: { id: params.reservationId, restaurantId: params.restaurantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const body = patchSchema.parse(await req.json());

    if (body.tableId) {
      const table = await db.table.findFirst({
        where: { id: body.tableId, restaurantId: params.restaurantId },
        select: { id: true },
      });

      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
    }

    let startsAt: Date | undefined;

    if (body.startsAt) {
      startsAt = new Date(body.startsAt);

      if (Number.isNaN(startsAt.getTime())) {
        return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 });
      }
    }

    // Only re-check for a conflict when the table or time is actually
    // moving — editing just the party size or notes shouldn't re-validate
    // against itself.
    let bufferMinutes: number | undefined;

    if (body.tableId !== undefined || startsAt !== undefined) {
      const restaurant = await db.restaurant.findUnique({
        where: { id: params.restaurantId },
        select: { reservationBufferMinutes: true },
      });

      bufferMinutes = restaurant?.reservationBufferMinutes ?? 15;

      const conflict = await findConflictingReservation(
        params.restaurantId,
        body.tableId ?? existing.tableId,
        startsAt ?? existing.startsAt,
        bufferMinutes,
        params.reservationId
      );

      if (conflict) {
        return NextResponse.json(
          {
            error: 'This table already has a reservation too close to that time',
            conflictingReservationId: conflict.id,
          },
          { status: 409 }
        );
      }
    }

    // As in POST, the check above is a fast-path — the DB-level EXCLUDE
    // constraint is what actually guarantees no overlap under concurrent
    // edits, so this update can still be rejected even after a clean check.
    let reservation;

    try {
      reservation = await db.reservation.update({
        where: { id: params.reservationId },
        data: {
          ...(body.tableId !== undefined ? { tableId: body.tableId } : {}),
          ...(startsAt !== undefined ? { startsAt } : {}),
          ...(bufferMinutes !== undefined ? { bufferMinutesSnapshot: bufferMinutes } : {}),
          ...(body.partySize !== undefined ? { partySize: body.partySize } : {}),
          ...(body.customerName !== undefined ? { customerName: body.customerName } : {}),
          ...(body.customerPhone !== undefined ? { customerPhone: body.customerPhone } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
        include: {
          table: { select: { id: true, label: true } },
        },
      });
    } catch (err) {
      if (isReservationExclusionViolation(err)) {
        return NextResponse.json(
          { error: 'This table already has a reservation too close to that time' },
          { status: 409 }
        );
      }

      throw err;
    }

    return NextResponse.json({ reservation });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.errors }, { status: 400 });
    }

    console.error('Reservation PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const existing = await db.reservation.findFirst({
      where: { id: params.reservationId, restaurantId: params.restaurantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Soft-cancel rather than hard-delete, so the booking stays in history.
    await db.reservation.update({
      where: { id: params.reservationId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reservation DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
