const { OrderItem, Order,sequelize } = require('../models/db');
// const {
//   deductInventory,
//   releaseInventory
// } = require('../services/inventory.service');
const {
  adjustInventoryForKeptItems,
  releaseInventoryForReturnedItems
} = require('../services/inventory.service');
const {
  collectPayment
} = require('../services/payment.service');
const { ORDER_STATUS, ITEM_STATUS,PAYMENT_STATUS } = require('../constants/status');



async function getRiderOrder(req, res) {
  const { orderId } = req.params;

  const order = await Order.findByPk(orderId, {
    include: OrderItem
  });

  if (!order) {
    return res.status(404).send('Order not found');
  }

  res.json({
    orderId: order.id,
    status: order.status,
    items: order.OrderItems
  });
}


async function completeTryBuy(req, res) {
  const { orderId } = req.params;
  const {
    kept = [],
    returned = [],
    paidAmount = 0,
    paymentMode
  } = req.body;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === ORDER_STATUS.COMPLETED)
      return res.status(400).json({ error: 'Order already completed' });

    const items = await OrderItem.findAll({ where: { order_id: orderId } });
    if (!items.length)
      return res.status(404).json({ error: 'No items found for order' });

    const keptSet = new Set(kept);
    const returnedSet = new Set(returned);

    // overlap check
    for (const id of keptSet) {
      if (returnedSet.has(id)) {
        return res.status(400).json({
          error: 'Items cannot be both kept and returned',
          itemId: id
        });
      }
    }

    const allItemIds = items.map(i => i.id);
    const missingItems = allItemIds.filter(
      id => !keptSet.has(id) && !returnedSet.has(id)
    );

    if (missingItems.length) {
      return res.status(400).json({
        error: 'Some items missing',
        missingItems
      });
    }

    // classify items in one pass
    const keptItems = [];
    const returnedItems = [];

    let orderAmount = 0;
    let tryAndBuyAmount = 0;

    for (const item of items) {
      if (keptSet.has(item.id)) {
        keptItems.push(item);

        if (item.is_customer_selected) {
          // user explicitly selected → normal order item
          if (order.payment_status !== PAYMENT_STATUS.PAID) {
            orderAmount += item.price;
          }
        } else {
          // try & buy accepted
          tryAndBuyAmount += item.price;
        }
      } else {
        returnedItems.push(item);
      }
    }

    const totalAmount = orderAmount + tryAndBuyAmount;

    if (paidAmount < totalAmount) {
      return res.status(400).json({
        error: `Insufficient payment. Total required: ${totalAmount}`
      });
    }

    // collect payment
    const paymentResult = await collectPayment({
      orderId,
      amount: totalAmount,
      mode: paymentMode
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        error: 'Payment failed',
        details: paymentResult.error
      });
    }

    const paymentStatus = PAYMENT_STATUS.PAID;

    // update items in parallel
    await Promise.all([
      OrderItem.update(
        { status: ITEM_STATUS.KEPT },
        { where: { id: keptItems.map(i => i.id) } }
      ),
      OrderItem.update(
        { status: ITEM_STATUS.RETURNED },
        { where: { id: returnedItems.map(i => i.id) } }
      ),
      adjustInventoryForKeptItems(keptItems),
      releaseInventoryForReturnedItems(returnedItems)
    ]);

    // update order
    await Order.update(
      {
        status: ORDER_STATUS.COMPLETED,
        order_amount:
          order.payment_status === PAYMENT_STATUS.PAID
            ? order.order_amount
            : orderAmount,
        paid_amount: totalAmount,
        try_and_buy_amount: tryAndBuyAmount,
        payment_status: paymentStatus
      },
      { where: { id: orderId } }
    );

    return res.json({
      success: true,
      totalAmount,
      paidAmount,
      paymentStatus
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Completion error' });
  }
}


// It is just to illustrate rider functionality, not part of the main flow
// on rider page to get a random order assigned to him
async function getRandomOrder(req, res) {
  try {
    const order = await Order.findOne({
      where: { status: ORDER_STATUS.PACKED },
      include: OrderItem,
      order: sequelize.random()
    });
    if (!order) {
      return res.status(404).send('No orders available for delivery');
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching order');
  }
}



module.exports = {
  getRiderOrder,
  completeTryBuy,
  getRandomOrder
};
