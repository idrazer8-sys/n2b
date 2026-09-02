import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

const createSchema = z.object({
  tableId: z.string().min(1),
  startsAt: z.string().datetime().or(z.string().min(1)),
  partySize: z.number().int().min(1).max(60),
  customerName: z.string().trim().min(1).max(120).nullable().optional(),
  customerPhone: z.string().trim().min(1).max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

type RouteContext = {
  params: { restaurantId: string };
};

// STAFF+ can view reservations (so waiters can see upcoming bookings too),
// but only MANAGER+ can create/cancel them (enforced in POST/PATCH/DELETE).
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const fromParam = req.nextUrl.searchParams.get('from');
    const toParam = req.nextUrl.searchParams.get('to');
    const statusParam = req.nextUrl.searchParams.get('status');

    const reservations = await db.reservation.findMany({
      where: {
        restaurantId: params.restaurantId,
        ...(fromParam || toParam
          ? {
              startsAt: {
                ...(fromParam ? { gte: new Date(fromParam) } : {}),
                ...(toParam ? { lte: new Date(toParam) } : {}),
              },
            }
          : {}),
        ...(statusParam
          ? { status: statusParam as 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
      include: {
        table: { select: { id: true, label: true } },
      },
    });

    return NextResponse.json({ reservations });
  } catch (err) {
    console.error('Reservations GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = createSchema.parse(await req.json());

    const table = await db.table.findFirst({
      where: { id: body.tableId, restaurantId: params.restaurantId },
      select: { id: true },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const startsAt = new Date(body.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 });
    }

    const reservation = await db.reservation.create({
      data: {
        restaurantId: params.restaurantId,
        tableId: body.tableId,
        startsAt,
        partySize: body.partySize,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        notes: body.notes ?? null,
        createdByUserId: access.user.id,
      },
      include: {
        table: { select: { id: true, label: true } },
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.errors }, { status: 400 });
    }

    console.error('Reservations POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
