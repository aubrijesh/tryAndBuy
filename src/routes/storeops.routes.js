const express = require('express');
const router = express.Router();

const {
  getAllOrders
} = require('../controllers/storeops.controller');

// Shopify webhook – order created
router.get('/orders', getAllOrders);

module.exports = router;
