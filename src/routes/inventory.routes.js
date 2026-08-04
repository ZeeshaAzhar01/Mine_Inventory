const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createItemSchema } = require('../validators/inventory.validator');

// GET low stock items (Managers / Admins only) - Placed before root / route
router.get('/low-stock', verifyToken, isAdmin, inventoryController.getLowStockItems);

// GET all items (Engineers and Admins can view)
router.get('/', verifyToken, inventoryController.getAllItems);

// POST new item (Only Admins can add to the catalog)
router.post('/', verifyToken, isAdmin, validate(createItemSchema), inventoryController.createItem);

module.exports = router;