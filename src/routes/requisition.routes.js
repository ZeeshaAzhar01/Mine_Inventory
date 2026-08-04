const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisition.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createRequisitionSchema } = require('../validators/requisition.validator');

/**
 * @openapi
 * /api/requisitions:
 *   post:
 *     summary: Request items from inventory
 *     description: Mining site engineers submit spare parts requests with status initialized to PENDING.
 *     tags:
 *       - Requisitions & Stock Usage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRequisitionInput'
 *     responses:
 *       201:
 *         description: Requisition submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Requisition created successfully
 *                 requisition:
 *                   $ref: '#/components/schemas/Requisition'
 *       400:
 *         description: Validation error or invalid item UUID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized.
 */
router.post('/', verifyToken, validate(createRequisitionSchema), requisitionController.requestItems);

/**
 * @openapi
 * /api/requisitions/{id}/approve:
 *   put:
 *     summary: Approve requisition & atomically deduct inventory stock
 *     description: |
 *       Approves a pending requisition and executes an atomic stock deduction within an ACID Interactive Transaction.
 *       **Edge Cases & Error Handling:**
 *       - Returns \`400 Bad Request\` if requisition is not in \`PENDING\` status (already processed).
 *       - Returns \`400 Bad Request\` if available \`stock_qty < qty_requested\` (*Insufficient Stock*).
 *       - Automatically updates requisition status to \`APPROVED\` and decrements inventory item stock.
 *     tags:
 *       - Requisitions & Stock Usage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Requisition UUID
 *     responses:
 *       200:
 *         description: Requisition approved and stock deducted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Requisition approved and stock updated
 *                 requisition:
 *                   $ref: '#/components/schemas/Requisition'
 *                 remainingStock:
 *                   type: integer
 *                   example: 13
 *       400:
 *         description: Insufficient stock or requisition not pending.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               status: fail
 *               message: Insufficient stock available
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin privileges required).
 *       404:
 *         description: Requisition not found.
 */
router.put('/:id/approve', verifyToken, isAdmin, requisitionController.approveRequest);

module.exports = router;