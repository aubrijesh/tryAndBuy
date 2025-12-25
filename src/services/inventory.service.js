const { shopifyRequest } = require("../shopify/shopify.client");
const { OrderItem } = require("../models/db");
const { ORDER_STATUS, ITEM_STATUS } = require('../constants/status');

/* why pMap?
Shopify Admin API does not have a true bulk adjust endpoint, 
but you can often batch items in parallel with controlled concurrency rather than firing all at once.
*/


/**
 * Reserve inventory (soft lock)
 * Called when order is PACKED
 */
async function reserveInventory(orderId) {
  const items = await OrderItem.findAll({
    where: { order_id: orderId },
  });

  if (!items.length) return;

  await OrderItem.update(
    { reserved: true },
    { where: { id: items.map((i) => i.id) } }
  );

  console.log(`Inventory reserved for order ${orderId}`);
}

/**
 * Deduct inventory for KEPT items
 */
async function deductInventory(orderId) {
  const keptItems = await OrderItem.findAll({
    where: { order_id: orderId, status: ITEM_STATUS.KEPT },
  });

  if (!keptItems.length) return;

  // Bulk DB update: release reservation
  await OrderItem.update(
    { reserved: false },
    { where: { id: keptItems.map((i) => i.id) } }
  );

  // Bulk Shopify adjustments concurrentl
  // We can use queue with concurrency to avoid rate limits and handle retries

  const variantMap = keptItems.reduce((acc, item) => {
    acc[item.variant_id] = (acc[item.variant_id] || 0) + 1;
    return acc;
    }, {});

    await Promise.all(
        Object.entries(variantMap).map(([variant_id, qty]) =>
            shopifyRequest('/inventory_levels/adjust.json', 'POST', {
            inventory_item_id: variant_id,
            available_adjustment: -qty
            })
        )
    );

  console.log(
    `Inventory deducted and reservations cleared for order ${orderId}`
  );
}

/**
 * Release inventory for RETURNED items
 */
async function releaseInventory(orderId) {
    const returnedItems = await OrderItem.findAll({
        where: { order_id: orderId, status: ITEM_STATUS.RETURNED },
    });

    if (!returnedItems.length) return;
    // Bulk DB update: release reservation
    await OrderItem.update(
        { reserved: false },
        { where: { id: returnedItems.map((i) => i.id) } }
    );

    console.log(`Inventory released for order ${orderId}`);
}

async function adjustInventoryForKeptItems(items) {
  // Aggregate by variant_id to minimize Shopify calls
  const variantMap = items.reduce((acc, item) => {
    acc[item.variant_id] = (acc[item.variant_id] || 0) + 1;
    return acc;
  }, {});

  // Fire concurrent Shopify calls
  await Promise.all(
    Object.entries(variantMap).map(([variant_id, qty]) =>
      shopifyRequest('/inventory_levels/adjust.json', 'POST', {
        inventory_item_id: variant_id,
        available_adjustment: -qty
      })
    )
  );

  // Clear reserved flags for all kept items
  await OrderItem.update(
    { reserved: false },
    { where: { id: items.map(i => i.id) } }
  );
}

async function releaseInventoryForReturnedItems(items) {
  // Clear reserved flags for returned items
  await OrderItem.update(
    { reserved: false },
    { where: { id: items.map(i => i.id) } }
  );
}

module.exports = {
  reserveInventory,
  deductInventory,
  releaseInventory,
  adjustInventoryForKeptItems,
  releaseInventoryForReturnedItems
};
