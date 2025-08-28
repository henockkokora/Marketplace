// Configuration des environnements
const isProduction = process.env.NODE_ENV === 'production';

// Utilise la variable d'environnement en priorité (Next.js côté client nécessite NEXT_PUBLIC_)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

// Logs pour débogage
if (typeof window !== 'undefined') {
  console.log('Environnement (client):', process.env.NODE_ENV);
  console.log('URL de l\'API (client):', API_BASE_URL);
} else {
  console.log('Environnement (serveur):', process.env.NODE_ENV);
  console.log('URL de l\'API (serveur):', API_BASE_URL);
}

export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  ORDERS: '/orders',
  AUTH: '/auth',
  NEWSLETTER: '/newsletter',
  ANALYTICS: '/analytics',
  SUBCATEGORIES: '/subcategories',
};

export const getApiUrl = (endpoint = '') => {
  if (!API_BASE_URL) {
    console.error(
      'API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_BASE_URL in your environment variables.'
    );
    return endpoint;
  }

  // Si endpoint est déjà une URL absolue (http ou https), retourne-le tel quel
  if (/^https?:\/\//.test(endpoint)) {
    return endpoint;
  }

  // Supprime les slashes en double
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');

  return `${cleanBaseUrl}/${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
};
