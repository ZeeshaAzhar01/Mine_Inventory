const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET all items (Engineers and Admins can view)
router.get('/', verifyToken, inventoryController.getAllItems);

// POST new item (Only Admins can add to the catalog)
router.post('/', verifyToken, isAdmin, inventoryController.createItem);

module.exports = router;