import { BadRequestException, Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { R2PresignService } from "../media/r2-presign.service";
import { PrismaService } from "../prisma.service";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

@Controller("media")
export class MediaController {
  constructor(
    private readonly presign: R2PresignService,
    private readonly prisma: PrismaService
  ) {}

  @Post("presign")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createPresignedUpload(
    @Body() body: { ownerType?: "business" | "review"; ownerId?: string; fileName?: string },
    @Req() request: ManzilRequest
  ) {
    const { ownerType, ownerId, fileName } = body;

    if (ownerType !== "business" && ownerType !== "review") {
      throw new BadRequestException('ownerType must be "business" or "review"');
    }

    if (!ownerId || !fileName) {
      throw new BadRequestException("ownerId and fileName are required");
    }

    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(`File type .${extension} is not allowed`);
    }

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
    const { uploadUrl, publicUrl } = this.presign.presignUpload(storageKey);

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
        storageKey,
        publicUrl,
        moderationStatus: photo.moderationStatus
      }
    };
  }
}
