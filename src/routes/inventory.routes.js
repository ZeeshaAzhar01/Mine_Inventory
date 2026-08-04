const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createItemSchema } = require('../validators/inventory.validator');

/**
 * @openapi
 * /api/items/low-stock:
 *   get:
 *     summary: Get low stock inventory items
 *     description: Returns items where current stock quantity is less than or equal to their configured min_stock_threshold.
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock spares.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin privileges required).
 */
router.get('/low-stock', verifyToken, isAdmin, inventoryController.getLowStockItems);

/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: Retrieve inventory items with search & pagination
 *     description: Supports category filtering (`?category=Hydraulics`), text search (`?search=pump`), and pagination (`?page=1&limit=10`). Includes supplier details.
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter items by specific category (e.g. Hydraulics, Spares)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search on item name
 *     responses:
 *       200:
 *         description: Paginated items payload.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                   example: 45
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized.
 */
router.get('/', verifyToken, inventoryController.getAllItems);

/**
 * @openapi
 * /api/items:
 *   post:
 *     summary: Create new inventory spare item
 *     description: Adds a new item to the mining inventory catalog linked to a registered supplier. Admin only.
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemInput'
 *     responses:
 *       201:
 *         description: Item created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Validation error or invalid supplier UUID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin only).
 */
router.post('/', verifyToken, isAdmin, validate(createItemSchema), inventoryController.createItem);

module.exports = router;