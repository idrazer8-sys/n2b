import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const itemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().min(0).max(10000),
  allergens: z.array(z.string().trim().max(60)).max(20).optional().default([]),
});

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  items: z.array(itemSchema).max(200),
});

const schema = z.object({
  categories: z.array(categorySchema).min(1).max(60),
});

/*
 * POST /api/restaurants/[restaurantId]/menu/import/publish
 *
 * The manager has reviewed (and possibly edited) the draft menu returned
 * by .../menu/import. This creates the real MenuCategory + MenuItem rows,
 * appended after whatever menu already exists — nothing existing is
 * touched or removed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());

    const nonEmptyCategories = body.categories.filter(
      (category) => category.items.length > 0
    );

    if (nonEmptyCategories.length === 0) {
      return NextResponse.json(
        { error: 'There is nothing to publish — every category is empty.' },
        { status: 400 }
      );
    }

    const lastCategory = await db.menuCategory.findFirst({
      where: { restaurantId: params.restaurantId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    let nextCategorySort = (lastCategory?.sortOrder ?? -1) + 1;

    const result = await db.$transaction(async (tx) => {
      let categoriesCreated = 0;
      let itemsCreated = 0;

      for (const category of nonEmptyCategories) {
        const createdCategory = await tx.menuCategory.create({
          data: {
            restaurantId: params.restaurantId,
            name: category.name,
            sortOrder: nextCategorySort,
          },
        });

        nextCategorySort += 1;
        categoriesCreated += 1;

        let itemSort = 0;
        for (const item of category.items) {
          await tx.menuItem.create({
            data: {
              restaurantId: params.restaurantId,
              categoryId: createdCategory.id,
              name: item.name,
              description: item.description || null,
              priceCents: Math.round(item.price * 100),
              allergens: item.allergens ?? [],
              sortOrder: itemSort,
            },
          });

          itemSort += 1;
          itemsCreated += 1;
        }
      }

      return { categoriesCreated, itemsCreated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(
      'POST /api/restaurants/[restaurantId]/menu/import/publish error:',
      err
    );

    return errorResponse(err);
  }
}
