import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const modifierOptionSchema = z.object({
  name: z.string().min(1).max(60),
  priceDeltaCents: z.number().int().min(0).max(100_000),
  sortOrder: z.number().int().default(0),
});

const modifierSchema = z.object({
  name: z.string().min(1).max(60),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).nullable().default(null),
  sortOrder: z.number().int().default(0),
  options: z.array(modifierOptionSchema).max(30),
});

const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(0).max(10_000_000),
  imageUrl: z.string().url().optional(),
  allergens: z.array(z.string().max(40)).max(20).default([]),
  ingredients: z.array(z.string().max(60)).max(40).default([]),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  // Basis points — 0 to 10000 (0% to 100%). Correct VAT classification is
  // a legal/accounting judgment call for the restaurant, never guessed
  // here; this just accepts whatever rate they specify. Omitted entirely
  // falls back to the schema default (1000 = 10%) — see
  // MenuItem.vatRateBps in schema.prisma.
  vatRateBps: z.number().int().min(0).max(10000).optional(),
  modifiers: z.array(modifierSchema).max(15).default([]),
});

// Menu items are always created/edited as a whole (item + its modifier
// groups + their options) in one transaction — avoids ending up with a
// modifier group that references options that were never actually created.
export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const body = itemSchema.parse(await req.json());

    const category = await db.menuCategory.findFirst({
      where: { id: body.categoryId, restaurantId: params.restaurantId },
    });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const item = await db.menuItem.create({
      data: {
        restaurantId: params.restaurantId,
        categoryId: body.categoryId,
        name: body.name,
        description: body.description,
        priceCents: body.priceCents,
        imageUrl: body.imageUrl,
        allergens: body.allergens,
        ingredients: body.ingredients,
        isAvailable: body.isAvailable,
        sortOrder: body.sortOrder,
        ...(body.vatRateBps !== undefined ? { vatRateBps: body.vatRateBps } : {}),
        modifiers: {
          create: body.modifiers.map((m) => ({
            name: m.name,
            selectionType: m.selectionType,
            isRequired: m.isRequired,
            minSelect: m.minSelect,
            maxSelect: m.maxSelect,
            sortOrder: m.sortOrder,
            options: { create: m.options },
          })),
        },
      },
      include: { modifiers: { include: { options: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
