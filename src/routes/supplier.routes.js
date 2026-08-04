const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');

/**
 * @openapi
 * /api/suppliers:
 *   get:
 *     summary: Retrieve all suppliers
 *     description: Returns a list of all registered mining equipment and spares vendors.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Supplier'
 *       401:
 *         description: Unauthorized.
 */
router.get('/', verifyToken, supplierController.getAllSuppliers);

/**
 * @openapi
 * /api/suppliers:
 *   post:
 *     summary: Register a new supplier
 *     description: Enrolls a new supplier with mandatory GST number validation. Requires Admin privileges.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupplierInput'
 *     responses:
 *       201:
 *         description: Supplier created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error or duplicate GST number.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin only).
 */
router.post('/', verifyToken, isAdmin, validate(createSupplierSchema), supplierController.createSupplier);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier details
 *     description: Modifies supplier contact or business registration info. Requires Admin privileges.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Supplier UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSupplierInput'
 *     responses:
 *       200:
 *         description: Supplier updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error or duplicate GST number.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin only).
 *       404:
 *         description: Supplier not found.
 */
router.put('/:id', verifyToken, isAdmin, validate(updateSupplierSchema), supplierController.updateSupplier);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     description: Deletes a supplier record by UUID. Requires Admin privileges.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Supplier UUID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Supplier deleted successfully
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin only).
 *       404:
 *         description: Supplier not found.
 */
router.delete('/:id', verifyToken, isAdmin, supplierController.deleteSupplier);

module.exports = router;