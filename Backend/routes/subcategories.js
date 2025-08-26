const express = require('express')
const router = express.Router({ mergeParams: true }) // Important pour récupérer :catId
const Category = require('../models/Category')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

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

    let imagePath = ''
    if (req.file) imagePath = `/uploads/${req.file.filename}`

    category.subcategories.push({ name, image: imagePath, subsubcategories: [] })
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

    subcat.name = name
    if (req.file) subcat.image = `/uploads/${req.file.filename}`

    await category.save()
    res.json(subcat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE subcategory
router.delete('/:subId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    const subcatIndex = category.subcategories.findIndex(
      sub => sub._id.toString() === req.params.subId
    )
    
    if (subcatIndex === -1) return res.status(404).json({ error: 'Sous-catégorie non trouvée' })

    // Supprimer la sous-catégorie du tableau
    category.subcategories.splice(subcatIndex, 1)
    await category.save()

    res.json({ message: 'Sous-catégorie supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
