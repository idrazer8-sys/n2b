import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  label: z.string().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { restaurantId: string; tableId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = schema.parse(await req.json());
    const existing = await db.table.findFirst({
      where: { id: params.tableId, restaurantId: params.restaurantId },
    });
    if (!existing) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const updated = await db.table.update({ where: { id: params.tableId }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; tableId: string } }
) {
  const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const existing = await db.table.findFirst({
    where: { id: params.tableId, restaurantId: params.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  // Deactivate rather than hard-delete if the table has order history
  // (Order.tableId is onDelete: Restrict), so historical orders stay intact.
  const hasOrders = await db.order.findFirst({ where: { tableId: params.tableId } });
  if (hasOrders) {
    await db.table.update({ where: { id: params.tableId }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await db.table.delete({ where: { id: params.tableId } });
  return NextResponse.json({ ok: true, deactivated: false });
}
