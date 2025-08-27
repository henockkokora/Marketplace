// URL de base pour les médias
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:4000';

/**
 * Génère une URL complète pour un média
 * @param {string} path - Chemin relatif du fichier
 * @returns {string} URL complète du média
 */
export const getMediaUrl = (path = '') => {
  if (!path) {
    return ''; // Retourne une chaîne vide si le chemin est manquant
  }

  // Si le chemin est déjà une URL complète (ex: Cloudinary), on la retourne directement.
  if (path.startsWith('http')) {
    return path;
  }

  // --- Logique de secours pour les anciens chemins relatifs ---
  // Ceci assure que les anciennes images (non-Cloudinary) s'affichent toujours.
  let cleanPath = path.startsWith('/') ? path.substring(1) : path;
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }

  const url = `${MEDIA_BASE.replace(/\/$/, '')}/${cleanPath}`;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[getMediaUrl] URL locale générée (fallback): ${url}`);
  }
  return url;
};

// Génère une image SVG en base64 comme fallback
export const getFallbackImage = () => {
  // Vérifier si on est côté navigateur
  if (typeof window !== 'undefined') {
    // Création d'une image SVG simple avec un fond gris et du texte
    const svg = `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#666">
        Image Non Disponible
      </text>
    </svg>`;
    
    // Encodage en base64
    const base64Svg = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } else {
    // Retourne une URL vide côté serveur
    return '';
  }
};

// Pour le débogage
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Configuration des médias:', {
    MEDIA_BASE,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  });
}
