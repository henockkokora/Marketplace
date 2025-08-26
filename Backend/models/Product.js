// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false }, // Rendre optionnel
  subcategory: { type: mongoose.Schema.Types.ObjectId, required: false }, // Pas de 'ref' car c'est un sous-document
  description: { type: String },
  images: [{ type: String }], // tableau d'urls ou chemins de fichiers
  videoUrl: { type: String },
  price: { type: Number, required: true },
  promoPrice: { type: Number },
  isSpecialOffer: { type: Boolean, default: false }, // Ajouté pour gestion offre spéciale
  specialOfferPrice: { type: Number }, // Prix spécial (optionnel)
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  condition: { type: String, enum: ['new', 'used', 'refurbished'], default: 'new' },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 }
  }],
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
