import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type BookingRow = {
  id: string;
  businessId: string;
  customerUserId: string | null;
  customerPhone: string;
  startsAt: Date;
  status: string;
  depositAmount: Prisma.Decimal | null;
  payment?: { amount: Prisma.Decimal; status: string } | null;
};

type AmbiguousRow = {
  bookingId: string;
  businessId: string;
  customerPhone: string;
  reason: string;
};

function canonicalPhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("998")) return `+${digits.slice(0, 12)}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  return null;
}

function spendForBooking(booking: BookingRow) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  // Only fall back to the raw deposit when there is no payment record at all —
  // a payment that exists but is failed/refunded must count as zero, not the
  // pre-refund deposit amount.
  if (!booking.payment && booking.depositAmount) return booking.depositAmount;
  return new Prisma.Decimal(0);
}

async function main() {
  const apply = process.argv.includes("--apply");

  const bookings = await prisma.booking.findMany({
    where: { customerId: null },
    include: { payment: { select: { amount: true, status: true } } },
    orderBy: [{ businessId: "asc" }, { startsAt: "asc" }]
  });

  const ambiguous: AmbiguousRow[] = [];
  const grouped = new Map<string, BookingRow[]>();

  for (const booking of bookings) {
    const phone = canonicalPhone(booking.customerPhone);
    if (!phone) {
      ambiguous.push({
        bookingId: booking.id,
        businessId: booking.businessId,
        customerPhone: booking.customerPhone,
        reason: "customerPhone could not be canonicalized"
      });
      continue;
    }

    const key = `${booking.businessId}|${phone}`;
    const rows = grouped.get(key) ?? [];
    rows.push(booking);
    grouped.set(key, rows);
  }

  if (ambiguous.length > 0) {
    console.error("Customer backfill stopped. Ambiguous booking rows must be fixed first:");
    console.table(ambiguous);
    process.exitCode = 1;
    return;
  }

  const summary = {
    bookingsScanned: bookings.length,
    customersToUpsert: grouped.size,
    apply
  };
  console.log("Customer backfill summary:", summary);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to create Customer rows and link Booking.customerId.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const [key, rows] of grouped.entries()) {
      const [businessId, phone] = key.split("|");
      const firstSeenAt = rows[0].startsAt;
      const lastVisitAt = rows.reduce((latest, row) => (row.startsAt > latest ? row.startsAt : latest), rows[0].startsAt);
      const visitCount = rows.filter((row) => row.status === "completed").length || rows.length;
      const totalSpend = rows.reduce((sum, row) => sum.plus(spendForBooking(row)), new Prisma.Decimal(0));
      const userIds = [...new Set(rows.map((row) => row.customerUserId).filter(Boolean))] as string[];
      const userId = userIds.length === 1 ? userIds[0] : null;

      const customer = await tx.customer.upsert({
        where: { businessId_phone: { businessId, phone } },
        update: {
          userId,
          firstSeenAt,
          lastVisitAt,
          visitCount,
          totalSpend
        },
        create: {
          businessId,
          userId,
          phone,
          firstSeenAt,
          lastVisitAt,
          visitCount,
          totalSpend,
          tags: []
        }
      });

      for (const row of rows) {
        await tx.booking.update({
          where: { id: row.id },
          data: { customerId: customer.id }
        });

        await tx.customerVisit.upsert({
          where: { bookingId: row.id },
          update: {
            businessId,
            customerId: customer.id,
            occurredAt: row.startsAt
          },
          create: {
            businessId,
            customerId: customer.id,
            bookingId: row.id,
            source: "booking_backfill",
            occurredAt: row.startsAt
          }
        });
      }
    }
  });

  console.log("Customer backfill complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
