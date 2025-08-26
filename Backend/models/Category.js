const mongoose = require('mongoose')

const subsubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCount: { type: Number, default: 0 },
})

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  subsubcategories: [subsubcategorySchema]
})

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String },
  subcategories: [subcategorySchema]
})

module.exports = mongoose.model('Category', categorySchema)
