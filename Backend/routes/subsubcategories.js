const express = require('express')
const router = express.Router({ mergeParams: true }) // pour récupérer catId et subId
const Category = require('../models/Category')

// POST add subsubcategory (pas d'image, mais productCount)
router.post('/', async (req, res) => {
  try {
    const { name, productCount } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const category = await Category.findById(req.params.catId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    const subcat = category.subcategories.id(req.params.subId)
    if (!subcat) return res.status(404).json({ error: 'Sous-catégorie non trouvée' })

    subcat.subsubcategories.push({ name, productCount: productCount || 0 })
    await category.save()

    res.status(201).json(subcat.subsubcategories.slice(-1)[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update subsubcategory
router.put('/:subsubId', async (req, res) => {
  try {
    const { name, productCount } = req.body

    const category = await Category.findById(req.params.catId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    const subcat = category.subcategories.id(req.params.subId)
    if (!subcat) return res.status(404).json({ error: 'Sous-catégorie non trouvée' })

    const subsub = subcat.subsubcategories.id(req.params.subsubId)
    if (!subsub) return res.status(404).json({ error: 'Sous-sous-catégorie non trouvée' })

    if (name) subsub.name = name
    if (typeof productCount === 'number') subsub.productCount = productCount

    await category.save()
    res.json(subsub)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE subsubcategory
router.delete('/:subsubId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.catId)
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' })

    const subcat = category.subcategories.id(req.params.subId)
    if (!subcat) return res.status(404).json({ error: 'Sous-catégorie non trouvée' })

    const subsub = subcat.subsubcategories.id(req.params.subsubId)
    if (!subsub) return res.status(404).json({ error: 'Sous-sous-catégorie non trouvée' })

    subsub.remove()
    await category.save()

    res.json({ message: 'Sous-sous-catégorie supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
