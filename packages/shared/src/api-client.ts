import {
  Business,
  BusinessUpdateInput,
  Category,
  ModerationQueueItem,
  ModerationStatus,
  ReportStatus,
  Review,
  ReviewReply,
  SearchFilters
} from './types';

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
  private authToken?: string;

  constructor(baseURL: string = getDefaultBaseUrl()) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  private baseURL: string;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, unknown> } = {}
  ): Promise<{ data: T; status: number }> {
    const url = new URL(`${this.baseURL}${path}`);

    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = (await response.json()) as T;

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return { data, status: response.status };
  }

  // Businesses
  async getBusinesses(filters?: SearchFilters) {
    return this.request<{ data: Business[] }>('/businesses', { params: filters });
  }

  async getBusiness(id: string, locale?: string) {
    return this.request<{ data: Business }>(`/businesses/${id}`, {
      params: { locale },
    });
  }

  async createBusiness(data: Partial<Business>) {
    return this.request<{ data: Business }>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(id: string, data: BusinessUpdateInput) {
    return this.request<{ data: Business }>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async claimBusiness(id: string) {
    return this.request(`/businesses/${id}/claim`, { method: 'POST' });
  }

  // Reviews
  async getReviews(businessId: string) {
    return this.request<{ data: Review[] }>(`/businesses/${businessId}/reviews`);
  }

  async createReview(
    businessId: string,
    data: { rating: number; text: string }
  ) {
    return this.request<{ data: Review }>(`/businesses/${businessId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(reviewId: string, data: Partial<Review>) {
    return this.request<{ data: Review }>(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async replyToReview(reviewId: string, text: string) {
    return this.request<{ data: { reply: ReviewReply } }>(`/reviews/${reviewId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async reportReview(reviewId: string, reason: string) {
    return this.request<{ data: { report: ModerationQueueItem } }>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin moderation
  async getModerationQueue(status: ReportStatus = 'open') {
    return this.request<{ data: { reports: ModerationQueueItem[] } }>('/admin/moderation', {
      params: { status },
    });
  }

  async resolveReport(reportId: string, moderationStatus: ModerationStatus = 'rejected') {
    return this.request<{ data: { report: ModerationQueueItem } }>(`/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ moderationStatus }),
    });
  }

  async rejectReport(reportId: string) {
    return this.request<{ data: { report: ModerationQueueItem } }>(`/admin/reports/${reportId}/reject`, {
      method: 'POST',
      body: '{}',
    });
  }

  // Search
  async search(filters: SearchFilters) {
    return this.request<{ data: SearchResult }>('/search', { params: filters });
  }
}

export const apiClient = new ApiClient();
