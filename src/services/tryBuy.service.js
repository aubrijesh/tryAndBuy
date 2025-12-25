const { PAYMENT_STATUS, ORDER_STATUS,ITEM_STATUS } = require('../constants/status');
const { Order, OrderItem, products, ProductVariant , sequelize} = require('../models/db');
const { shopifyRequest } = require('../shopify/shopify.client');

async function handleNewOrder(order) {
  // Check if order has Try & Buy
  const hasTryBuy = order.line_items.some(item =>
    item.properties?.try_and_buy === true
  );
  if (!hasTryBuy) return;

  // Generate internal items (same item sizes + similar items)
  const internalItems = generateInternalItems(order.line_items);
  // Save order in DB
  // sum price of item where is_customer_selected is true

  let totalOrderPrice = internalItems.reduce((sum, item) => {
    if (item.is_customer_selected) {
      return sum + parseFloat(item.price);
    }
    return sum;
  }, 0);

  const savedOrder = await Order.create({
    shopify_order_id: order.id,
    customer_id: order.customer.id,
    order_amount: totalOrderPrice,
    paid_amount: 0,
    try_and_buy_amount: 0,
    payment_status: 'PENDING'
  });


  await OrderItem.bulkCreate(
    internalItems.map(item => ({
        order_id: savedOrder.id,
        variant_id: item.variant_id,
        size: item.size,
        price: item.price,
        recommended: item.recommended,
        status: 'SENT',   // default status
        reserved: false,   // default reserved
        is_customer_selected: item.is_customer_selected || false
    }))
  );

  // Tag order in Shopify
  await shopifyRequest(`/orders/${order.id}.json`, 'PUT', {
    order: { tags: 'TRY_AND_BUY' }
  });
}

async function handleNewOrderV2(order) {
  // Check if order has Try & Buy
  let is_try_and_buy = false;
  const hasTryBuy = order.products.filter(item =>
    item.try_and_buy === true
  );

  if (hasTryBuy.length === 0) return;
  is_try_and_buy = true;
  const varients = await ProductVariant.findAll({ where: { product_id: hasTryBuy.map(i => i.id)  },raw: true });
  // Generate internal items (same item sizes + similar items)
  const varientMap = varients.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const internalItems = generateInternalItemsV2(order.products,varientMap);
  // sum price of item where is_customer_selected is true
  let totalOrderPrice = internalItems.reduce((sum, item) => {
    if (item.is_customer_selected) {
      return sum + parseFloat(item.price);
    }
    return sum;
  }, 0);

  // generate random shopify_order_id for demo purpose
  let shopifyOrderId = Math.floor(Math.random() * 1000000);

  let savedOrder;
  const t = await sequelize.transaction();
  try {
    savedOrder = await Order.create({
      shopify_order_id: shopifyOrderId,
      customer_id: order.customer.id,
      order_amount: totalOrderPrice,
      paid_amount: 0,
      try_and_buy_amount: 0,
      payment_status: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.CREATED,
      is_try_and_buy: true
    }, { transaction: t });

    await OrderItem.bulkCreate(
      internalItems.map(item => ({
          order_id: savedOrder.id,
          variant_id: item.variant_id,
          size_label: item.size_label,
          size_value: item.size_value,
          price: item.price,
          recommended: item.recommended,
          status: ITEM_STATUS.SENT,   // default status
          reserved: false,   // default reserved
          is_customer_selected: item.is_customer_selected || false
      })),
      { transaction: t }
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  try {
    await shopifyRequest(`/orders/${order.id}.json`, 'PUT', {
      order: { tags: 'TRY_AND_BUY' }
    });
    return savedOrder.id;
  } catch (err) {
    console.error('Failed to tag Shopify order:', err);
  }
}




function generateInternalItems(lineItems) {
  const items = [];
  const defaultItems = [];

  lineItems.forEach(item => {
    const size = parseInt(item.variant_title.match(/\d+/)?.[0] || '0');
    defaultItems.push({ variant_id: item.variant_id, size: size, price: item.price, is_customer_selected: true });

    // Same item size +1 and -1
    if (size) {
      items.push({ variant_id: item.variant_id, size: size+1, price: item.price });
      items.push({ variant_id: item.variant_id, size: size-1, price: item.price });
    }

    // Mock: 2 recommended similar items
    items.push({ variant_id: item.variant_id+1, size: size, price: item.price, recommended: true });
    items.push({ variant_id: item.variant_id+2, size: size, price: item.price, recommended: true });
  });
  
  return [...defaultItems, ...items];
}

function generateInternalItemsV2(products, varientMap) {
  const items = [];
  const defaultItems = [];

  products.forEach(item => {
    let vObj = varientMap[item.variant_id];
    if (!vObj) return;
    let price = vObj.price;
    let size_label = vObj.size_label;
    let size_value = vObj.size_value;
    let product_id = vObj.product_id;

    // Always include selected variant (customer's size)
    defaultItems.push({ variant_id: item.variant_id, size_label: size_label, size_value: size_value, price: price, is_customer_selected: true });

    // Suggest one size down (if available)
    const oneSizeDown = Object.values(varientMap).find(v => v.product_id === product_id && v.size_value === size_value - 1);
    if (oneSizeDown) {
      items.push({ variant_id: oneSizeDown.id, size_label: oneSizeDown.size_label, size_value: oneSizeDown.size_value, price: oneSizeDown.price, suggestion: 'one size down' });
    }

    // Suggest 2-3 other variants from same product/category (excluding selected)
    const sameProductVariants = Object.values(varientMap)
      .filter(v => v.product_id === product_id && v.id !== item.variant_id)
      .sort(() => Math.random() - 0.5) // randomize
      .slice(0, 3);
    sameProductVariants.forEach(v => {
      items.push({ variant_id: v.id, size_label: v.size_label, size_value: v.size_value, price: v.price, recommended: true });
    });
  });

  return [...defaultItems, ...items];
}

module.exports = { handleNewOrder, handleNewOrderV2};
