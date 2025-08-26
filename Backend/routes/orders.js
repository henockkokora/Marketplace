const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')

// Créer une commande
router.post('/', orderController.createOrder)
// Lister toutes les commandes
router.get('/', orderController.getOrders)
// Récupérer une commande par id
router.get('/:id', orderController.getOrderById)
// Modifier le statut d'une commande
router.patch('/:id/status', orderController.updateOrderStatus)
// Supprimer une commande
router.delete('/:id', orderController.deleteOrder)

// Marquer une commande comme vue
router.patch('/:id/seen', orderController.markOrderAsSeen)

module.exports = router
