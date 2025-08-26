const Order = require('../models/Order')
const Client = require('../models/Client')
const Product = require('../models/Product')
const sendSmsYellika = require('../utils/sendSms')

function generateOrderNumber() {
  return 'CMD-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

exports.createOrder = async (req, res) => {
  try {
    const { clientData, cartItems, promo, clientTotal } = req.body;
    // 1. Trouver ou créer le client
    let client = await Client.findOne({ email: clientData.email });
    if (!client) client = await Client.create(clientData);

    // 2. Vérifier le stock et préparer les produits
    let totalPrice = 0;
    const orderProducts = [];
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Produit non trouvé: ${item.name}` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Stock insuffisant pour ${product.name}` });

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price, // On enregistre le prix envoyé par le front
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
      });
      totalPrice += item.price * item.quantity; // On calcule avec le prix du panier (front)
    }

    // Appliquer la promo si présente (promo = montant à déduire)
    let promoAmount = 0;
    if (promo && !isNaN(Number(promo)) && Number(promo) > 0) {
      promoAmount = Number(promo);
      totalPrice = Math.max(0, totalPrice - promoAmount);
    }

    // 3. Créer la commande
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: client._id,
      products: orderProducts,
      totalPrice,
      promoAmount,
      clientTotal, // sous-total envoyé par le front
      paymentMethod: 'Espèce',
      shippingAddress: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
      }
      // notes supprimé
    });

    // Envoi du SMS professionnel au client après commande réussie
    try {
      const smsMessage = `Merci ${client.name} pour votre commande dans la boutique ECEFA ! Notre service client vous contactera très prochainement pour la livraison.`;
      // On s'assure que le numéro est bien au format international sans espaces
      let phone = client.phone ? client.phone.replace(/\s+/g, '') : '';
      if (phone.startsWith('0')) phone = '225' + phone.slice(1); // au cas où le client met un 0
      const smsResult = await sendSmsYellika({
        recipient: phone,
        message: smsMessage,
      });
      if (smsResult && smsResult.status === 'success') {
        console.log(`[SMS] SMS envoyé au client (${phone}) : OK`, smsResult);
      } else {
        console.warn(`[SMS] Échec d'envoi du SMS au client (${phone})`, smsResult);
      }
    } catch (e) {
      console.error('[SMS] Erreur lors de l\'envoi du SMS client:', e);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').sort('-createdAt');
    // Calcul du montant total promo si présent
    let montantPromo = 0;
    orders.forEach(order => {
      if (order.promoAmount && order.promoAmount > 0) {
        montantPromo += order.promoAmount;
      }
    });
    const totalMontant = montantPromo > 0 ? montantPromo : orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    res.json({ orders, montantPromo: montantPromo > 0 ? montantPromo : null, totalMontant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    // Ajoute nom, email, téléphone du client dans un champ clientInfo
    const clientInfo = order.user ? {
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone
    } : null;
    res.json({
      ...order.toObject(),
      clientInfo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    // Si passage à 'delivered' et pas déjà livré, décrémente le stock
    if (status === 'delivered' && order.status !== 'delivered') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }
    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' })
    res.json({ message: 'Commande supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Marquer une commande comme vue par l'admin
exports.markOrderAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { isSeen: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Commande non trouvée" });
    res.json({ success: true, message: "Commande marquée comme vue", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
