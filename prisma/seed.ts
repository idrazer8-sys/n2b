import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('TestPassword123!', 12);

  const owner = await db.user.upsert({
    where: { email: 'owner@testrestaurant.com' },
    update: {},
    create: { email: 'owner@testrestaurant.com', name: 'Test Owner', passwordHash },
  });

  const restaurant = await db.restaurant.upsert({
    where: { slug: 'test-restaurant' },
    update: {},
    create: {
      slug: 'test-restaurant',
      name: 'Test Restaurant',
      currency: 'EUR',
      brandPrimaryColor: '#1F6F5C',
      staff: { create: { userId: owner.id, role: 'OWNER' } },
    },
  });

  const existingTables = await db.table.count({ where: { restaurantId: restaurant.id } });
  if (existingTables === 0) {
    await db.table.createMany({
      data: [
        { restaurantId: restaurant.id, label: 'Table 1' },
        { restaurantId: restaurant.id, label: 'Table 2' },
        { restaurantId: restaurant.id, label: 'Table 3' },
      ],
    });
  }

  const existingCategories = await db.menuCategory.count({ where: { restaurantId: restaurant.id } });
  if (existingCategories === 0) {
    const mains = await db.menuCategory.create({
      data: { restaurantId: restaurant.id, name: 'Mains', sortOrder: 1 },
    });
    const drinks = await db.menuCategory.create({
      data: { restaurantId: restaurant.id, name: 'Drinks', sortOrder: 2 },
    });

    await db.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: mains.id,
        name: 'Chicken Alfredo',
        description: 'Creamy Alfredo sauce with grilled chicken.',
        priceCents: 1250,
        allergens: ['Dairy', 'Gluten'],
        modifiers: {
          create: [
            {
              name: 'Size',
              selectionType: 'SINGLE',
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: { create: [{ name: 'Regular', priceDeltaCents: 0 }, { name: 'Large', priceDeltaCents: 200 }] },
            },
            {
              name: 'Extras',
              selectionType: 'MULTIPLE',
              options: {
                create: [
                  { name: 'Extra cheese', priceDeltaCents: 100 },
                  { name: 'Mushrooms', priceDeltaCents: 100 },
                  { name: 'Bacon', priceDeltaCents: 200 },
                ],
              },
            },
          ],
        },
      },
    });

    await db.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: mains.id,
        name: 'Burger',
        description: 'Beef patty, cheddar, house sauce.',
        priceCents: 1300,
        allergens: ['Gluten'],
      },
    });

    await db.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: drinks.id,
        name: 'Coca-Cola',
        priceCents: 250,
      },
    });
  }

  console.log('Seed complete.');
  console.log('  Restaurant: test-restaurant');
  console.log('  Owner login: owner@testrestaurant.com / TestPassword123!');

  const tables = await db.table.findMany({ where: { restaurantId: restaurant.id } });
  for (const t of tables) {
    console.log(`  ${t.label} URL: http://localhost:3000/r/test-restaurant?t=${t.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
