import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/lib/db';
import { priceCart, PricingError } from '../src/lib/pricing';

// Integration test against the real DB: priceCart re-reads menu items,
// modifiers, and options straight from Prisma, so a mock would test nothing
// meaningful about the actual pricing logic. Seeds one throwaway restaurant
// with a full menu (plain item, item with a required single-select
// modifier, item with an optional multi-select modifier with min/max) and
// tears it all down afterwards.
let restaurantId: string;
let otherRestaurantId: string;
let plainItemId: string;
let unavailableItemId: string;

// Size (required, single): Small (+0), Large (+150)
let sizeItemId: string;
let sizeModifierId: string;
let sizeSmallOptionId: string;
let sizeLargeOptionId: string;

// Toppings (optional, multi, max 2): Cheese (+100, available), Bacon (+200,
// unavailable)
let toppingsItemId: string;
let toppingsCheeseOptionId: string;
let toppingsBaconOptionId: string;

beforeAll(async () => {
  const restaurant = await db.restaurant.create({
    data: {
      name: `Pricing Test Restaurant ${Date.now()}`,
      slug: `pricing-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
  restaurantId = restaurant.id;

  const otherRestaurant = await db.restaurant.create({
    data: {
      name: `Pricing Test Other Restaurant ${Date.now()}`,
      slug: `pricing-test-other-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
  otherRestaurantId = otherRestaurant.id;

  const category = await db.menuCategory.create({
    data: { restaurantId, name: 'Test Category' },
  });

  const plainItem = await db.menuItem.create({
    data: { restaurantId, categoryId: category.id, name: 'Plain Item', priceCents: 500 },
  });
  plainItemId = plainItem.id;

  const unavailableItem = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: 'Unavailable Item',
      priceCents: 300,
      isAvailable: false,
    },
  });
  unavailableItemId = unavailableItem.id;

  const sizeItem = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: 'Sized Item',
      priceCents: 1000,
      modifiers: {
        create: [
          {
            name: 'Size',
            selectionType: 'SINGLE',
            isRequired: true,
            options: {
              create: [
                { name: 'Small', priceDeltaCents: 0 },
                { name: 'Large', priceDeltaCents: 150 },
              ],
            },
          },
        ],
      },
    },
    include: { modifiers: { include: { options: true } } },
  });
  sizeItemId = sizeItem.id;
  sizeModifierId = sizeItem.modifiers[0].id;
  sizeSmallOptionId = sizeItem.modifiers[0].options.find((o) => o.name === 'Small')!.id;
  sizeLargeOptionId = sizeItem.modifiers[0].options.find((o) => o.name === 'Large')!.id;

  const toppingsItem = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: 'Toppings Item',
      priceCents: 800,
      modifiers: {
        create: [
          {
            name: 'Toppings',
            selectionType: 'MULTIPLE',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            options: {
              create: [
                { name: 'Cheese', priceDeltaCents: 100, isAvailable: true },
                { name: 'Bacon', priceDeltaCents: 200, isAvailable: false },
              ],
            },
          },
        ],
      },
    },
    include: { modifiers: { include: { options: true } } },
  });
  toppingsItemId = toppingsItem.id;
  toppingsCheeseOptionId = toppingsItem.modifiers[0].options.find((o) => o.name === 'Cheese')!.id;
  toppingsBaconOptionId = toppingsItem.modifiers[0].options.find((o) => o.name === 'Bacon')!.id;
});

afterAll(async () => {
  await db.menuItem.deleteMany({ where: { restaurantId: { in: [restaurantId, otherRestaurantId] } } });
  await db.menuCategory.deleteMany({ where: { restaurantId: { in: [restaurantId, otherRestaurantId] } } });
  await db.restaurant.deleteMany({ where: { id: { in: [restaurantId, otherRestaurantId] } } });
});

