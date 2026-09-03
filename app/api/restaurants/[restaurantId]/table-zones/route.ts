import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  name: z.string().min(1).max(60),
  kind: z.enum(['ZONE', 'BAR', 'KITCHEN', 'ENTRANCE']).optional(),
  x: z.number().int().min(0).max(4000).optional(),
  y: z.number().int().min(0).max(4000).optional(),
  // Fixtures like a bar are often long and thin, so they need a smaller
  // floor than a table-grouping zone does.
  width: z.number().int().min(40).max(2000).optional(),
  height: z.number().int().min(40).max(2000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const zones = await db.tableZone.findMany({
    where: { restaurantId: params.restaurantId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(zones);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = schema.parse(await req.json());
    const zone = await db.tableZone.create({
      data: { restaurantId: params.restaurantId, ...body },
    });
    return NextResponse.json(zone, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
