import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { rateLimit } from '@/src/lib/rate-limit';

const modifierOptionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  priceDelta: z.number().min(0).max(1000).optional().default(0),
});

const modifierSchema = z.object({
  name: z.string().trim().min(1).max(60),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']).optional().default('SINGLE'),
  isRequired: z.boolean().optional().default(false),
  options: z.array(modifierOptionSchema).max(20).default([]),
});

const itemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().min(0).max(10000),
  allergens: z.array(z.string().trim().max(60)).max(20).optional().default([]),
  dietaryTags: z.array(z.string().trim().max(40)).max(10).optional().default([]),
  modifiers: z.array(modifierSchema).max(15).optional().default([]),
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

    const limited = await rateLimit(
      `menu-import-publish:${params.restaurantId}`,
      20,
      10 * 60 * 1000
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many publish attempts — please wait a few minutes and try again.' },
        { status: 429 }
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

    // A large imported menu (60+ items, each a sequential awaited create()
    // over the network to Postgres, some with nested modifier/option
    // creates) reliably exceeds Prisma's 5000ms default interactive-
    // transaction timeout — reproduced directly: 60 items failed at ~5.04s
    // with P2028 "Transaction already closed," rolled back cleanly (no
    // orphaned rows) but with a bare "Internal server error" and NOTHING
    // published, for what is an entirely ordinary menu size. Same fix
    // already applied in app/api/public/orders/route.ts for the same
    // underlying reason.
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

        // Fast path: most imported items have no modifiers, so they can go
        // in as one bulk insert instead of N sequential round-trips — this
        // is what made a 60-item menu take ~13s to publish (measured).
        // sortOrder uses each item's position in the ORIGINAL list (not
        // insertion order), so splitting into two passes below never
        // reorders anything on the published menu.
        const plainItems: typeof category.items = [];
        const itemsWithModifiers: typeof category.items = [];
        category.items.forEach((item) => {
          (item.modifiers && item.modifiers.length > 0 ? itemsWithModifiers : plainItems).push(item);
        });

        if (plainItems.length > 0) {
          await tx.menuItem.createMany({
            data: plainItems.map((item) => ({
              restaurantId: params.restaurantId,
              categoryId: createdCategory.id,
              name: item.name,
              description: item.description || null,
              priceCents: Math.round(item.price * 100),
              allergens: item.allergens ?? [],
              dietaryTags: item.dietaryTags ?? [],
              sortOrder: category.items.indexOf(item),
            })),
          });
          itemsCreated += plainItems.length;
        }

        // Slow path: nested modifier/option creates aren't supported by
        // createMany, so these still go one at a time.
        for (const item of itemsWithModifiers) {
          await tx.menuItem.create({
            data: {
              restaurantId: params.restaurantId,
              categoryId: createdCategory.id,
              name: item.name,
              description: item.description || null,
              priceCents: Math.round(item.price * 100),
              allergens: item.allergens ?? [],
              dietaryTags: item.dietaryTags ?? [],
              sortOrder: category.items.indexOf(item),
              modifiers: {
                create: (item.modifiers ?? []).map((modifier, modifierSort) => ({
                  name: modifier.name,
                  selectionType: modifier.selectionType,
                  isRequired: modifier.isRequired,
                  sortOrder: modifierSort,
                  options: {
                    create: modifier.options.map((option, optionSort) => ({
                      name: option.name,
                      priceDeltaCents: Math.round(option.priceDelta * 100),
                      sortOrder: optionSort,
                    })),
                  },
                })),
              },
            },
          });

          itemsCreated += 1;
        }
      }

      return { categoriesCreated, itemsCreated };
    }, { timeout: 60000 });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(
      'POST /api/restaurants/[restaurantId]/menu/import/publish error:',
      err
    );

    return errorResponse(err);
  }
}
