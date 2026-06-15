const prisma = require('../config/prisma');

const createPurchaseOrder = async (supplierId, itemId, qty) => {
  // 1. Fetch the item to get its CURRENT price and GST rate
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Item not found");
  }

  // 2. FINANCIAL MATH CALCULATION (The Integer Fix)
  // Convert price to paise (integers) to prevent floating-point errors
  const basePricePaise = Math.round(item.unit_price * 100);
  const gstRate = item.gst_rate; 

  const subtotalPaise = basePricePaise * qty;
  const itcAmountPaise = Math.round((subtotalPaise * gstRate) / 100);
  const totalAmountPaise = subtotalPaise + itcAmountPaise;

  // Convert back to standard Rupees
  const subtotal = subtotalPaise / 100;
  const itc_amount = itcAmountPaise / 100;
  const total_amount = totalAmountPaise / 100;

  // 3. Create the PO, logging all exact financial details 
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      supplier_id: supplierId,
      item_id: itemId,
      qty: qty,
      base_price: item.unit_price, 
      subtotal: subtotal,
      itc_amount: itc_amount,
      total_amount: total_amount
    }
  });

  // 4. Update the physical stock quantity
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { stock_qty: { increment: qty } }
  });

  return purchaseOrder;
};

module.exports = {
  createPurchaseOrder
};