const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createPurchaseOrderSchema } = require('../validators/purchaseOrder.validator');

// Only Mine Managers (ADMIN) can log incoming shipments
router.post('/', verifyToken, isAdmin, validate(createPurchaseOrderSchema), poController.logIncomingShipment);

module.exports = router;