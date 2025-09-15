const express = require('express')
const router = express.Router({ mergeParams: true }) // Important pour récupérer :catId
const Category = require('../models/Category')
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');

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

// GET all subcategories across all categories
router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find({}, 'name subcategories')
      .populate('subcategories', 'name slug image description')
      .lean();

    // Flatten subcategories array
    const allSubcategories = categories.flatMap(category => 
      category.subcategories.map(sub => ({
        ...sub,
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        }
      }))
    );

    res.json(allSubcategories);
  } catch (err) {
    console.error('Error getting all subcategories:', err);
    res.status(500).json({ error: 'Server error while fetching subcategories' });
  }
});

// POST add subcategory with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const category = await Category.findById(req.params.categoryId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'subcategories',
          public_id: `subcategory-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        }
      );
      imageUrl = result.secure_url;
    }

    category.subcategories.push({ name, image: imageUrl, subsubcategories: [] });
    await category.save()

    res.status(201).json(category.subcategories.slice(-1)[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update subcategory
router.put('/:subId', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const category = await Category.findById(req.params.categoryId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    const subcat = category.subcategories.id(req.params.subId)
    if (!subcat) return res.status(404).json({ error: 'Sous-catégorie non trouvée' })

    subcat.name = name;
    if (req.file) {
      // Upload new image
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'subcategories',
          public_id: `subcategory-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        }
      );

      // Delete old image from Cloudinary if it exists
      if (subcat.image && subcat.image.includes('cloudinary')) {
        const publicId = subcat.image.split('/').pop().split('.')[0];
        const folder = subcat.image.split('/')[subcat.image.split('/').length - 2];
        if (folder && publicId) {
          try {
            await cloudinary.uploader.destroy(`${folder}/${publicId}`);
          } catch (e) {
            console.error("Erreur lors de la suppression de l'ancienne image (sous-catégorie) sur Cloudinary:", e);
          }
        }
      }
      
      subcat.image = result.secure_url;
    }

    await category.save()
    res.json(subcat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE subcategory
router.delete('/:subId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const subcatIndex = category.subcategories.findIndex(
      sub => sub._id.toString() === req.params.subId
    );
    
    if (subcatIndex === -1) return res.status(404).json({ error: 'Sous-catégorie non trouvée' });

    const subcategoryId = req.params.subId;
    const subcategoryName = category.subcategories[subcatIndex].name;

    // Supprimer tous les produits associés à cette sous-catégorie
    const Product = require('../models/Product');
    const productsToDelete = await Product.find({ subcategory: subcategoryId });
    
    // Supprimer les images des produits sur Cloudinary
    const cloudinary = require('../utils/cloudinary');
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
    
    const deletedProducts = await Product.deleteMany({ subcategory: subcategoryId });
    console.log(`${deletedProducts.deletedCount} produits supprimés avec la sous-catégorie ${subcategoryName}`);

    // Supprimer l'image de la sous-catégorie sur Cloudinary si elle existe
    const subcategory = category.subcategories[subcatIndex];
    if (subcategory.image && subcategory.image.includes('cloudinary')) {
      try {
        const cloudinary = require('../utils/cloudinary');
        // Extrait le public_id de l'URL pour la suppression
        const publicId = subcategory.image.split('/').pop().split('.')[0];
        const folder = subcategory.image.split('/')[subcategory.image.split('/').length - 2];
        if (folder && publicId) {
          await cloudinary.uploader.destroy(`${folder}/${publicId}`);
          console.log(`Image de sous-catégorie supprimée de Cloudinary: ${folder}/${publicId}`);
        }
      } catch (e) {
        console.error("Erreur lors de la suppression de l'image sur Cloudinary:", e);
      }
    }

    // Supprimer la sous-catégorie du tableau
    category.subcategories.splice(subcatIndex, 1);
    await category.save();

    res.json({ 
      message: 'Sous-catégorie supprimée avec succès',
      productsDeleted: deletedProducts.deletedCount
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de la sous-catégorie:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router
