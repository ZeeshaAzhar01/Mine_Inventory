const prisma = require('../config/prisma');

const createRequisition = async (userId, itemId, qtyRequested) => {
  // We simply log the request as PENDING. 
  // We do NOT deduct stock today. That requires a transaction (Day 18).
  const requisition = await prisma.requisition.create({
    data: {
      user_id: userId,
      item_id: itemId,
      qty_requested: qtyRequested
    }
  });

  return requisition;
};

const approveRequisition = async (requisitionId) => {
  const approvedRequisition = await prisma.$transaction(async (tx) => {
    
    // 1. Fetch the current requisition
    const requisition = await tx.requisition.findUnique({
      where: { id: requisitionId }
    });

    if (!requisition) {
      throw new Error("Requisition not found");
    }

    if (requisition.status !== 'PENDING') {
      throw new Error("Only PENDING requisitions can be approved");
    }

    // 2. Fetch the current physical inventory item INSIDE the transaction
    const item = await tx.inventoryItem.findUnique({
      where: { id: requisition.item_id }
    });

    // 3. THE SAFETY NET: Check for insufficient stock
    if (item.stock_qty < requisition.qty_requested) {
      throw new Error(`Insufficient stock. You only have ${item.stock_qty} units available.`);
    }

    // 4. Update the requisition status to APPROVED
    const updatedReq = await tx.requisition.update({
      where: { id: requisitionId },
      data: { status: 'APPROVED' }
    });

    // 5. Deduct the requested quantity safely
    await tx.inventoryItem.update({
      where: { id: requisition.item_id },
      data: { stock_qty: { decrement: requisition.qty_requested } }
    });

    return updatedReq;
  });

  return approvedRequisition;
};

module.exports = {
  createRequisition,
  approveRequisition
};