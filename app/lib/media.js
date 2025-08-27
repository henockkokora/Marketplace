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
    
    // Déterminer le préfixe approprié
    if (!cleanPath.startsWith('uploads/') && 
        !cleanPath.startsWith('categories/') && 
        !cleanPath.startsWith('products/')) {
      cleanPath = `uploads/${cleanPath}`;
      console.log(`[getMediaUrl] Préfixe 'uploads/' ajouté: ${cleanPath}`);
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
