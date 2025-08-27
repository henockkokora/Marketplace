const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');

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
    const categories = await Category.find()
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' })
    }
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la catégorie' })
  }
})

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
    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Catégorie supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
