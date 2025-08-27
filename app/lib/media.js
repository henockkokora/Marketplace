// URL de base pour les médias
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:4000';

/**
 * Génère une URL complète pour un média
 * @param {string} path - Chemin relatif du fichier
 * @returns {string} URL complète du média
 */
export const getMediaUrl = (path = '') => {
  try {
    // Si pas de chemin, retourner une chaîne vide
    if (!path) {
      console.warn('[getMediaUrl] Aucun chemin fourni');
      return '';
    }
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (path.startsWith('http')) {
      console.log(`[getMediaUrl] URL complète détectée: ${path}`);
      return path;
    }
    
    // Nettoyer le chemin
    let cleanPath = path.replace(/^[\\/]+/, '');
    
    // Log pour le débogage
    console.log(`[getMediaUrl] Chemin initial: ${path}, Nettoyé: ${cleanPath}`);
    
    // Si le chemin commence par un slash, on le supprime
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
      console.log(`[getMediaUrl] Slash initial supprimé: ${cleanPath}`);
    }
    
    // Ne pas ajouter de préfixe s'il est déjà présent
    if (!cleanPath.startsWith('uploads/') && 
        !cleanPath.startsWith('categories/') && 
        !cleanPath.startsWith('products/')) {
      // Si le chemin contient déjà 'categories' ou 'products', on ne fait rien
      if (!cleanPath.includes('categories/') && !cleanPath.includes('products/')) {
        cleanPath = `uploads/${cleanPath}`;
        console.log(`[getMediaUrl] Préfixe 'uploads/' ajouté: ${cleanPath}`);
      }
    }
    
    // Construire l'URL complète
    const baseUrl = MEDIA_BASE.endsWith('/') ? MEDIA_BASE.slice(0, -1) : MEDIA_BASE;
    const url = new URL(cleanPath, baseUrl);
    
    // Pour le débogage
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getMediaUrl] URL finale: ${url.toString()}`);
    }
    
    return url.toString();
  } catch (error) {
    console.error('[getMediaUrl] Erreur lors de la construction de l\'URL:', {
      path,
      error: error.message,
      stack: error.stack
    });
    return '';
  }
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
