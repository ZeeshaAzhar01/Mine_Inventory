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

module.exports = {
  createRequisition
};