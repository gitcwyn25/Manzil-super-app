import { PrismaClient, type PlanTier } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds the three plans and their feature entitlements. Idempotent: prices set
 * here are defaults only — admins edit them live via the console, and this seed
 * never overwrites an existing plan's price/name (only ensures the row + its
 * feature set exist).
 *
 * Entitlement keys are the contract the API's EntitlementGuard checks and the
 * web's locked-feature UI reads. Keep them stable.
 */
type PlanSeed = {
  tier: PlanTier;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  priceMonthly: number;
  photoLimit: number | null;
  staffLimit: number;
  locationLimit: number;
  sortOrder: number;
  features: Array<{ key: string; uz: string; ru: string; en: string }>;
};

const F = (key: string, uz: string, ru: string, en: string) => ({ key, uz, ru, en });

const PLANS: PlanSeed[] = [
  {
    tier: "free",
    nameUz: "Boshlang'ich",
    nameRu: "Начальный",
    nameEn: "Free",
    priceMonthly: 0,
    photoLimit: 5,
    staffLimit: 1,
    locationLimit: 1,
    sortOrder: 0,
    features: [
      F("listing.manage", "Bitta biznesni boshqarish", "Управление одним бизнесом", "Manage 1 listing"),
      F("listing.edit", "Ma'lumot, ish vaqti, 5 tagacha foto", "Инфо, часы, до 5 фото", "Info, hours, up to 5 photos"),
      F("reviews.reply", "Sharhlarga javob", "Ответы на отзывы", "Reply to reviews"),
      F("analytics.basic", "Asosiy statistika (30 kun)", "Базовая статистика (30 дней)", "Basic analytics (30 days)"),
      F("data.export", "To'liq ma'lumot eksporti", "Полный экспорт данных", "Full data export")
    ]
  },
  {
    tier: "pro",
    nameUz: "Pro",
    nameRu: "Pro",
    nameEn: "Pro",
    priceMonthly: 399000,
    photoLimit: null,
    staffLimit: 3,
    locationLimit: 1,
    sortOrder: 1,
    features: [
      F("analytics.advanced", "Kengaytirilgan analitika (qidiruv, tuman talabi)", "Расширенная аналитика (поиск, спрос по районам)", "Advanced analytics (search terms, district demand)"),
      F("promotions", "Aksiyalar va chegirmalar moduli", "Модуль акций и скидок", "Promotions & deals module"),
      F("review.campaigns", "Sharh so'rovi kampaniyalari", "Кампании запроса отзывов", "Review-request campaigns"),
      F("staff.multi", "3 tagacha xodim (rollar bilan)", "До 3 сотрудников с ролями", "Up to 3 staff with roles"),
      F("telegram.bot", "Telegram bot orqali boshqaruv", "Управление через Telegram-бота", "Telegram bot management"),
      F("photos.unlimited", "Cheksiz foto", "Безлимитные фото", "Unlimited photos")
    ]
  },
  {
    tier: "max",
    nameUz: "Max",
    nameRu: "Max",
    nameEn: "Max",
    priceMonthly: 499000,
    photoLimit: null,
    staffLimit: 10,
    locationLimit: 25,
    sortOrder: 2,
    features: [
      F("locations.multi", "Bir nechta filialni boshqarish", "Управление несколькими филиалами", "Multi-location management"),
      F("booking", "Bron qilish + Payme/Click depozit", "Бронирование + депозит Payme/Click", "Booking + Payme/Click deposits"),
      F("api.access", "API/webhook kirish", "API/webhook доступ", "API/webhook access"),
      F("search.boost", "Qidiruvda ustuvor joylashuv krediti", "Кредиты приоритета в поиске", "Boosted-placement credits"),
      F("support.priority", "Shaxsiy menejer / ustuvor qo'llab-quvvatlash", "Персональный менеджер / приоритет", "Dedicated manager / priority support"),
      F("reports.whitelabel", "White-label PDF hisobotlar", "White-label PDF отчёты", "White-label PDF reports")
    ]
  }
];

async function main() {
  for (const p of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { tier: p.tier } });

    const plan = existing
      ? // never overwrite admin-edited price/name; keep limits + activation in sync
        await prisma.plan.update({
          where: { tier: p.tier },
          data: {
            photoLimit: p.photoLimit,
            staffLimit: p.staffLimit,
            locationLimit: p.locationLimit,
            sortOrder: p.sortOrder
          }
        })
      : await prisma.plan.create({
          data: {
            tier: p.tier,
            nameUz: p.nameUz,
            nameRu: p.nameRu,
            nameEn: p.nameEn,
            priceMonthly: p.priceMonthly,
            photoLimit: p.photoLimit,
            staffLimit: p.staffLimit,
            locationLimit: p.locationLimit,
            sortOrder: p.sortOrder
          }
        });

    for (const f of p.features) {
      await prisma.planFeature.upsert({
        where: { planId_key: { planId: plan.id, key: f.key } },
        update: { labelUz: f.uz, labelRu: f.ru, labelEn: f.en, included: true },
        create: { planId: plan.id, key: f.key, labelUz: f.uz, labelRu: f.ru, labelEn: f.en, included: true }
      });
    }
  }

  const plans = await prisma.plan.findMany({ include: { features: true }, orderBy: { sortOrder: "asc" } });
  console.log(
    "Seeded plans:",
    plans.map((p) => `${p.tier}=${Number(p.priceMonthly)} ${p.currency} (${p.features.length} features)`).join(", ")
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
