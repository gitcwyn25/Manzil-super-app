import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: { uz: 'Restoranlari', ru: 'Рестораны', en: 'Restaurants' },
        icon: '🍽️',
      },
    }),
    prisma.category.create({
      data: {
        name: { uz: 'Kafe', ru: 'Кафе', en: 'Cafes' },
        icon: '☕',
      },
    }),
    prisma.category.create({
      data: {
        name: { uz: 'Salons', ru: 'Салоны', en: 'Beauty' },
        icon: '💇',
      },
    }),
  ]);

  console.log(`✅ Seeded ${categories.length} categories`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
