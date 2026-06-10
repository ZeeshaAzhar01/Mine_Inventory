const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { getLowStockItems } = require('../controllers/inventory.controller');

// GET all items (Engineers and Admins can view)
router.get('/', verifyToken, inventoryController.getAllItems);

// GET low stock items (Engineers and Admins can view)
router.get('/low-stock', verifyToken, isAdmin, getLowStockItems);
// POST new item (Only Admins can add to the catalog)
router.post('/', verifyToken, isAdmin, inventoryController.createItem);

module.exports = router;