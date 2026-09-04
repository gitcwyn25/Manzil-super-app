import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent seed for the admin platform: permissions, roles, role→permission
 * wiring, and a bootstrap super_admin.
 *
 * Bootstrap admin is explicit outside local development:
 *   BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_CLERK_ID, BOOTSTRAP_ADMIN_NAME
 * Local development may use the historical defaults for convenience; hosted
 * staging and production must never do so.
 */

// slug → category, description. Adding a permission = add a line here + reseed.
const PERMISSIONS: Array<[string, string, string]> = [
  // business
  ["business.view", "business", "View business listings and submission details"],
  ["business.approve", "business", "Approve pending business submissions"],
  ["business.reject", "business", "Reject business submissions (reason required)"],
  ["business.edit", "business", "Edit business listing fields in place"],
  ["business.merge", "business", "Merge duplicate business listings"],
  // review
  ["review.view", "review", "View reviews and the moderation queue"],
  ["review.approve", "review", "Approve/restore flagged reviews"],
  ["review.reject", "review", "Reject (hide) flagged reviews (reason required)"],
  ["review.delete", "review", "Delete reviews permanently (reason required)"],
  // user
  ["user.view", "user", "View user records, PII, and activity timeline"],
  ["user.suspend", "user", "Temporarily suspend a user account (reason required)"],
  ["user.ban", "user", "Ban a user account (reason required)"],
  ["user.unban", "user", "Lift a suspension or ban"],
  ["user.impersonate", "user", "Impersonate a user for support (reason required)"],
  // search
  ["search.view", "search", "View search index health and zero-result reports"],
  ["search.reindex", "search", "Trigger a full search reindex"],
  ["search.boost", "search", "Manually boost/demote listings in ranking"],
  ["search.synonyms", "search", "Manage per-language search synonyms"],
  // flags
  ["flag.view", "flag", "View feature flags"],
  ["flag.toggle", "flag", "Toggle feature flags without redeploy"],
  // media
  ["media.view", "media", "View media moderation queue via signed URLs"],
  ["media.approve", "media", "Approve pending media"],
  ["media.reject", "media", "Reject pending media (reason required)"],
  // analytics + audit + admin mgmt + payouts (stub)
  ["analytics.view", "analytics", "View analytics dashboards"],
  ["audit.view", "audit", "View the full audit log"],
  ["admin.manage", "admin", "Manage admin users, roles, and permissions"],
  ["plan.manage", "plan", "Set plan pricing and feature entitlements (dynamic pricing)"],
  ["payout.approve", "payout", "Approve business payouts (reserved for future billing)"],
  // legal — publishing is separated from viewing because publishing a document
  // version is what every future acceptance gets bound to, and is irreversible
  // in the sense that acceptances against it cannot be un-made.
  ["legal.view", "legal", "View legal documents, acceptances, and generated contracts"],
  ["legal.publish", "legal", "Publish a new version of a legal document or contract template"],
  // catalogue
  ["category.manage", "category", "Create and edit the category taxonomy shown on the landing page"],
  // notifications
  ["notification.view", "notification", "View and acknowledge the admin notification inbox"],
  // merchant activation
  ["waitlist.view", "waitlist", "View waitlist entries and qualification evidence"],
  ["waitlist.manage", "waitlist", "Assign and transition waitlist entries"],
  ["business.connect", "business", "Link a waitlist entry to an existing business record without granting ownership"],
  ["outbox.view", "outbox", "View durable outbound message state and delivery attempts"],
  ["outbox.create", "outbox", "Queue an attributable outbound message draft"],
  ["outbox.retry", "outbox", "Retry a failed outbound message (reason required)"],
  ["signature.view", "signature", "View the current operational signature profile"],
  ["signature.create", "signature", "Create or rotate the operational signature profile"],
  // supabase browser — read-only table/storage viewer. Deliberately granted
  // only to super_admin (via its "*" wildcard below): no other role lists
  // it, and it is not added to moderator/support/analyst.
  ["supabase.view", "supabase", "Browse read-only database tables and storage usage"]
];

