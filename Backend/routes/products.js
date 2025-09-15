const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('../models/User');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');


const router = express.Router()

// Fonction pour nettoyer les noms de fichiers
const cleanFileName = (fileName) => {
  // Garder uniquement les caractères alphanumériques, tirets et points
  return fileName.replace(/[^a-zA-Z0-9.\-]/g, '-').toLowerCase();
};

// Config multer : stockage en mémoire (buffers) pour upload vers Cloudinary
const storage = multer.memoryStorage();

// Filtre pour les types de fichiers acceptés (images et vidéos)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    console.log(`[Multer] Fichier accepté: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } else {
    const error = new Error(`Type de fichier non supporté: ${file.mimetype}. Formats acceptés: JPEG, PNG, WebP pour les images, MP4, WebM, OGG, AVI, MOV pour les vidéos`);
    console.error(`[Multer] ${error.message}`);
    cb(error, false);
  }
};

// Configuration de multer avec gestion d'erreurs améliorée
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max par fichier (pour supporter les vidéos)
    files: 11, // Maximum 10 images + 1 vidéo
    fieldSize: 100 * 1024 * 1024 // 100MB max pour l'ensemble du formulaire
  }
});

// Middleware pour gérer les erreurs de multer
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Une erreur de Multer s'est produite lors du téléchargement
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La taille du fichier dépasse la limite autorisée (50MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers téléchargés. Maximum 11 fichiers (10 images + 1 vidéo) autorisés.' });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({ error: 'Trop de champs dans le formulaire' });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({ error: 'La valeur d\'un champ est trop grande' });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({ error: 'Trop de champs dans le formulaire' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Type de fichier non autorisé' });
    }
  } else if (err) {
    // Une erreur inconnue s'est produite
    console.error('Erreur lors du téléchargement du fichier:', err);
    return res.status(500).json({ error: 'Une erreur est survenue lors du téléchargement du fichier' });
  }
  
  // Si tout va bien, passer au middleware suivant
  next();
};

// Fonction pour uploader un buffer vers Cloudinary (images)
async function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const cleanName = cleanFileName(originalName);
    const publicId = `product-${Date.now()}-${cleanName.split('.')[0]}`;
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Erreur upload image:', error);
          reject(error);
        } else {
          console.log(`[Cloudinary] Image uploadée: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

// Fonction pour uploader une vidéo vers Cloudinary
async function uploadVideoToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const cleanName = cleanFileName(originalName);
    const publicId = `video-${Date.now()}-${cleanName.split('.')[0]}`;
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products/videos',
        public_id: publicId,
        resource_type: 'video',
        quality: 'auto:good',
        format: 'mp4', // Convertir en MP4 pour la compatibilité
        transformation: [
          { width: 1280, height: 720, crop: 'limit' }, // Limiter la résolution
          { quality: 'auto:good' },
          { flags: 'streaming_attachment' } // Optimiser pour le streaming
        ]
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Erreur upload vidéo:', error);
          reject(error);
        } else {
          console.log(`[Cloudinary] Vidéo uploadée: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

const extractPublicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
    // Example: https://res.cloudinary.com/<cloud>/image/upload/v1690000000/products/abc-123.png
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, '');
    return withoutExt; // includes folder e.g., products/abc-123
  } catch {
    return null;
  }
};

// Récupérer les produits les plus commandés
router.get('/most-ordered', async (req, res) => {
  try {
    // Récupérer toutes les commandes payées ou livrées
    const orders = await Order.find({
      status: { $in: ['paid', 'shipped', 'delivered'] }
    });

    // Compter le nombre de commandes par produit
    const productCounts = {};
    
    orders.forEach(order => {
      order.products.forEach(item => {
        const productId = item.product.toString();
        productCounts[productId] = (productCounts[productId] || 0) + item.quantity;
      });
    });

    // Si aucun produit n'a été commandé, retourner un tableau vide
    if (Object.keys(productCounts).length === 0) {
      return res.json([]);
    }

    // Trier les produits par nombre de commandes (du plus commandé au moins commandé)
    const sortedProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);

    // Récupérer les détails des produits les plus commandés
    const topProducts = await Product.find({
      _id: { $in: sortedProductIds },
      status: 'active',
      stock: { $gt: 0 } // Seulement les produits en stock
    })
    .limit(8) // Limiter à 8 produits
    .populate('category');

    // Trier les produits selon l'ordre de popularité
    const sortedProducts = sortedProductIds
      .map(id => topProducts.find(p => p._id.toString() === id))
      .filter(Boolean); // Enlever les undefined au cas où

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error fetching most ordered products:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits les plus commandés' });
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Format d\'ID produit invalide', 
        id: id 
      });
    }

    // Vérifier la connexion à la base de données
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur de connexion à la base de données' 
      });
    }

    let product = await Product.findById(id)
      .populate('category')
      .populate('reviews.user', 'name email')
      .lean();

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produit non trouvé', 
        id: id 
      });
    }
    
    // Construire les URLs complètes des images si nécessaire
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map(image => {
        if (!image) return null;
        if (typeof image !== 'string') return image;
        if (image.startsWith('http')) return image;
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        const cleanImagePath = image.startsWith('/') ? image.substring(1) : image;
        return `${baseUrl}/uploads/${cleanImagePath}`;
      }).filter(Boolean);
    }
    
    res.json({ 
      success: true, 
      data: product 
    });
    
  } catch (error) {
    console.error('Erreur serveur lors de la récupération du produit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération du produit',
      error: process.env.NODE_ENV === 'development' ? (error.stack || error.message) : undefined
    });
  }
});

