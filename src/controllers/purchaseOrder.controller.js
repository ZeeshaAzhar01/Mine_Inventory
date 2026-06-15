const poService = require('../services/purchaseOrder.service');

const logIncomingShipment = async (req, res) => {
  try {
    const { supplier_id, item_id, qty } = req.body;

    // Waiter hands the raw data to the Kitchen
    const newPO = await poService.createPurchaseOrder(supplier_id, item_id, qty);

    res.status(201).json({
      success: true,
      message: "Purchase Order logged and stock updated",
      data: newPO
    });
  } catch (error) {
    console.error("PO Creation Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  logIncomingShipment
};