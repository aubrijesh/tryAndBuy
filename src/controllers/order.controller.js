const { Order,OrderItem, ProductVariant } = require('../models/db');
const { handleNewOrder,handleNewOrderV2} = require('../services/tryBuy.service');
const { reserveInventory } = require('../services/inventory.service');
const { ORDER_STATUS, ITEM_STATUS } = require('../constants/status');



async function orderWebhook(req, res) {
  try {
    const order = req.body;
    //await handleNewOrder(order);
    const orderId = await handleNewOrderV2(order);
    res.status(200).send({ success: true , message: 'Order processed', data: {
      orderId
    } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Webhook error');
  }
}


async function markPacked(req, res) {
    try {
        const { orderId } = req.params;
        await Order.update({ status: ORDER_STATUS.PACKED }, { where: { id: orderId } });
        await reserveInventory(orderId);
        res.send({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error marking order as PACKED');
    }
}

async function addOrderItem(req, res) {
  const { orderId } = req.params;
  const { variant_id, size, recommended = false } = req.body;



  // check if order id exist first
  const order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const varient = await ProductVariant.findOne({
    where: {
      id: variant_id
    }
  });

  if(!varient) {
    return res.status(404).json({ success: false, error: 'Variant not found in product variants' });
  }


  try {
    const item = await OrderItem.create({
      order_id: orderId,
      variant_id,
      size_label: varient.size_label,
      size_value: varient.size_value,
      price: varient.price,
      status: ITEM_STATUS.SENT,
      recommended
    });

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add item');
  }
}

async function removeOrderItem(req, res) {
  const { orderId, itemId } = req.params;
  // check if order id exist first
  const order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  //Check if item exists in the order
  const item = await OrderItem.findOne({
    where: {
      id: itemId,
      order_id: orderId
    }
  });
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found in this order' });
  }

  try {
    const deleted = await OrderItem.destroy({
      where: {
        id: itemId,
        order_id: orderId
      }
    });

    if (!deleted)
      return res.status(404).json({ success: false, error: 'Item not found in this order' });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
}


module.exports = {
  orderWebhook,
  markPacked,
  addOrderItem,
  removeOrderItem
};
