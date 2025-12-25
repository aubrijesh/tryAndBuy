const express = require('express');
const router = express.Router();

const {
  getRiderOrder,
  completeTryBuy,
  getRandomOrder
} = require('../controllers/rider.controller');

router.get('/orders/random', getRandomOrder);

// Rider sees items in order
router.get('/orders/:orderId', getRiderOrder);
// Just to illustrate rider functionality, not part of the main flow
// on rider page to get a random order assigned to him

// Rider marks kept / returned
router.post('/orders/:orderId/complete', completeTryBuy);




module.exports = router;
