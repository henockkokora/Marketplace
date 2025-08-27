/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: [
      'localhost',
      'res.cloudinary.com',
      'marketplace-9l4q.onrender.com',  // Votre backend
      'votre-nom-de-domaine.com'       // Votre domaine personnalisé si vous en avez un
    ].filter(Boolean),  // Filtre les valeurs vides
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Désactive le cache des pages statiques en développement
  // pour éviter les problèmes de rechargement des variables d'environnement
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
