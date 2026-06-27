import axios, { AxiosInstance } from 'axios';
import { Business, Category, Review, SearchFilters } from './types';

type SearchResult = {
  businesses: Business[];
  categories: Category[];
};

function getDefaultBaseUrl() {
  const globalWithProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return globalWithProcess.process?.env?.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = getDefaultBaseUrl()) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Businesses
  async getBusinesses(filters?: SearchFilters) {
    return this.client.get<{ data: Business[] }>('/businesses', { params: filters });
  }

  async getBusiness(id: string, locale?: string) {
    return this.client.get<{ data: Business }>(`/businesses/${id}`, {
      params: { locale },
    });
  }

  async createBusiness(data: Partial<Business>) {
    return this.client.post<{ data: Business }>('/businesses', data);
  }

  async updateBusiness(id: string, data: Partial<Business>) {
    return this.client.patch<{ data: Business }>(`/businesses/${id}`, data);
  }

  async claimBusiness(id: string) {
    return this.client.post(`/businesses/${id}/claim`);
  }

  // Reviews
  async getReviews(businessId: string) {
    return this.client.get<{ data: Review[] }>(
      `/businesses/${businessId}/reviews`
    );
  }

  async createReview(
    businessId: string,
    data: { rating: number; text: string }
  ) {
    return this.client.post<{ data: Review }>(
      `/businesses/${businessId}/reviews`,
      data
    );
  }

  async updateReview(reviewId: string, data: Partial<Review>) {
    return this.client.patch<{ data: Review }>(`/reviews/${reviewId}`, data);
  }

  async replyToReview(reviewId: string, text: string) {
    return this.client.post(`/reviews/${reviewId}/replies`, { text });
  }

  // Search
  async search(filters: SearchFilters) {
    return this.client.get<{ data: SearchResult }>('/search', { params: filters });
  }
}

export const apiClient = new ApiClient();
