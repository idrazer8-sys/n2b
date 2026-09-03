import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  kind: z.enum(['ZONE', 'BAR', 'KITCHEN', 'ENTRANCE']).optional(),
  x: z.number().int().min(0).max(4000).optional(),
  y: z.number().int().min(0).max(4000).optional(),
  width: z.number().int().min(40).max(2000).optional(),
  height: z.number().int().min(40).max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { restaurantId: string; zoneId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = schema.parse(await req.json());
    const existing = await db.tableZone.findFirst({
      where: { id: params.zoneId, restaurantId: params.restaurantId },
    });
    if (!existing) return NextResponse.json({ error: 'Zone not found' }, { status: 404 });

    const updated = await db.tableZone.update({ where: { id: params.zoneId }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; zoneId: string } }
) {
  const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const existing = await db.tableZone.findFirst({
    where: { id: params.zoneId, restaurantId: params.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: 'Zone not found' }, { status: 404 });

  // Tables in this zone are NOT deleted — the FK is ON DELETE SET NULL, so
  // they simply become unassigned to any zone rather than disappearing.
  await db.tableZone.delete({ where: { id: params.zoneId } });
  return NextResponse.json({ ok: true });
}
