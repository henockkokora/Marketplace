const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction 
  ? 'https://marketplace-9l4q.onrender.com/api' 
  : 'http://localhost:4000/api';

export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  ORDERS: '/orders',
  AUTH: '/auth',
  NEWSLETTER: '/newsletter',
  ANALYTICS: '/analytics'
};

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
