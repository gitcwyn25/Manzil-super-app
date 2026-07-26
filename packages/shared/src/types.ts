import type { LocalizedText } from "./locales";

export type UserRole = "consumer" | "business_owner" | "admin";
export type BusinessStatus = "unclaimed" | "pending_claim" | "claimed" | "suspended";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type ReportStatus = "open" | "resolved" | "rejected";

export type Category = {
  id: string;
  slug: string;
  name: LocalizedText;
  parentId?: string;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  description: LocalizedText;
  address: string;
  district: string;
  city: "Tashkent";
  phone?: string;
  lat?: number;
  lng?: number;
  hours: string;
  priceTier: "$" | "$$" | "$$$";
  status: BusinessStatus;
  avgRating: number;
  reviewCount: number;
  photo: string;
  tags: string[];
  foundingBusiness?: boolean;
};

export type BusinessUpdateInput = Partial<{
  name: string;
  description: Partial<LocalizedText>;
  address: string;
  district: string;
  phone: string;
  hours: string;
  priceTier: "$" | "$$" | "$$$";
}>;

export type ReviewReply = {
  id: string;
  reviewId: string;
  businessOwnerId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  businessSlug: string;
  authorName: string;
  authorBadge?: string;
  rating: number;
  text: string;
  locale: "uz" | "ru" | "en";
  createdAt: string;
  helpfulCount: number;
  /** True when the review is linked to a completed booking by this reviewer at this business. */
  verifiedVisit?: boolean;
  reply?: ReviewReply;
};

export type ClaimRequest = {
  businessSlug?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  note?: string;
};

export type ReviewCreateInput = {
  businessSlug: string;
  rating: number;
  text: string;
};

export type ReportTargetType = "review" | "photo";

export type ReportCreateInput = {
  reason: string;
};

export type ModerationQueueItem = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    displayName: string;
    email?: string;
  };
  review?: {
    id: string;
    businessSlug: string;
    text: string;
    rating: number;
    moderationStatus: ModerationStatus;
  };
  photo?: {
    id: string;
    storageKey: string;
    publicUrl?: string;
    moderationStatus: ModerationStatus;
  };
};

export type SearchFilters = {
  query?: string;
  category?: string;
  locale?: string;
};
