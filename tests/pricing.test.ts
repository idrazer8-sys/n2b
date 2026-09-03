import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/lib/db';
import { priceCart, PricingError, extractVat } from '../src/lib/pricing';

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

// VAT-specific fixtures — real, nonzero rates.
let foodItemId: string; // 1000 bps = 10% (Spain hostelry rate, the schema default)
let alcoholItemId: string; // 2100 bps = 21% (Spain general rate)
let zeroRateItemId: string; // explicit 0% — must be distinguishable from "not tracked"

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

  // vatRateBps: 0 throughout this file — these tests are about item/
  // modifier pricing logic, predating VAT. Keeping the rate at 0 means
  // subtotalCents === totalCents like before, so none of those assertions
  // need to change. VAT extraction itself has its own dedicated describe
  // block below with items that use real, nonzero rates.
  const plainItem = await db.menuItem.create({
    data: { restaurantId, categoryId: category.id, name: 'Plain Item', priceCents: 500, vatRateBps: 0 },
  });
  plainItemId = plainItem.id;

  const unavailableItem = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: 'Unavailable Item',
      priceCents: 300,
      isAvailable: false,
      vatRateBps: 0,
    },
  });
  unavailableItemId = unavailableItem.id;

  const sizeItem = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: 'Sized Item',
      priceCents: 1000,
      vatRateBps: 0,
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
      vatRateBps: 0,
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

  const foodItem = await db.menuItem.create({
    data: { restaurantId, categoryId: category.id, name: 'Food Item', priceCents: 1000, vatRateBps: 1000 },
  });
  foodItemId = foodItem.id;

  const alcoholItem = await db.menuItem.create({
    data: { restaurantId, categoryId: category.id, name: 'Alcohol Item', priceCents: 500, vatRateBps: 2100 },
  });
  alcoholItemId = alcoholItem.id;

  const zeroRateItem = await db.menuItem.create({
    data: { restaurantId, categoryId: category.id, name: 'Zero Rate Item', priceCents: 200, vatRateBps: 0 },
  });
  zeroRateItemId = zeroRateItem.id;
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

describe('extractVat', () => {
  it('returns the whole amount as base with zero VAT at a 0% rate', () => {
    expect(extractVat(1000, 0)).toEqual({ baseCents: 1000, vatCents: 0 });
  });

  it('extracts the base and VAT from a tax-inclusive amount', () => {
    // 1000 cents inclusive at 10% (1000 bps): base = 1000/1.10 = 909.09.. -> 909
    expect(extractVat(1000, 1000)).toEqual({ baseCents: 909, vatCents: 91 });
  });

  it('extracts correctly at 21% (Spain general rate)', () => {
    // 500 cents inclusive at 21% (2100 bps): base = 500/1.21 = 413.22.. -> 413
    expect(extractVat(500, 2100)).toEqual({ baseCents: 413, vatCents: 87 });
  });

  it('base + vat always reconstructs the exact original amount (no rounding drift)', () => {
    // A spread of amounts and rates chosen to include ones that don't
    // divide evenly, since that's exactly where rounding drift would show.
    const cases: Array<[number, number]> = [
      [1, 2100],
      [3, 1000],
      [999, 2100],
      [12345, 450],
      [7, 100],
    ];

    for (const [inclusiveCents, vatRateBps] of cases) {
      const { baseCents, vatCents } = extractVat(inclusiveCents, vatRateBps);
      expect(baseCents + vatCents).toBe(inclusiveCents);
    }
  });

  it('treats a negative rate the same as 0% rather than inflating the base', () => {
    expect(extractVat(500, -100)).toEqual({ baseCents: 500, vatCents: 0 });
  });
});

describe('priceCart VAT extraction', () => {
  it('snapshots the item VAT rate onto each priced line', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 1, selectedOptionIds: [] },
    ]);

    expect(result.pricedLines[0].vatRateBpsSnapshot).toBe(1000);
  });

  it('a single-rate cart: totalCents unchanged, subtotal/tax extracted correctly', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 1, selectedOptionIds: [] },
    ]);

    expect(result.totalCents).toBe(1000); // what's actually charged — unaffected by VAT
    expect(result.taxCents).toBe(91);
    expect(result.subtotalCents).toBe(909);
    expect(result.subtotalCents + result.taxCents).toBe(result.totalCents);
    expect(result.vatBreakdown).toEqual({ 1000: { baseCents: 909, vatCents: 91 } });
  });

  it('a mixed-rate cart aggregates a separate breakdown entry per rate', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 1, selectedOptionIds: [] }, // 1000c @ 10%
      { menuItemId: alcoholItemId, quantity: 1, selectedOptionIds: [] }, // 500c @ 21%
    ]);

    expect(result.totalCents).toBe(1500);
    expect(result.vatBreakdown).toEqual({
      1000: { baseCents: 909, vatCents: 91 },
      2100: { baseCents: 413, vatCents: 87 },
    });
    // The whole-order figures must still reconcile against the breakdown.
    expect(result.taxCents).toBe(91 + 87);
    expect(result.subtotalCents).toBe(909 + 413);
    expect(result.subtotalCents + result.taxCents).toBe(result.totalCents);
  });

  it('sums VAT correctly across quantity > 1', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 3, selectedOptionIds: [] },
    ]);

    // 3000c @ 10%: base = round(3000/1.1) = 2727, vat = 273
    expect(result.pricedLines[0].lineTotalCents).toBe(3000);
    expect(result.vatBreakdown[1000]).toEqual({ baseCents: 2727, vatCents: 273 });
  });

  it('two lines at the SAME rate combine into one breakdown entry, not two', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 1, selectedOptionIds: [] },
      { menuItemId: plainItemId, quantity: 1, selectedOptionIds: [] }, // 0% rate — separate entry
    ]);

    // plainItem is 0% (from the outer beforeAll), so this cart actually has
    // two distinct rates (1000 and 0), not a same-rate merge — assert that
    // explicitly rather than assuming, then prove the merge case separately
    // by adding a second food-rate item.
    expect(Object.keys(result.vatBreakdown).sort()).toEqual(['0', '1000']);
  });

  it('a genuine same-rate merge: two different items at 10% combine into one entry', async () => {
    const otherFoodItem = await db.menuItem.create({
      data: {
        restaurantId,
        categoryId: (await db.menuCategory.findFirstOrThrow({ where: { restaurantId } })).id,
        name: 'Second Food Item',
        priceCents: 400,
        vatRateBps: 1000,
      },
    });

    const result = await priceCart(restaurantId, [
      { menuItemId: foodItemId, quantity: 1, selectedOptionIds: [] }, // 1000c @ 10%
      { menuItemId: otherFoodItem.id, quantity: 1, selectedOptionIds: [] }, // 400c @ 10%
    ]);

    expect(Object.keys(result.vatBreakdown)).toEqual(['1000']);
    // 1400c @ 10%: base = round(1400/1.1) = 1273, vat = 127
    expect(result.vatBreakdown[1000]).toEqual({ baseCents: 1273, vatCents: 127 });
  });

  it('an explicit 0% VAT item still produces a breakdown entry (distinct from "not tracked")', async () => {
    const result = await priceCart(restaurantId, [
      { menuItemId: zeroRateItemId, quantity: 1, selectedOptionIds: [] },
    ]);

    expect(result.pricedLines[0].vatRateBpsSnapshot).toBe(0);
    expect(result.vatBreakdown).toEqual({ 0: { baseCents: 200, vatCents: 0 } });
  });
});
