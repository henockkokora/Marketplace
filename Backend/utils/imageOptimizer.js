const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const optimizeImage = async (inputPath, outputPath, options = {}) => {
  try {
    const { width, height, quality = 80 } = options;
    
    await fs.ensureDir(path.dirname(outputPath));
    
    const image = sharp(inputPath);
    
    // Obtenir les métadonnées de l'image
    const metadata = await image.metadata();
    
    // Définir la qualité et le format de sortie
    const outputOptions = {
      quality,
      effort: 6, // Niveau d'effort pour la compression (1-10)
    };
    
    // Convertir en WebP si ce n'est pas déjà le cas
    const isWebP = metadata.format === 'webp';
    const outputExt = isWebP ? 'webp' : 'webp';
    const outputFilePath = outputPath.replace(/\.\w+$/, '.webp');
    
    // Redimensionner et optimiser l'image
    const pipeline = image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp(outputOptions);
    
    await pipeline.toFile(outputFilePath);
    
    return {
      success: true,
      path: outputFilePath,
      originalSize: (await fs.stat(inputPath)).size,
      optimizedSize: (await fs.stat(outputFilePath)).size,
    };
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'image:', error);
    return { success: false, error: error.message };
  }
};

// Middleware pour optimiser les images à la volée
const imageOptimizer = (options = {}) => {
  return async (req, res, next) => {
    // Ignorer si ce n'est pas une requête d'image
    if (!/\.(jpe?g|png|webp)$/i.test(req.path)) {
      return next();
    }

    try {
      const imagePath = path.join(process.cwd(), 'uploads', req.path);
      const optimizedPath = path.join(process.cwd(), 'uploads', 'optimized', req.path);
      
      // Vérifier si l'image optimisée existe déjà
      if (await fs.pathExists(optimizedPath)) {
        const stats = await fs.stat(optimizedPath);
        const image = await sharp(optimizedPath);
        const metadata = await image.metadata();
        
        res.set('Content-Type', `image/${metadata.format}`);
        res.set('Content-Length', stats.size);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        return fs.createReadStream(optimizedPath).pipe(res);
      }
      
      // Si l'image originale n'existe pas, passer au middleware suivant
      if (!await fs.pathExists(imagePath)) {
        return next();
      }
      
      // Optimiser l'image
      const result = await optimizeImage(imagePath, optimizedPath, {
        width: 1200, // Largeur maximale
        quality: 80, // Qualité (0-100)
      });
      
      if (result.success) {
        const stats = await fs.stat(result.path);
        const image = await sharp(result.path);
        const metadata = await image.metadata();
        
        res.set('Content-Type', `image/${metadata.format}`);
        res.set('Content-Length', stats.size);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        return fs.createReadStream(result.path).pipe(res);
      } else {
        return next();
      }
    } catch (error) {
      console.error('Erreur dans le middleware d\'optimisation d\'image:', error);
      return next();
    }
  };
};

module.exports = {
  optimizeImage,
  imageOptimizer,
};