const ROLES: Array<{
  slug: string;
  name: string;
  description: string;
  permissions: "*" | string[];
}> = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Full, unrestricted access to every admin capability.",
    permissions: "*"
  },
  {
    slug: "moderator",
    name: "Moderator",
    description: "Moderates businesses, reviews, and media; can suspend/ban users.",
    permissions: [
      "business.view", "business.approve", "business.reject", "business.edit", "business.merge",
      "review.view", "review.approve", "review.reject", "review.delete",
      "media.view", "media.approve", "media.reject",
      "user.view", "user.suspend", "user.ban", "user.unban",
      "flag.view", "search.view", "audit.view",
      // Moderators curate the catalogue and read legal state, but publishing a
      // legal version stays with super_admin.
      "category.manage", "legal.view",
      // Same operator who approves a pending business is exactly who should
      // see the queue that tells them one is waiting.
      "notification.view"
    ]
  },
  {
    slug: "merchant_success",
    name: "Merchant Success",
    description: "Moves qualified demand through company connection and trusted listing activation.",
    permissions: [
      "business.view", "business.approve", "business.reject", "business.edit", "business.connect",
      "waitlist.view", "waitlist.manage",
      "outbox.view", "outbox.create", "outbox.retry",
      "signature.view", "signature.create",
      "review.view", "audit.view", "notification.view"
    ]
  },
  {
    slug: "support",
    name: "Support",
    description: "Assists users; can view PII, suspend, and impersonate for support.",
    permissions: [
      "user.view", "user.suspend", "user.impersonate",
      "review.view", "business.view", "audit.view"
    ]
  },
  {
    slug: "analyst",
    name: "Analyst",
    description: "Read-only access to analytics and operational data.",
    permissions: [
      "analytics.view", "business.view", "review.view", "user.view",
      "search.view", "flag.view", "audit.view"
    ]
  }
];

async function main() {
  const isLocalDevelopment = process.env.NODE_ENV === "development";
  const bootstrap = {
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    clerkId: process.env.BOOTSTRAP_ADMIN_CLERK_ID,
    name: process.env.BOOTSTRAP_ADMIN_NAME
  };

  if (!isLocalDevelopment && Object.values(bootstrap).some((value) => !value?.trim())) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_CLERK_ID, and BOOTSTRAP_ADMIN_NAME must be set explicitly outside NODE_ENV=development; refusing fallback identity"
    );
  }

  // 1) Permissions
  for (const [slug, category, description] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug },
      update: { category, description },
      create: { slug, category, description }
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const bySlug = new Map(allPermissions.map((p) => [p.slug, p.id]));

  // 2) Roles + role→permission wiring
  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { slug: role.slug, name: role.name, description: role.description, isSystem: true }
    });

    const wanted =
      role.permissions === "*" ? allPermissions.map((p) => p.slug) : role.permissions;

    await prisma.rolePermission.deleteMany({ where: { roleId: record.id } });
    await prisma.rolePermission.createMany({
      data: wanted
        .filter((slug) => bySlug.has(slug))
        .map((slug) => ({ roleId: record.id, permissionId: bySlug.get(slug)! })),
      skipDuplicates: true
    });
  }

  // 3) Bootstrap super_admin
  const email = (bootstrap.email ?? "tursunovsunnatilla223@gmail.com").toLowerCase();
  const name = bootstrap.name ?? "Sunnatilla Tursunov";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const clerkId = bootstrap.clerkId ?? existingUser?.clerkId ?? `bootstrap-${email}`;

  const superRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super_admin" } });

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { clerkId, name, isActive: true, userId: existingUser?.id ?? undefined },
    create: { email, clerkId, name, isActive: true, userId: existingUser?.id ?? undefined }
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: admin.id, roleId: superRole.id } },
    update: {},
    create: { adminUserId: admin.id, roleId: superRole.id }
  });

  console.log(`Seeded ${PERMISSIONS.length} permissions, ${ROLES.length} roles.`);
  console.log(`Bootstrap super_admin: ${admin.email} (clerkId=${admin.clerkId}, linkedUser=${admin.userId ?? "none"})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
