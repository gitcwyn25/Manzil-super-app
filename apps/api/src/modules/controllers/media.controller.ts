import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { isBusinessOwner } from "../media/business-ownership";
import { getBusinessCoversBySlug } from "../media/business-cover";
import { MEDIA_STORAGE, type MediaStorage } from "../media/media-storage";
import { PresignUploadDto } from "../media/presign-upload.dto";
import { PUBLICLY_VISIBLE_BUSINESS } from "../business-visibility";
import { extensionForType, type AllowedImageType } from "../media/upload-policy";
import { PrismaService } from "../prisma.service";
import { ThrottleUpload, ThrottleWrite } from "../security/throttle.config";

@Controller("media")
export class MediaController {
  constructor(
    @Inject(MEDIA_STORAGE) private readonly presign: MediaStorage,
    private readonly prisma: PrismaService
  ) {}

  @Post("presign")
  @ThrottleUpload()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createPresignedUpload(@Body() body: PresignUploadDto, @Req() request: ManzilRequest) {
    const { ownerType, ownerId, contentType, contentLength } = body;
    const actor = request.manzilActor!;

    // Type and size are already validated by PresignUploadDto; the extension is
    // derived from the accepted MIME type so it can never disagree with it.
    const extension = extensionForType(contentType as AllowedImageType);

    // Verify the target exists before issuing an upload URL.
    let businessId: string | undefined;
    let reviewId: string | undefined;

    // Server-side claim only — never a client-supplied flag. Resolved from the
    // same row the existence check already reads, so this is the one place a
    // Photo is created and the one place that decides its trust level.
    let isOwnerUpload = false;

    if (ownerType === "business") {
      const business = await this.prisma.business.findFirst({
        where: { OR: [{ id: ownerId }, { slug: ownerId }] },
        select: { id: true, status: true, claimedByUserId: true, createdByUserId: true }
      });
      if (!business) {
        throw new BadRequestException("Target business not found");
      }
      businessId = business.id;
      isOwnerUpload = isBusinessOwner(business, actor.userId);
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
    const { uploadUrl, publicUrl, requiredHeaders } = await this.presign.presignUpload(storageKey, {
      contentType,
      contentLength
    });

    // Owner photos of their own (claimed, or still-pending-claim self
    // registered) business auto-approve — there is no moderation queue yet,
    // and a stranger uploading to someone else's business is a different risk
    // from an owner photographing their own. Review photos always stay
    // pending regardless of who uploaded them.
    const moderationStatus: "pending" | "approved" =
      businessId && isOwnerUpload ? "approved" : "pending";

    // The cover check and the create happen together: there is no partial
    // unique index on (businessId, isCover) — Postgres would treat every
    // `false` as distinct — so "first approved upload becomes cover" is an
    // application-level invariant, and this transaction is what keeps the
    // read-then-write from racing a concurrent upload to the same business.
    const photo = await this.prisma.$transaction(async (tx) => {
      let isCover = false;

      if (businessId && moderationStatus === "approved") {
        const existingCover = await tx.photo.findFirst({
          where: { businessId, isCover: true },
          select: { id: true }
        });
        isCover = !existingCover;
      }

      return tx.photo.create({
        data: {
          storageKey,
          publicUrl,
          moderationStatus,
          businessId,
          reviewId,
          isCover
        }
      });
    });

    return {
      data: {
        photoId: photo.id,
        uploadUrl,
        // The PUT must send these exact headers or R2 rejects the signature.
        requiredHeaders,
        storageKey,
        publicUrl,
        moderationStatus: photo.moderationStatus,
        isCover: photo.isCover
      }
    };
  }

  /**
   * Sets a photo as its business's cover, clearing whichever photo held that
   * spot before — in one transaction, since that pair is the only thing
   * standing in for a unique index here (see the schema comment on
   * `Photo.isCover`).
   */
  @Post("photos/:id/cover")
  @ThrottleWrite()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async setCoverPhoto(@Param("id") id: string, @Req() request: ManzilRequest) {
    const actor = request.manzilActor!;

    const photo = await this.prisma.photo.findUnique({
      where: { id },
      select: { id: true, businessId: true, moderationStatus: true }
    });

    if (!photo || !photo.businessId) {
      throw new NotFoundException("Photo not found");
    }

    const business = await this.prisma.business.findUnique({
      where: { id: photo.businessId },
      select: { claimedByUserId: true, createdByUserId: true, status: true }
    });

    if (!business || !isBusinessOwner(business, actor.userId)) {
      throw new ForbiddenException("Only the business owner can set the cover photo");
    }

    // A pending or rejected photo isn't served anywhere yet, so letting it
    // become "the cover" would just silently blank the business's photo
    // until it clears review.
    if (photo.moderationStatus !== "approved") {
      throw new BadRequestException("Only an approved photo can be set as the cover");
    }

    const businessId = photo.businessId;

    await this.prisma.$transaction([
      this.prisma.photo.updateMany({
        where: { businessId, isCover: true, id: { not: id } },
        data: { isCover: false }
      }),
      this.prisma.photo.update({
        where: { id },
        data: { isCover: true }
      })
    ]);

    return { data: { photoId: id, isCover: true } };
  }

  /**
   * Lists a business's own photos for its owner — the register/photos step
   * and dashboard/settings' photo manager both read this to render existing
   * thumbnails and offer "make cover" on the approved ones.
   */
  @Get("photos")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async listBusinessPhotos(
    @Query("business") businessIdOrSlug: string | undefined,
    @Req() request: ManzilRequest
  ) {
    const actor = request.manzilActor!;

    if (!businessIdOrSlug) {
      throw new BadRequestException("business is required");
    }

    const business = await this.prisma.business.findFirst({
      where: { OR: [{ id: businessIdOrSlug }, { slug: businessIdOrSlug }] },
      select: { id: true, status: true, claimedByUserId: true, createdByUserId: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (!isBusinessOwner(business, actor.userId)) {
      throw new ForbiddenException("Only the business owner can view its photos");
    }

    const photos = await this.prisma.photo.findMany({
      where: { businessId: business.id },
      orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
      select: { id: true, publicUrl: true, moderationStatus: true, isCover: true, createdAt: true }
    });

    return { data: { photos } };
  }

  /**
   * Public batch lookup for cards and carousels: given a set of business
   * slugs, returns the approved cover URL for each one that has one. Absent
   * entries mean "no cover yet" — callers fall back to their gradient.
   */
  @Get("business-covers")
  async getBusinessCovers(@Query("slugs") slugsParam?: string) {
    const slugs = (slugsParam ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);

    const covers = await getBusinessCoversBySlug(this.prisma, slugs);

    return { data: { covers } };
  }

  /**
   * Public gallery for a business profile page.
   *
   * Distinct from `GET photos`, which is owner-only and returns pending and
   * rejected photos too so an owner can see what they uploaded. This returns
   * approved photos only: a pending photo has not been vetted, and showing one
   * publicly would make the moderation status meaningless.
   *
   * Cover first, then newest, so the gallery's lead image matches the one the
   * cards and carousel already show for this business.
   */
  @Get("businesses/:slug/photos")
  async getPublicBusinessPhotos(@Param("slug") slug: string) {
    const business = await this.prisma.business.findFirst({
      // Full visibility predicate, not just the merge check: a suspended
      // listing 404s on its own URL, so its gallery must 404 too.
      where: { OR: [{ id: slug }, { slug }], ...PUBLICLY_VISIBLE_BUSINESS },
      select: { id: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const photos = await this.prisma.photo.findMany({
      where: { businessId: business.id, moderationStatus: "approved", publicUrl: { not: null } },
      orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: { id: true, publicUrl: true, isCover: true }
    });

    return { data: { photos } };
  }
}
