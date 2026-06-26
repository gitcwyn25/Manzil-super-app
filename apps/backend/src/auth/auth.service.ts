import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async verifyClerkToken(token: string) {
    // TODO: Integrate with Clerk API for token verification
    // For now, verify JWT locally
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getOrCreateUser(clerkUserId: string, email: string, name: string) {
    const user = await this.prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {},
      create: {
        clerkId: clerkUserId,
        email,
        displayName: name,
        role: 'CONSUMER',
        locale: 'uz',
      },
    });
    return user;
  }
}
