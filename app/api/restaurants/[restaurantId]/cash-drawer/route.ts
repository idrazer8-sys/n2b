import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { STANDARD_DENOMINATIONS_CENTS } from '@/src/lib/cashDrawer';

const putSchema = z.object({
  denominations: z
    .array(
      z.object({
        valueCents: z.number().int().positive(),
        quantity: z.number().int().min(0).max(1000000),
      })
    )
    .min(1),
});

type RouteContext = {
  params: { restaurantId: string };
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const rows = await db.cashDenomination.findMany({
      where: { restaurantId: params.restaurantId },
    });

    const byValue = new Map(
      rows.map((row: { valueCents: number; quantity: number; updatedAt: Date }) => [
        row.valueCents,
        row,
      ])
    );

    const denominations = STANDARD_DENOMINATIONS_CENTS.map((valueCents) => {
      const row = byValue.get(valueCents);

      return {
        valueCents,
        quantity: row?.quantity ?? 0,
        updatedAt: row?.updatedAt ?? null,
      };
    });

    const totalCents = denominations.reduce(
      (sum, item) => sum + item.valueCents * item.quantity,
      0
    );

    return NextResponse.json({ denominations, totalCents });
  } catch (err) {
    console.error('Cash drawer GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = putSchema.parse(await req.json());

    await db.$transaction(
      body.denominations.map((item) =>
        db.cashDenomination.upsert({
          where: {
            restaurantId_valueCents: {
              restaurantId: params.restaurantId,
              valueCents: item.valueCents,
            },
          },
          create: {
            restaurantId: params.restaurantId,
            valueCents: item.valueCents,
            quantity: item.quantity,
          },
          update: {
            quantity: item.quantity,
          },
        })
      )
    );

    const rows = await db.cashDenomination.findMany({
      where: { restaurantId: params.restaurantId },
    });

    const byValue = new Map(
      rows.map((row: { valueCents: number; quantity: number; updatedAt: Date }) => [
        row.valueCents,
        row,
      ])
    );

    const denominations = STANDARD_DENOMINATIONS_CENTS.map((valueCents) => {
      const row = byValue.get(valueCents);

      return {
        valueCents,
        quantity: row?.quantity ?? 0,
        updatedAt: row?.updatedAt ?? null,
      };
    });

    const totalCents = denominations.reduce(
      (sum, item) => sum + item.valueCents * item.quantity,
      0
    );

    return NextResponse.json({ denominations, totalCents });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', issues: err.errors }, { status: 400 });
    }

    console.error('Cash drawer PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
