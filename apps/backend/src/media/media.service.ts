import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class MediaService {
  private logger = new Logger('MediaService');

  constructor(private prisma: PrismaService) {}

  async uploadPhoto(file: Express.Multer.File, ownerId: string, ownerType: string) {
    // TODO: Upload to R2 and get URL
    const mockUrl = `https://manzil-media.example.com/${file.originalname}`;

    const photo = await this.prisma.photo.create({
      data: {
        ownerType,
        ownerId,
        storageUrl: mockUrl,
        moderationStatus: 'PENDING',
      },
    });

    return photo;
  }

  async approvePhoto(photoId: string) {
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'APPROVED' },
    });
  }

  async rejectPhoto(photoId: string) {
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'REJECTED' },
    });
  }
}
