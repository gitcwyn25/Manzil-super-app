import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent seed for the admin platform: permissions, roles, role→permission
 * wiring, and a bootstrap super_admin.
 *
 * Bootstrap admin is resolved from env, falling back to the known launch admin:
 *   BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_CLERK_ID, BOOTSTRAP_ADMIN_NAME
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
  ["payout.approve", "payout", "Approve business payouts (reserved for future billing)"]
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
      "flag.view", "search.view", "audit.view"
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
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "tursunovsunnatilla223@gmail.com").toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Sunnatilla Tursunov";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const clerkId = process.env.BOOTSTRAP_ADMIN_CLERK_ID ?? existingUser?.clerkId ?? `bootstrap-${email}`;

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
