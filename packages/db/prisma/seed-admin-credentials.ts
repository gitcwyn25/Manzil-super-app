import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

/**
 * Seeds (idempotently) the credential-based bootstrap admin — the one admin
 * operator who signs in with a username/password instead of Clerk. Source of
 * truth is the gitignored root `.env`:
 *
 *   ADMIN_BOOTSTRAP_USERNAME
 *   ADMIN_BOOTSTRAP_PASSWORD
 *
 * Both are required; there is deliberately no fallback value, unlike
 * `seed-admin.ts`'s Clerk-based bootstrap — a credential admin with no
 * fallback username/password is the whole point (nothing to hardcode, nothing
 * to leak into git). The plaintext password is hashed immediately below and
 * never logged or persisted — only the `AdminUser.passwordHash` derivation is
 * written to the database.
 *
 * Run from the repo root:
 *   npx tsx packages/db/prisma/seed-admin-credentials.ts
 *
 * Requires the main admin-platform seed (`seed-admin.ts`) to have run first —
 * this script assigns existing roles, it does not create any.
 */

// Duplicated from apps/api/src/env.ts rather than imported: this script lives
// in a different workspace (packages/db) and is invoked directly via `tsx`,
// not through the API's bootstrap, so there is no other point where root
// `.env` gets loaded into process.env for it.
function loadRootEnv() {
  const envPath = resolve(__dirname, "../../../.env"); // packages/db/prisma -> repo root
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

const prisma = new PrismaClient();

// Same scrypt scheme as apps/api/src/modules/console/admin-password.util.ts
// (`hashPassword`/`verifyPassword`) — duplicated rather than imported across
// the workspace boundary. Keep the two in sync if the format ever changes.
const KEY_LENGTH = 64;
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

async function main() {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD must both be set in the root .env — refusing to seed a credential admin without them."
    );
  }

  // Hashed immediately; `password` itself is not referenced again below and
  // is never written to the database, a log line, or a return value.
  const passwordHash = hashPassword(password);

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { slug: "super_admin" },
        { permissions: { some: { permission: { slug: "business.approve" } } } }
      ]
    },
    select: { id: true, slug: true }
  });

  if (roles.length === 0) {
    throw new Error(
      "No role holds business.approve and no super_admin role exists yet. Run the admin-platform seed first: npx tsx packages/db/prisma/seed-admin.ts"
    );
  }

  // Synthetic, deterministic placeholder — AdminUser.email is required and
  // unique, but a credential-only admin has no real Clerk-linked mailbox.
  const email = `${username}@admin.manzil.local`;

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, isActive: true },
    create: {
      username,
      passwordHash,
      email,
      name: username,
      isActive: true
    }
  });

  for (const role of roles) {
    await prisma.adminUserRole.upsert({
      where: { adminUserId_roleId: { adminUserId: admin.id, roleId: role.id } },
      update: {},
      create: { adminUserId: admin.id, roleId: role.id }
    });
  }

  console.log(
    `Seeded credential-based bootstrap admin "${username}" (id=${admin.id}) with roles: ${roles.map((r) => r.slug).join(", ")}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
