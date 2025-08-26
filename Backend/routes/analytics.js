const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics?range=month|week|year
router.get('/', analyticsController.getAnalytics);

module.exports = router;
