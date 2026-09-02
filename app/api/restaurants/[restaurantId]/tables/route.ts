import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  label: z.string().min(1).max(40),
  zoneId: z.string().min(1).nullable().optional(),
  x: z.number().int().min(0).max(4000).optional(),
  y: z.number().int().min(0).max(4000).optional(),
  width: z.number().int().min(30).max(600).optional(),
  height: z.number().int().min(30).max(600).optional(),
  shape: z.enum(['SQUARE', 'RECT', 'CIRCLE']).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const tables = await db.table.findMany({
    where: { restaurantId: params.restaurantId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = schema.parse(await req.json());

    if (body.zoneId) {
      const zone = await db.tableZone.findFirst({
        where: { id: body.zoneId, restaurantId: params.restaurantId },
        select: { id: true },
      });
      if (!zone) {
        return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
      }
    }

    // `token` defaults to a fresh cuid() (see schema) — an unguessable id
    // distinct from the row's own primary key, so the table URL never
    // exposes a sequential/enumerable identifier.
    const table = await db.table.create({
      data: {
        restaurantId: params.restaurantId,
        label: body.label,
        zoneId: body.zoneId ?? undefined,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        shape: body.shape,
      },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
