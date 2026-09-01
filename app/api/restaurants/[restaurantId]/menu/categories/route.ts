import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = schema.parse(await req.json());
    const category = await db.menuCategory.create({
      data: { ...body, restaurantId: params.restaurantId },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const categories = await db.menuCategory.findMany({
    where: { restaurantId: params.restaurantId },
    include: { items: { include: { modifiers: { include: { options: true } } } } },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(categories);
}