// GET all active products (for clients) with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    const query = { status: 'active' };

    // Si un filtre de catégorie est fourni
    if (category) {
      query.category = category;
    }

    // Si un filtre de sous-catégorie est fourni
    if (subcategory) {
      // Gérer à la fois les tableaux et les chaînes séparées par des virgules
      let subcategories;
      if (Array.isArray(subcategory)) {
        subcategories = subcategory;
      } else if (typeof subcategory === 'string' && subcategory.includes(',')) {
        subcategories = subcategory.split(',').map(s => s.trim());
      } else {
        subcategories = [subcategory];
      }
      
      // S'assurer que tous les IDs sont valides
      const validSubcategories = subcategories.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validSubcategories.length > 0) {
        query.subcategory = { $in: validSubcategories };
      }
    }

    const products = await Product.find(query)
      .populate('category')
      .populate('subcategory');
      
    res.json(products);
  } catch (err) {
    console.error('Erreur lors de la récupération des produits actifs:', err);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des produits',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
})

// GET all products (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const products = await Product.find().populate('category')
    res.json(products)
  } catch (err) {
    console.error('Erreur lors de la récupération de tous les produits:', err);
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST create product avec upload images multiples (max 10) et vidéo optionnelle
router.post('/', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), handleMulterErrors, async (req, res) => {
  try {
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ error: 'Veuillez télécharger au moins une image' });
    }

    // Upload des images vers Cloudinary
    const imagesPaths = await Promise.all(
      req.files.images.map((file) => uploadBufferToCloudinary(file.buffer, file.originalname))
    );

    let productData = { ...req.body, images: imagesPaths };

    // Upload de la vidéo vers Cloudinary si présente
    if (req.files.video && req.files.video.length > 0) {
      try {
        const videoUrl = await uploadVideoToCloudinary(req.files.video[0].buffer, req.files.video[0].originalname);
        productData.videoUrl = videoUrl;
        console.log('[Product] Vidéo uploadée:', videoUrl);
      } catch (videoError) {
        console.error('[Product] Erreur upload vidéo:', videoError);
        // On continue sans la vidéo si l'upload échoue
        console.warn('[Product] Création du produit sans vidéo à cause de l\'erreur d\'upload');
      }
    }

    // Générer un slug unique à partir du nom du produit
    productData.slug = await generateUniqueSlug(productData.name);

    // Si subcategory est fourni mais pas category, retrouver la catégorie parente
    if (!productData.category && productData.subcategory) {
      const Category = require('../models/Category');
      const mongoose = require('mongoose');
      let subcatId;
      try {
        subcatId = new mongoose.Types.ObjectId(productData.subcategory);
      } catch (e) {
        return res.status(400).json({ error: 'ID de sous-catégorie invalide' });
      }
      // Chercher une catégorie dont une sous-catégorie a l'_id égal à subcategory
      const parentCat = await Category.findOne({ 'subcategories._id': subcatId });
      if (!parentCat) {
        return res.status(400).json({ error: 'Catégorie parente introuvable pour cette sous-catégorie' });
      }
      productData.category = parentCat._id;
    }

    const newProduct = new Product(productData);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    // Gérer les erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Erreur de validation', details: errors });
    }
    
    res.status(400).json({ 
      error: 'Erreur lors de la création du produit',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Mettre à jour le statut d'un produit
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Doit être "active" ou "inactive"' });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du statut' });
  }
});

// PATCH mettre à jour l'offre spéciale d'un produit
router.patch('/:id/special-offer', async (req, res) => {
  try {
    const { isSpecialOffer, specialOfferPrice } = req.body;
    // Validation
    if (typeof isSpecialOffer === 'undefined') {
      return res.status(400).json({ error: 'Le champ isSpecialOffer est requis' });
    }
    // On accepte true/false ou 'true'/'false' (string)
    let specialFlag = isSpecialOffer;
    if (typeof specialFlag === 'string') {
      specialFlag = specialFlag === 'true';
    }
    let update = { isSpecialOffer: specialFlag };
    if (specialFlag && specialOfferPrice !== undefined) {
      const priceNum = Number(specialOfferPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ error: 'Le prix spécial doit être un nombre positif' });
      }
      update.specialOfferPrice = priceNum;
    } else if (!specialFlag) {
      update.specialOfferPrice = undefined;
    }
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre spéciale', details: err.message });
  }
});

