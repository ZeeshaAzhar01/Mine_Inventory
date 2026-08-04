const requisitionService = require('../services/requisition.service');

const requestItems = async (req, res, next) => {
  try {
    const { item_id, qty } = req.body;
    
    // Securely pull the user ID from the verified JWT, NOT the body
    const userId = req.user.id;

    const newRequisition = await requisitionService.createRequisition(userId, item_id, qty);

    res.status(201).json({
      success: true,
      message: "Requisition submitted successfully and is pending approval",
      data: newRequisition
    });
  } catch (error) {
    next(error);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Call the transaction service
    const approvedData = await requisitionService.approveRequisition(id);

    res.status(200).json({
      success: true,
      message: "Requisition approved and stock deducted safely",
      data: approvedData
    });
  } catch (error) {
    // Return a 400 Bad Request if the status was already approved/rejected or insufficient stock
    if (error.message && (error.message.includes("Insufficient stock") || error.message.includes("Only PENDING"))) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  requestItems,
  approveRequest
};