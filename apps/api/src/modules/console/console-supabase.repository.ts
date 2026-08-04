import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { SupabaseStorageService } from "../media/supabase-storage.service";
import { writeAudit } from "./audit.util";

type ActorCtx = { adminId: string; ip?: string | null };

/** Minimal shape every Prisma model delegate this repository touches must
 * satisfy — just enough to read rows and count them. Used only to constrain
 * `TABLE_ALLOWLIST` below at compile time; never used to build a query from
 * a string that isn't already a key of that allowlist. */
type BrowsableDelegate = {
  count: () => Promise<number>;
  findMany: (args: { take: number; skip: number }) => Promise<Array<Record<string, unknown>>>;
};

type ModelDelegateKey = {
  [K in keyof PrismaService]: PrismaService[K] extends BrowsableDelegate ? K : never;
}[keyof PrismaService];

/**
 * The entire security boundary for `GET /console/supabase/tables/:table`.
 *
 * The route handler only ever does `prisma[TABLE_ALLOWLIST[table]]` — never a
 * query built from a raw path segment — so a request for any table not
 * listed here (or for anything that isn't a Prisma model at all, e.g. an
 * attempted SQL fragment) 400s before touching the database.
 *
 * `satisfies Record<string, ModelDelegateKey>` means a typo'd value (a
 * string that isn't an actual Prisma delegate property) fails
 * `npm run typecheck`, not a request at runtime.
 *
 * Deliberately excludes: pure many-to-many join rows with no independent
 * meaning to an operator browsing data (`RolePermission`, `AdminUserRole`,
 * `ReviewHelpfulVote`, `CustomerVisit`), and high-volume/low-value
 * operational logs (`PhoneVerification`, `SearchQueryLog`, `BusinessVisit`,
 * `BusinessEvent`). Every other model is here — this is a database browser,
 * not a curated report, so the default is "included" rather than "opt in".
 */
const TABLE_ALLOWLIST = {
  users: "user",
  businesses: "business",
  categories: "category",
  reviews: "review",
  reviewReplies: "reviewReply",
  photos: "photo",
  claims: "claim",
  announcements: "announcement",
  businessPackages: "businessPackage",
  customers: "customer",
  businessSubscriptions: "businessSubscription",
  reports: "report",
  adminUsers: "adminUser",
  roles: "role",
  permissions: "permission",
  auditLogs: "auditLog",
  adminNotifications: "adminNotification",
  featureFlags: "featureFlag",
  plans: "plan",
  planFeatures: "planFeature",
  businessStaff: "businessStaff",
  businessVerifications: "businessVerification",
  bookings: "booking",
  payments: "payment",
  legalDocuments: "legalDocument",
  legalAcceptances: "legalAcceptance",
  contracts: "contract",
  campaigns: "campaign",
  campaignSends: "campaignSend",
  waitlistSignups: "waitlistSignup"
} satisfies Record<string, ModelDelegateKey>;

export type AllowlistedTable = keyof typeof TABLE_ALLOWLIST;

export const ALLOWLISTED_TABLE_NAMES: AllowlistedTable[] = Object.keys(
  TABLE_ALLOWLIST
) as AllowlistedTable[];

/** Column-name patterns that never leave this endpoint in plaintext. Matched
 * case-insensitively against the column name anywhere in the string, so
 * `email`, `businessEmail`, `phone`, `customerPhone`, `passwordHash`,
 * `stripeSecretKey`, and `refreshToken` are all caught by one of these. */
const REDACT_PATTERNS = [/passwordhash/i, /secret/i, /token/i, /email/i, /phone/i];

const REDACTED_PLACEHOLDER = "•••• redacted ••••";

function shouldRedactColumn(column: string): boolean {
  return REDACT_PATTERNS.some((pattern) => pattern.test(column));
}

/** Replaces every sensitive column's value with a fixed placeholder, leaving
 * `null`/`undefined` alone so an admin can still tell "no phone on file"
 * apart from "phone redacted". */
function redactRow(row: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(row)) {
    redacted[column] = shouldRedactColumn(column) && value !== null && value !== undefined
      ? REDACTED_PLACEHOLDER
      : value;
  }
  return redacted;
}

/**
 * Read-only Supabase/Postgres browser for the admin console.
 *
 * Hard rules, enforced by construction rather than by convention:
 *  - No endpoint here accepts a SQL string, ever — every read goes through
 *    Prisma's typed `count()`/`findMany()`, which removes injection surface
 *    entirely rather than trying to sanitise it.
 *  - `:table` is validated against `TABLE_ALLOWLIST` before it touches
 *    anything, never interpolated into a query.
 *  - Every call writes an `AuditLog` row — browsing production data,
 *    including other people's PII, is an auditable act, not a passive one.
 */
@Injectable()
export class ConsoleSupabaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupabaseStorageService
  ) {}

  isAllowlistedTable(table: string): table is AllowlistedTable {
    return Object.prototype.hasOwnProperty.call(TABLE_ALLOWLIST, table);
  }

  private delegateFor(table: AllowlistedTable): BrowsableDelegate {
    const key = TABLE_ALLOWLIST[table];
    return this.prisma[key] as unknown as BrowsableDelegate;
  }

  /** Table names with row counts, plus the storage bucket summary — one
   * round trip for the data-browser landing page. */
  async overview(ctx: ActorCtx) {
    const tables = await Promise.all(
      ALLOWLISTED_TABLE_NAMES.map(async (table) => ({
        table,
        rowCount: await this.delegateFor(table).count()
      }))
    );

    const storage = await this.storageService.getStorageOverview();

    await writeAudit(this.prisma, {
      actorId: ctx.adminId,
      action: "supabase.overview.view",
      targetType: "supabase",
      ipAddress: ctx.ip
    });

    return { tables, storage };
  }

  /** Rows from one allowlisted table, redacted, paginated. Throws
   * `BadRequestException` for anything not in `TABLE_ALLOWLIST` — the guard
   * for the entire endpoint. */
  async tableRows(table: string, rawLimit: number, rawOffset: number, ctx: ActorCtx) {
    if (!this.isAllowlistedTable(table)) {
      throw new BadRequestException(
        `Unknown or non-browsable table "${table}". Allowed: ${ALLOWLISTED_TABLE_NAMES.join(", ")}`
      );
    }

    const take = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const skip = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;

    const delegate = this.delegateFor(table);
    const [rows, totalCount] = await Promise.all([
      delegate.findMany({ take, skip }),
      delegate.count()
    ]);

    await writeAudit(this.prisma, {
      actorId: ctx.adminId,
      action: "supabase.table.view",
      targetType: "supabase_table",
      targetId: table,
      afterState: { limit: take, offset: skip },
      ipAddress: ctx.ip
    });

    return {
      table,
      rows: rows.map(redactRow),
      totalCount,
      limit: take,
      offset: skip
    };
  }

  /** Buckets, object counts, and total bytes — no row data, so nothing here
   * needs redaction. */
  async storageOverview(ctx: ActorCtx) {
    const storage = await this.storageService.getStorageOverview();

    await writeAudit(this.prisma, {
      actorId: ctx.adminId,
      action: "supabase.storage.view",
      targetType: "supabase_storage",
      ipAddress: ctx.ip
    });

    return storage;
  }
}
