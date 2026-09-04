import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  priceCents: z.number().int().min(0).max(10_000_000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  categoryId: z.string().optional(),
  // Basis points — 0 to 10000 (0% to 100%). Correct VAT classification is
  // a legal/accounting judgment call for the restaurant, never guessed
  // here; this just accepts whatever rate they specify.
  vatRateBps: z.number().int().min(0).max(10000).optional(),
});

// Scoped by BOTH itemId and restaurantId in every query below — this is
// the tenant-isolation guarantee: restaurant B can never read or mutate a
// row that belongs to restaurant A, even if they guess a valid item id.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { restaurantId: string; itemId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = patchSchema.parse(await req.json());

    const existing = await db.menuItem.findFirst({
      where: { id: params.itemId, restaurantId: params.restaurantId },
    });
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const updated = await db.menuItem.update({
      where: { id: params.itemId },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; itemId: string } }
) {
  const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const existing = await db.menuItem.findFirst({
    where: { id: params.itemId, restaurantId: params.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  // Soft "delete" by marking unavailable is often safer once an item has
  // order history (OrderItem.menuItemId is onDelete: Restrict for exactly
  // this reason). We hard-delete only if it's never been ordered.
  const hasOrders = await db.orderItem.findFirst({ where: { menuItemId: params.itemId } });
  if (hasOrders) {
    await db.menuItem.update({ where: { id: params.itemId }, data: { isAvailable: false } });
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  await db.menuItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true, softDeleted: false });
}
