import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingClaims() {
    return this.prisma.claim.findMany({
      where: { status: 'PENDING' },
      include: { business: true, user: true },
    });
  }

  async approveClaim(claimId: string) {
    const claim = await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'APPROVED' },
    });

    await this.prisma.business.update({
      where: { id: claim.businessId },
      data: { claimedBy: claim.userId, status: 'CLAIMED' },
    });

    return claim;
  }

  async rejectClaim(claimId: string) {
    return this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'REJECTED' },
    });
  }

  async getModerationQueue() {
    return this.prisma.report.findMany({
      where: { status: 'PENDING' },
      include: {
        reporterUser: true,
      },
    });
  }
}
