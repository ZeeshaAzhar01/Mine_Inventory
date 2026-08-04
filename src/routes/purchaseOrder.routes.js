const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createPurchaseOrderSchema } = require('../validators/purchaseOrder.validator');

/**
 * @openapi
 * /api/purchase-orders:
 *   post:
 *     summary: Log incoming shipment of spares & replenish stock
 *     description: |
 *       Logs incoming procurement orders inside an ACID Interactive Transaction.
 *       **Automated Financial Calculations:**
 *       - \`Subtotal = qty * item.unit_price\`
 *       - \`ITC (Input Tax Credit) = Subtotal * (item.gst_rate / 100)\`
 *       - \`Total Amount = Subtotal + ITC\`
 *       - Increments \`stock_qty\` on the target inventory item atomically.
 *     tags:
 *       - Purchase Orders & Procurement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrderInput'
 *     responses:
 *       201:
 *         description: Purchase Order created and physical stock incremented.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Purchase Order logged and stock updated
 *                 purchaseOrder:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *                 updatedStock:
 *                   type: integer
 *                   example: 20
 *       400:
 *         description: Validation error or foreign key violation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin privileges required).
 *       404:
 *         description: Inventory item or supplier not found.
 */
router.post('/', verifyToken, isAdmin, validate(createPurchaseOrderSchema), poController.logIncomingShipment);

module.exports = router;