// PUT update product avec upload (optionnel) images multiples et vidéo
router.put('/:id', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), handleMulterErrors, async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };
    
    // Vérifier si le produit existe
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Si de nouvelles images sont téléchargées
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Upload vers Cloudinary
      const newImagesPaths = await Promise.all(
        req.files.images.map((file) => uploadBufferToCloudinary(file.buffer, file.originalname))
      );

      // Si on veut ajouter les nouvelles images aux existantes
      if (req.body.appendImages === 'true') {
        updateData.images = [...existingProduct.images, ...newImagesPaths];
      } else {
        // Supprimer les anciennes images de Cloudinary
        if (existingProduct.images && existingProduct.images.length > 0) {
          await Promise.all(
            existingProduct.images.map(async (imgUrl) => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              if (publicId) {
                try { await cloudinary.uploader.destroy(publicId); } catch (_) {}
              }
            })
          );
        }
        // Remplacer par les nouvelles images (URLs)
        updateData.images = newImagesPaths;
      }
    }

    // Si une nouvelle vidéo est téléchargée
    if (req.files && req.files.video && req.files.video.length > 0) {
      try {
        // Supprimer l'ancienne vidéo de Cloudinary si elle existe
        if (existingProduct.videoUrl) {
          const publicId = extractPublicIdFromUrl(existingProduct.videoUrl);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
              console.log('[Product] Ancienne vidéo supprimée de Cloudinary:', publicId);
            } catch (deleteError) {
              console.error('[Product] Erreur suppression ancienne vidéo:', deleteError);
            }
          }
        }

        // Upload de la nouvelle vidéo
        const videoUrl = await uploadVideoToCloudinary(req.files.video[0].buffer, req.files.video[0].originalname);
        updateData.videoUrl = videoUrl;
        console.log('[Product] Nouvelle vidéo uploadée:', videoUrl);
      } catch (videoError) {
        console.error('[Product] Erreur upload vidéo:', videoError);
        // On continue la mise à jour sans changer la vidéo si l'upload échoue
        console.warn('[Product] Mise à jour du produit sans changement de vidéo à cause de l\'erreur d\'upload');
      }
    }

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Erreur lors de la mise à jour du produit' });
    }

    res.json(updatedProduct);
  } catch (err) {
    // Gérer les erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Erreur de validation', details: errors });
    }
    
    res.status(400).json({ 
      error: 'Erreur lors de la mise à jour du produit',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// DELETE product avec suppression des images et vidéos associées
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Supprimer les images de Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(async (imgUrl) => {
          const publicId = extractPublicIdFromUrl(imgUrl);
          if (publicId) {
            try { 
              await cloudinary.uploader.destroy(publicId);
              console.log('[Product] Image supprimée de Cloudinary:', publicId);
            } catch (e) {
              console.error('Erreur suppression image Cloudinary:', e?.message || e);
            }
          }
        })
      );
    }

    // Supprimer la vidéo de Cloudinary si elle existe
    if (product.videoUrl) {
      const publicId = extractPublicIdFromUrl(product.videoUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          console.log('[Product] Vidéo supprimée de Cloudinary:', publicId);
        } catch (e) {
          console.error('Erreur suppression vidéo Cloudinary:', e?.message || e);
        }
      }
    }

    // Supprimer le produit de la base de données
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Produit supprimé avec succès' 
    });
  } catch (err) {
    console.error('Erreur lors de la suppression du produit:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du produit',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Récupérer les produits les plus commandés
router.get('/most-ordered', async (req, res) => {
  try {
    // Récupérer toutes les commandes payées ou livrées
    const orders = await Order.find({
      status: { $in: ['paid', 'shipped', 'delivered'] }
    });

    // Compter le nombre de commandes par produit
    const productCounts = {};
    
    orders.forEach(order => {
      order.products.forEach(item => {
        const productId = item.product.toString();
        productCounts[productId] = (productCounts[productId] || 0) + item.quantity;
      });
    });

    // Si aucun produit n'a été commandé, retourner un tableau vide
    if (Object.keys(productCounts).length === 0) {
      return res.json([]);
    }

    // Trier les produits par nombre de commandes (du plus commandé au moins commandé)
    const sortedProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);

    // Récupérer les détails des produits les plus commandés
    const topProducts = await Product.find({
      _id: { $in: sortedProductIds },
      status: 'active',
      stock: { $gt: 0 } // Seulement les produits en stock
    })
    .limit(8) // Limiter à 8 produits
    .populate('category');

    // Trier les produits selon l'ordre de popularité
    const sortedProducts = sortedProductIds
      .map(id => topProducts.find(p => p._id.toString() === id))
      .filter(Boolean); // Enlever les undefined au cas où

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error fetching most ordered products:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits les plus commandés' });
  }
});

// Génère un slug à partir d'une chaîne
function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Génère un slug unique pour un produit
async function generateUniqueSlug(name) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  const Product = require('../models/Product');
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

// Route pour enregistrer un clic sur un produit
router.post('/:id/click', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { 
      $inc: { clicks: 1 } 
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du clic:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
