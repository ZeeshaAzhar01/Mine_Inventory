const requisitionService = require('../services/requisition.service');

const requestItems = async (req, res) => {
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
    console.error("Requisition Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const approveRequest = async (req, res) => {
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
    console.error("Approval Error:", error);
    // Return a 400 Bad Request if the status was already approved/rejected
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestItems,
  approveRequest
};