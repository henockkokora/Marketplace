// URL de base pour les médias
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:4000';

export const getMediaUrl = (path = '') => {
  // Si pas de chemin, retourner une chaîne vide
  if (!path) return '';
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http')) {
    return path;
  }
  
  // Nettoyer le chemin
  const cleanPath = path.replace(/^[\\/]+/, '');
  
  // Construire l'URL complète
  const url = new URL(cleanPath, MEDIA_BASE.endsWith('/') ? MEDIA_BASE : `${MEDIA_BASE}/`);
  
  // Pour le débogage
  if (process.env.NODE_ENV === 'development') {
    console.log(`[getMediaUrl] Chemin: ${path} → URL: ${url.toString()}`);
  }
  
  return url.toString();
};

export const getFallbackImage = () => {
  return 'https://via.placeholder.com/300x200?text=Image+Non+Disponible';
};

// Pour le débogage
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Configuration des médias:', {
    MEDIA_BASE,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  });
}
