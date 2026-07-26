import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";

export type CustomerSummary = {
  id: string;
  phone: string;
  name: string | null;
  lastVisitAt: string | null;
  visitCount: number;
  totalSpend: string;
  tags: string[];
  consentMarketing: boolean;
};

/**
 * Read-only customer directory (M0). Creation/editing is a later milestone —
 * Customer rows are populated by the booking-completion backfill/hook, never
 * written directly through this API.
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(slug: string, actor: AuthActor): Promise<CustomerSummary[]> {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const customers = await this.prisma.customer.findMany({
      where: { businessId: business.id },
      // Most recently active first; a Customer row without a recorded visit
      // (should not normally happen post-backfill) sorts last, not first.
      orderBy: [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { firstSeenAt: "desc" }],
      take: 500
    });

    return customers.map((customer) => ({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      lastVisitAt: customer.lastVisitAt ? customer.lastVisitAt.toISOString() : null,
      visitCount: customer.visitCount,
      totalSpend: customer.totalSpend.toString(),
      tags: customer.tags,
      consentMarketing: customer.consentMarketing
    }));
  }
}
