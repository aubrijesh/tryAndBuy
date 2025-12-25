const { Product, ProductVariant } = require('../models/db');

// Fetch all products with their variants for UI display
async function getProducts(req, res) {
  try {
    const products = await Product.findAll({
      include: [{
        model: ProductVariant,
        as: 'ProductVariants',
      }]
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

module.exports = { getProducts };
