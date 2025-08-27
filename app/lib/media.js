export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:4000';

export const getMediaUrl = (path = '') => {
  if (!path) return '';
  
  // Si c'est déjà une URL complète, la retourner
  if (path.startsWith('http')) {
    return path;
  }
  
  // Nettoyer les slashes
  const cleanBase = MEDIA_BASE_URL.replace(/\/+$/, '');
  
  // Supprimer les doublons de 'uploads/'
  let cleanPath = path.replace(/^\/+/, '');
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  }
  
  return `${cleanBase}/uploads/${cleanPath}`;
};

export const getFallbackImage = () => {
  return 'https://via.placeholder.com/300x200?text=No+Image';
};
