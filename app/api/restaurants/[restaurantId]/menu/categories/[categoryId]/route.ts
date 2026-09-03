import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  kitchenKind: z.enum(['FOOD', 'DRINKS', 'DESSERT']).optional(),
  name: z.string().min(1).max(80).optional(),
  defaultVatRateBps: z.number().int().min(0).max(10000).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { restaurantId: string; categoryId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = schema.parse(await req.json());

    const category = await db.menuCategory.findFirst({
      where: { id: params.categoryId, restaurantId: params.restaurantId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updated = await db.menuCategory.update({
      where: { id: params.categoryId },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
