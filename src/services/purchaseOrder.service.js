const prisma = require('../config/prisma');

const createPurchaseOrder = async (supplierId, itemId, qty) => {
  // 1. Fetch the item to get its CURRENT price
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Item not found");
  }

  // 2. Create the PO, explicitly locking in the base_price
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      supplier_id: supplierId,
      item_id: itemId,
      qty: qty,
      base_price: item.unit_price, // The crucial historical data lock!
      // itc_amount will be calculated tomorrow
    }
  });

  // 3. Update the physical stock quantity
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { stock_qty: { increment: qty } }
  });

  return purchaseOrder;
};

module.exports = {
  createPurchaseOrder
};