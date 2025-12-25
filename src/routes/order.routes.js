const express = require('express');
const router = express.Router();

const {
  orderWebhook,
  markPacked,
  addOrderItem,
  removeOrderItem
} = require('../controllers/order.controller');

// Shopify webhook – order created
router.post('/webhook', orderWebhook);

// Ops marks order as packed
router.post('/:orderId/packed', markPacked);

// addOrderItem
router.post('/:orderId/items', addOrderItem);

// removeOrderItem
router.delete('/:orderId/items/:itemId', removeOrderItem);



module.exports = router;
