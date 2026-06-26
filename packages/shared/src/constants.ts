export const BUSINESS_CATEGORIES = [
  { id: 'restaurants', icon: '🍽️' },
  { id: 'cafes', icon: '☕' },
  { id: 'beauty', icon: '💇' },
  { id: 'healthcare', icon: '⚕️' },
  { id: 'auto', icon: '🚗' },
  { id: 'fitness', icon: '💪' },
];

export const PRICE_TIERS = ['BUDGET', 'MODERATE', 'EXPENSIVE', 'LUXURY'];

export const SUBSCRIPTION_TIERS = {
  STARTER: {
    name: 'Starter',
    price: 0,
    features: ['Profile', 'Reviews', 'Photos'],
  },
  GROWTH: {
    name: 'Growth',
    price: 9.99,
    features: ['Profile', 'Reviews', 'Photos', 'Analytics', 'Messaging'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 29.99,
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
