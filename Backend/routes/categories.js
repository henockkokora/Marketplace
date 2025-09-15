const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const Product = require('../models/Product'); // Added missing import for Product

const createSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');

// Utiliser memoryStorage pour garder le fichier en buffer
const storage = multer.memoryStorage();

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    
    // Vérifier et corriger les slugs manquants
    let updated = false;
    for (const category of categories) {
      if (!category.slug) {
        category.slug = createSlug(category.name);
        await category.save();
        updated = true;
        console.log(`Slug ajouté pour la catégorie: ${category.name} -> ${category.slug}`);
      }
    }
    
    if (updated) {
      console.log('Slugs mis à jour pour les catégories');
    }
    
    res.json(categories);
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { populate } = req.query;
    
    let category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      // Log pour debug : lister toutes les catégories et leurs slugs
      const allCategories = await Category.find({}, 'name slug');
      console.log('Catégories disponibles:');
      allCategories.forEach(cat => {
        console.log(`- "${cat.name}" -> slug: "${cat.slug || 'AUCUN'}"`);
      });
      console.log(`Slug recherché: "${req.params.slug}"`);
      
      return res.status(404).json({ 
        error: 'Catégorie non trouvée',
        requestedSlug: req.params.slug,
        availableCategories: allCategories.map(cat => ({
          name: cat.name,
          slug: cat.slug || null
        }))
      });
    }

    // Si populate=subcategories est demandé, on retourne la catégorie avec ses sous-catégories
    // (les sous-catégories sont déjà incluses dans le modèle Category)
    res.json(category);
  } catch (err) {
    console.error('Erreur lors de la récupération de la catégorie par slug:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la catégorie' });
  }
});

// POST create category with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const slug = createSlug(name)
    const exists = await Category.findOne({ slug })
    if (exists) return res.status(409).json({ error: 'Catégorie existe déjà' })

    let imageUrl = '';
    if (req.file) {
      // Uploader l'image sur Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'categories',
          public_id: `category-${slug}-${Date.now()}`
        }
      );
      imageUrl = result.secure_url;
    }

    const category = await Category.create({ name, slug, image: imageUrl, subcategories: [] });
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update category
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });

    const slug = createSlug(name);
    const updateData = { name, slug };

    if (req.file) {
      // Uploader la nouvelle image sur Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'categories',
          public_id: `category-${slug}-${Date.now()}`,
          overwrite: true
        }
      );
      updateData.image = result.secure_url;

      // Supprimer l'ancienne image de Cloudinary si elle existe
      const oldCategory = await Category.findById(req.params.id);
      if (oldCategory && oldCategory.image && oldCategory.image.includes('cloudinary')) {
        // Extrait le public_id de l'URL pour la suppression
        const publicId = oldCategory.image.split('/').pop().split('.')[0];
        const folder = oldCategory.image.split('/')[oldCategory.image.split('/').length - 2];
        if (folder && publicId) {
          try {
            await cloudinary.uploader.destroy(`${folder}/${publicId}`);
          } catch (e) {
            console.error("Erreur lors de la suppression de l'ancienne image sur Cloudinary:", e);
          }
        }
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json(updatedCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Vérifier si la catégorie existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    // Supprimer tous les produits associés à cette catégorie
    const productsToDelete = await Product.find({ category: categoryId });
    
    // Supprimer les images des produits sur Cloudinary
    for (const product of productsToDelete) {
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          if (imageUrl && imageUrl.includes('cloudinary')) {
            try {
              const publicId = imageUrl.split('/').pop().split('.')[0];
              const folder = imageUrl.split('/')[imageUrl.split('/').length - 2];
              if (folder && publicId) {
                await cloudinary.uploader.destroy(`${folder}/${publicId}`);
                console.log(`Image de produit supprimée de Cloudinary: ${folder}/${publicId}`);
              }
            } catch (e) {
              console.error("Erreur lors de la suppression d'une image de produit sur Cloudinary:", e);
            }
          }
        }
      }
    }
    
    const deletedProducts = await Product.deleteMany({ category: categoryId });
    console.log(`${deletedProducts.deletedCount} produits supprimés avec la catégorie ${category.name}`);

    // Supprimer l'image de la catégorie sur Cloudinary si elle existe
    if (category.image && category.image.includes('cloudinary')) {
      try {
        // Extrait le public_id de l'URL pour la suppression
        const publicId = category.image.split('/').pop().split('.')[0];
        const folder = category.image.split('/')[category.image.split('/').length - 2];
        if (folder && publicId) {
          await cloudinary.uploader.destroy(`${folder}/${publicId}`);
          console.log(`Image de catégorie supprimée de Cloudinary: ${folder}/${publicId}`);
        }
      } catch (e) {
        console.error("Erreur lors de la suppression de l'image sur Cloudinary:", e);
      }
    }

    // Supprimer la catégorie
    await Category.findByIdAndDelete(categoryId);
    
    res.json({ 
      message: 'Catégorie supprimée avec succès',
      productsDeleted: deletedProducts.deletedCount
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de la catégorie:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router
