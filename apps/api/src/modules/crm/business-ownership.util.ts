import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";

/**
 * Resolves a business by slug and asserts the acting user may manage it —
 * the claimed owner, or (while still pending claim) whoever registered it, or
 * an admin. Shared by CrmRepository and CustomersRepository so the ownership
 * rule is defined once, not duplicated.
 */
export async function requireOwnedBusiness(prisma: PrismaService, slug: string, actor: AuthActor) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, slug: true, claimedByUserId: true, createdByUserId: true, status: true }
  });

  if (!business) {
    throw new NotFoundException("Business not found");
  }

  const isOwner =
    business.claimedByUserId === actor.userId ||
    (business.status === "pending_claim" && business.createdByUserId === actor.userId);

  if (actor.role !== "admin" && !isOwner) {
    throw new ForbiddenException("Only the business owner or an admin can manage this business");
  }

  return business;
}
