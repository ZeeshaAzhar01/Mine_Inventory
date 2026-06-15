const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Only Mine Managers (ADMIN) can log incoming shipments
router.post('/', verifyToken, isAdmin, poController.logIncomingShipment);

module.exports = router;