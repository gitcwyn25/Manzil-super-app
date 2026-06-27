import { Injectable, NotFoundException } from "@nestjs/common";
import {
  businesses,
  categories,
  findBusiness,
  getBusinessReviews,
  reviews,
  searchBusinesses,
  type ClaimCreateRequest,
  type ReviewCreateRequest
} from "@manzil/shared";

@Injectable()
export class DemoRepository {
  listCategories() {
    return categories;
  }

  search(query = "", category = "all") {
    return searchBusinesses(query, category);
  }

  listBusinesses() {
    return businesses;
  }

  getBusiness(slug: string) {
    const business = findBusiness(slug);

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return {
      business,
      reviews: getBusinessReviews(slug)
    };
  }

  listReviews() {
    return reviews;
  }

  createReview(input: ReviewCreateRequest) {
    const business = findBusiness(input.businessSlug);

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return {
      id: `demo_review_${Date.now()}`,
      businessSlug: input.businessSlug,
      authorName: "Demo User",
      authorBadge: "Beta reviewer",
      rating: input.rating,
      text: input.text,
      locale: "uz" as const,
      createdAt: new Date().toISOString(),
      helpfulCount: 0
    };
  }

  createClaim(input: ClaimCreateRequest) {
    return {
      id: `demo_claim_${Date.now()}`,
      status: "pending" as const,
      businessName: input.businessName
    };
  }
}
