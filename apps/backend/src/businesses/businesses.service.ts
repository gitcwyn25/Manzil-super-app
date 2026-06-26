import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { category?: string; latitude?: number; longitude?: number }) {
    return this.prisma.business.findMany({
      where: {
        status: 'CLAIMED',
        ...(filters?.category && { category: { name: filters.category } }),
      },
      include: {
        category: true,
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
        photos: { take: 5 },
      },
    });
  }

  async findOne(id: string, locale: string = 'uz') {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: { orderBy: { createdAt: 'desc' } },
        photos: true,
        claimedBy: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.business.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }

  async claimBusiness(businessId: string, userId: string) {
    return this.prisma.claim.create({
      data: {
        businessId,
        userId,
        status: 'PENDING',
        verificationMethod: 'PHONE',
      },
    });
  }
}
