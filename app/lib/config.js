// Configuration des environnements
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// URL de base de l'API
let API_BASE_URL = 'https://marketplace-9l4q.onrender.com';

// Log pour le débogage
if (typeof window !== 'undefined') {
  console.log('Environnement:', process.env.NODE_ENV);
  console.log('URL de l\'API (client):', API_BASE_URL);
} else {
  console.log('Environnement:', process.env.NODE_ENV);
  console.log('URL de l\'API (serveur):', API_BASE_URL);
}

// Log pour le débogage
if (typeof window !== 'undefined') {
  console.log('Environnement:', process.env.NODE_ENV);
  console.log('URL de l\'API:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  ORDERS: '/orders',
  AUTH: '/auth',
  NEWSLETTER: '/newsletter',
  ANALYTICS: '/analytics',
  // Ajoutez d'autres points de terminaison si nécessaire
};

/**
 * Génère une URL complète pour un point de terminaison d'API
 * @param {string} endpoint - Le point de terminaison de l'API
 * @returns {string} L'URL complète
 */
export const getApiUrl = (endpoint = '') => {
  if (!API_BASE_URL) {
    console.error('API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL environment variable.');
    return endpoint;
  }
  
  // Supprime les slashes en double
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  return `${cleanBaseUrl}/${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
};
