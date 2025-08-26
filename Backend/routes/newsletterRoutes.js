const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route publique pour s'abonner
router.post('/subscribe', newsletterController.subscribe);

// Routes protégées pour l'administration
router.get('/subscribers', verifyToken, newsletterController.getSubscribers);
router.get('/export', verifyToken, newsletterController.exportSubscribers);

module.exports = router;
