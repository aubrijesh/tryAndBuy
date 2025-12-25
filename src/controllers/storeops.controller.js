const { Order } = require('../models/db');

// Get all orders (optionally filter by type=try_and_buy)
async function getAllOrders(req, res) {
  try {
    let where = {};
    if (req.query.type === 'try_and_buy') {
      // Only orders with TRY_AND_BUY items (simple filter: status or tag, adjust as needed)
      where = { is_try_and_buy: true };
    }
    const orders = await Order.findAll({ where });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}



module.exports = { getAllOrders };
