export const BUSINESS_CATEGORIES = [
  { id: 'restaurants', icon: '🍽️' },
  { id: 'cafes', icon: '☕' },
  { id: 'beauty', icon: '💇' },
  { id: 'healthcare', icon: '⚕️' },
  { id: 'auto', icon: '🚗' },
  { id: 'fitness', icon: '💪' },
];

export const PRICE_TIERS = ['BUDGET', 'MODERATE', 'EXPENSIVE', 'LUXURY'];

/**
 * Plan names mirror the API tier schema. Paid amounts are deliberately not
 * duplicated here; the API is the source of truth for active pricing.
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: ['Profile', 'Reviews', 'Photos'],
  },
  PRO: {
    name: 'Pro',
    price: null,
    features: ['Profile', 'Reviews', 'Photos', 'Analytics', 'Messaging'],
  },
  MAX: {
    name: 'Max',
    price: null,
    features: [
      'Profile',
      'Reviews',
      'Photos',
      'Analytics',
      'Messaging',
      'Sponsored',
    ],
  },
};

export const LOCALES = ['uz', 'ru', 'en'];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
