import { PrismaClient } from "@prisma/client";
import { businesses, categories, reviews } from "../packages/shared/src/demo-data";

const prisma = new PrismaClient();

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameUz: category.name.uz,
        nameRu: category.name.ru,
        nameEn: category.name.en,
        parentId: category.parentId ?? null
      },
      create: {
        id: category.id,
        slug: category.slug,
        nameUz: category.name.uz,
        nameRu: category.name.ru,
        nameEn: category.name.en,
        parentId: category.parentId ?? null
      }
    });
  }

  for (const business of businesses) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: business.categorySlug }
    });

    await prisma.business.upsert({
      where: { slug: business.slug },
      update: {
        name: business.name,
        categoryId: category.id,
        descriptionUz: business.description.uz,
        descriptionRu: business.description.ru,
        descriptionEn: business.description.en,
        address: business.address,
        district: business.district,
        city: business.city,
        lat: business.lat,
        lng: business.lng,
        phone: business.phone,
        hoursJson: { weekdays: business.hours },
        priceTier: business.priceTier,
        status: business.status,
        avgRating: business.avgRating,
        reviewCount: business.reviewCount
      },
      create: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        categoryId: category.id,
        descriptionUz: business.description.uz,
        descriptionRu: business.description.ru,
        descriptionEn: business.description.en,
        address: business.address,
        district: business.district,
        city: business.city,
        lat: business.lat,
        lng: business.lng,
        phone: business.phone,
        hoursJson: { weekdays: business.hours },
        priceTier: business.priceTier,
        status: business.status,
        avgRating: business.avgRating,
        reviewCount: business.reviewCount
      }
    });
  }

  for (const review of reviews) {
    const business = await prisma.business.findUniqueOrThrow({
      where: { slug: review.businessSlug }
    });

    const user = await prisma.user.upsert({
      where: { email: `${review.id}@seed.manzil.local` },
      update: {
        displayName: review.authorName,
        locale: review.locale
      },
      create: {
        email: `${review.id}@seed.manzil.local`,
        displayName: review.authorName,
        locale: review.locale
      }
    });

    await prisma.review.upsert({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: user.id
        }
      },
      update: {
        rating: Math.round(review.rating),
        text: review.text,
        helpfulCount: review.helpfulCount,
        moderationStatus: "approved",
        createdAt: new Date(review.createdAt)
      },
      create: {
        id: review.id,
        businessId: business.id,
        userId: user.id,
        rating: Math.round(review.rating),
        text: review.text,
        helpfulCount: review.helpfulCount,
        moderationStatus: "approved",
        createdAt: new Date(review.createdAt)
      }
    });
  }

  for (const business of businesses) {
    const aggregate = await prisma.review.aggregate({
      where: {
        business: { slug: business.slug },
        moderationStatus: "approved"
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await prisma.business.update({
      where: { slug: business.slug },
      data: {
        avgRating: aggregate._avg.rating ?? business.avgRating,
        reviewCount: aggregate._count.rating || business.reviewCount
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
