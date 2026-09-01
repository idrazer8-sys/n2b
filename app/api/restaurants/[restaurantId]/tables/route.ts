import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({ label: z.string().min(1).max(40) });

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
    // `token` defaults to a fresh cuid() (see schema) — an unguessable id
    // distinct from the row's own primary key, so the table URL never
    // exposes a sequential/enumerable identifier.
    const table = await db.table.create({
      data: { restaurantId: params.restaurantId, label: body.label },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
