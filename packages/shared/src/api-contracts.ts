import type { Business, BusinessUpdateInput, Category, ClaimRequest, Review, ReviewCreateInput, ReviewReply } from "./types";

export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, string | number | boolean>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type SearchResponse = ApiEnvelope<{
  businesses: Business[];
  categories: Category[];
}>;

export type BusinessResponse = ApiEnvelope<{
  business: Business;
  reviews: Review[];
}>;

export type CategoriesResponse = ApiEnvelope<{
  categories: Category[];
}>;

export type ClaimCreateRequest = ClaimRequest;

export type ClaimCreateResponse = ApiEnvelope<{
  id: string;
  status: "pending";
}>;

export type ReviewCreateRequest = ReviewCreateInput;

export type ReviewCreateResponse = ApiEnvelope<{
  review: Review;
}>;

export type BusinessUpdateRequest = BusinessUpdateInput;

export type BusinessUpdateResponse = ApiEnvelope<{
  business: Business;
}>;

export type ReviewReplyCreateRequest = {
  text: string;
};

export type ReviewReplyCreateResponse = ApiEnvelope<{
  reply: ReviewReply;
}>;
