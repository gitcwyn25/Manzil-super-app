import { BadRequestException, Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { R2PresignService } from "../media/r2-presign.service";
import { PresignUploadDto } from "../media/presign-upload.dto";
import { extensionForType, type AllowedImageType } from "../media/upload-policy";
import { PrismaService } from "../prisma.service";
import { ThrottleUpload } from "../security/throttle.config";

@Controller("media")
export class MediaController {
  constructor(
    private readonly presign: R2PresignService,
    private readonly prisma: PrismaService
  ) {}

  @Post("presign")
  @ThrottleUpload()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createPresignedUpload(@Body() body: PresignUploadDto, @Req() request: ManzilRequest) {
    const { ownerType, ownerId, contentType, contentLength } = body;

    // Type and size are already validated by PresignUploadDto; the extension is
    // derived from the accepted MIME type so it can never disagree with it.
    const extension = extensionForType(contentType as AllowedImageType);

    // Verify the target exists before issuing an upload URL.
    let businessId: string | undefined;
    let reviewId: string | undefined;

    if (ownerType === "business") {
      const business = await this.prisma.business.findFirst({
        where: { OR: [{ id: ownerId }, { slug: ownerId }] },
        select: { id: true }
      });
      if (!business) {
        throw new BadRequestException("Target business not found");
      }
      businessId = business.id;
    } else {
      const review = await this.prisma.review.findUnique({
        where: { id: ownerId },
        select: { id: true }
      });
      if (!review) {
        throw new BadRequestException("Target review not found");
      }
      reviewId = review.id;
    }

    // Never trust the client-supplied file name for the storage path.
    const storageKey = `${ownerType}/${businessId ?? reviewId}/${randomUUID()}.${extension}`;
    const { uploadUrl, publicUrl, requiredHeaders } = this.presign.presignUpload(storageKey, {
      contentType,
      contentLength
    });

    const photo = await this.prisma.photo.create({
      data: {
        storageKey,
        publicUrl,
        moderationStatus: "pending",
        businessId,
        reviewId
      }
    });

    return {
      data: {
        photoId: photo.id,
        uploadUrl,
        // The PUT must send these exact headers or R2 rejects the signature.
        requiredHeaders,
        storageKey,
        publicUrl,
        moderationStatus: photo.moderationStatus
      }
    };
  }
}
