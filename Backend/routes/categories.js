const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const createSlug = (name) => name.toLowerCase().replace(/\s+/g, '-')

// Configuration de multer pour les catégories
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads/categories')
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    try {
      // Récupérer l'extension du fichier
      const ext = path.extname(file.originalname).toLowerCase()
      // Créer un nom de fichier unique avec timestamp
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
      const finalFileName = `category-${uniqueSuffix}${ext}`
      
      // Fichier de catégorie reçu et renommé
      cb(null, finalFileName)
    } catch (error) {
      console.error('[Multer] Erreur lors de la génération du nom de fichier:', error)
      cb(error)
    }
  }
})

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const error = new Error(`Type de fichier non supporté: ${file.mimetype}. Formats acceptés: JPEG, PNG, WebP`)
    console.error(`[Multer] ${error.message}`)
    cb(error, false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max par fichier
  }
})

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

    let imagePath = ''
    if (req.file) {
      // Construire le chemin relatif pour la base de données
      const relativePath = path.relative(
        path.join(process.cwd(), 'uploads'),
        req.file.path
      ).replace(/\\/g, '/') // Remplacer les backslashes par des slashes
      
      // S'assurer que le chemin commence par un slash
      imagePath = `/${relativePath}`
    }

    const category = await Category.create({ name, slug, image: imagePath, subcategories: [] })
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update category
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const slug = createSlug(name)
    const updateData = { name, slug }
    if (req.file) {
      // Construire le chemin relatif pour la base de données
      const relativePath = path.relative(
        path.join(process.cwd(), 'uploads'),
        req.file.path
      ).replace(/\\/g, '/') // Remplacer les backslashes par des slashes
      
      // S'assurer que le chemin commence par un slash
      updateData.image = `/${relativePath}`
      // Le chemin de l'image a été mis à jour
      
      // Supprimer l'ancienne image si elle existe
      try {
        const oldCategory = await Category.findById(req.params.id)
        if (oldCategory && oldCategory.image) {
          const oldImagePath = path.join(process.cwd(), 'uploads', oldCategory.image)
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath)
            // Ancienne image supprimée avec succès
          }
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'ancienne image:', err)
      }
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true })
    if (!updated) return res.status(404).json({ error: 'Catégorie non trouvée' })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
