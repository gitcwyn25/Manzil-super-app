// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'CONSUMER' | 'BUSINESS_OWNER' | 'ADMIN';
  locale: 'uz' | 'ru' | 'en';
  createdAt: Date;
}

// Business types
export interface Business {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: Record<string, string>;
  priceTier: 'BUDGET' | 'MODERATE' | 'EXPENSIVE' | 'LUXURY';
  status: 'UNCLAIMED' | 'CLAIMED' | 'PENDING';
  claimedByUserId?: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export interface Review {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  text: string;
  photos: string[];
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  businessOwnerId: string;
  text: string;
  createdAt: Date;
}

// Search types
export interface SearchFilters {
  query?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  locale?: 'uz' | 'ru' | 'en';
}

export interface SearchResult {
  businesses: Business[];
  total: number;
  page: number;
}

// Category types
export interface Category {
  id: string;
  name: Record<string, string>; // { uz: string, ru: string, en: string }
  icon?: string;
  parentId?: string;
}

// Claim types
export interface Claim {
  id: string;
  businessId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationMethod: 'PHONE' | 'EMAIL' | 'MANUAL';
  createdAt: Date;
  reviewedAt?: Date;
}

// Photo types
export interface Photo {
  id: string;
  url: string;
  ownerType: 'BUSINESS' | 'REVIEW';
  ownerId: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  businessId: string;
  tier: 'STARTER' | 'GROWTH' | 'PREMIUM';
  renewalDate: Date;
  createdAt: Date;
}

// Social types
export interface Follow {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

export interface Save {
  id: string;
  userId: string;
  businessId: string;
  createdAt: Date;
}

// Achievements
export interface Achievement {
  id: string;
  key: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
}
