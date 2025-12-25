const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/product.controller');

// Fetch all products for UI
router.get('/', getProducts);


module.exports = router;