const mongoose = require('mongoose')

const orderProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // prix au moment de la commande
  name: { type: String, required: true }, // nom snapshot
  image: { type: String }, // image snapshot
})

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
})

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, // Numéro de commande unique
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  products: { type: [orderProductSchema], required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, required: true },
  shippingAddress: { type: addressSchema, required: true }, // Adresse présente, pas de prix livraison
  notes: { type: String },
  isSeen: { type: Boolean, default: false }, // Ajout pour signalement admin
}, { timestamps: true })

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema)