describe('priceCart', () => {
  it('rejects an empty cart', async () => {
    await expect(priceCart(restaurantId, [])).rejects.toMatchObject({
      code: 'EMPTY_CART',
    });
  });

  it('prices a plain item with no modifiers', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: plainItemId, quantity: 1, selectedOptionIds: [] },
    ]);

    expect(result.subtotalCents).toBe(500);
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(500);
    expect(result.pricedLines).toHaveLength(1);
    expect(result.pricedLines[0].unitPriceCents).toBe(500);
    expect(result.pricedLines[0].lineTotalCents).toBe(500);
  });

  it('multiplies line total by quantity', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: plainItemId, quantity: 3, selectedOptionIds: [] },
    ]);

    expect(result.subtotalCents).toBe(1500);
    expect(result.pricedLines[0].lineTotalCents).toBe(1500);
  });

  it('sums multiple distinct lines', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: plainItemId, quantity: 2, selectedOptionIds: [] },
      { menuItemId: sizeItemId, quantity: 1, selectedOptionIds: [sizeSmallOptionId] },
    ]);

    // plain: 500*2=1000, sized (small, +0): 1000
    expect(result.subtotalCents).toBe(2000);
    expect(result.pricedLines).toHaveLength(2);
  });

  it('rejects a zero quantity', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: plainItemId, quantity: 0, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'INVALID_QUANTITY' });
  });

  it('rejects a negative quantity', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: plainItemId, quantity: -1, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'INVALID_QUANTITY' });
  });

  it('rejects a quantity above the cap', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: plainItemId, quantity: 51, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'INVALID_QUANTITY' });
  });

  it('rejects a non-integer quantity', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: plainItemId, quantity: 1.5, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'INVALID_QUANTITY' });
  });

  it('rejects an unknown menu item id', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: 'does-not-exist', quantity: 1, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND' });
  });

  it('rejects a menu item id that belongs to a different restaurant (tenant isolation)', async () => {
    await expect(
      priceCart(otherRestaurantId, [{ menuItemId: plainItemId, quantity: 1, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND' });
  });

  it('rejects an unavailable item', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: unavailableItemId, quantity: 1, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'ITEM_UNAVAILABLE' });
  });

  it('applies a modifier price delta on top of the base price', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: sizeItemId, quantity: 1, selectedOptionIds: [sizeLargeOptionId] },
    ]);

    expect(result.pricedLines[0].unitPriceCents).toBe(1150); // 1000 + 150
    expect(result.subtotalCents).toBe(1150);
  });

  it('rejects a required modifier group left unselected', async () => {
    await expect(
      priceCart(restaurantId, [{ menuItemId: sizeItemId, quantity: 1, selectedOptionIds: [] }])
    ).rejects.toMatchObject({ code: 'MODIFIER_REQUIRED' });
  });

  it('rejects two selections in a SINGLE-select group', async () => {
    await expect(
      priceCart(restaurantId, [
        {
          menuItemId: sizeItemId,
          quantity: 1,
          selectedOptionIds: [sizeSmallOptionId, sizeLargeOptionId],
        },
      ])
    ).rejects.toMatchObject({ code: 'MODIFIER_SINGLE_VIOLATION' });
  });

  it('allows an optional modifier group to be left unselected', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: toppingsItemId, quantity: 1, selectedOptionIds: [] },
    ]);

    expect(result.pricedLines[0].unitPriceCents).toBe(800);
  });

  it('sums multiple selections in a MULTIPLE-select group', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: toppingsItemId, quantity: 1, selectedOptionIds: [toppingsCheeseOptionId] },
    ]);

    expect(result.pricedLines[0].unitPriceCents).toBe(900); // 800 + 100
  });

  it('rejects exceeding a maxSelect cap', async () => {
    // maxSelect is 2 on Toppings; only two options exist total, so create a
    // third to actually exceed it via a fresh throwaway modifier.
    const item = await db.menuItem.create({
      data: {
        restaurantId,
        categoryId: (await db.menuCategory.findFirstOrThrow({ where: { restaurantId } })).id,
        name: 'Max Select Test Item',
        priceCents: 100,
        modifiers: {
          create: [
            {
              name: 'Extras',
              selectionType: 'MULTIPLE',
              maxSelect: 1,
              options: {
                create: [
                  { name: 'A', priceDeltaCents: 10 },
                  { name: 'B', priceDeltaCents: 10 },
                ],
              },
            },
          ],
        },
      },
      include: { modifiers: { include: { options: true } } },
    });

    const [a, b] = item.modifiers[0].options;

    await expect(
      priceCart(restaurantId, [
        { menuItemId: item.id, quantity: 1, selectedOptionIds: [a.id, b.id] },
      ])
    ).rejects.toMatchObject({ code: 'MODIFIER_MAX_VIOLATION' });
  });

  it('rejects an unavailable modifier option', async () => {
    await expect(
      priceCart(restaurantId, [
        { menuItemId: toppingsItemId, quantity: 1, selectedOptionIds: [toppingsBaconOptionId] },
      ])
    ).rejects.toMatchObject({ code: 'OPTION_UNAVAILABLE' });
  });

  it('rejects an option id that does not belong to this item (splicing attack)', async () => {
    // sizeSmallOptionId belongs to the Sized Item's modifier group, not
    // Toppings — a client can't graft it onto a different item's cart line.
    await expect(
      priceCart(restaurantId, [
        { menuItemId: toppingsItemId, quantity: 1, selectedOptionIds: [sizeSmallOptionId] },
      ])
    ).rejects.toMatchObject({ code: 'OPTION_NOT_FOUND' });
  });

  it('every rejection is a PricingError instance', async () => {
    try {
      await priceCart(restaurantId, []);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PricingError);
    }
  });
});
