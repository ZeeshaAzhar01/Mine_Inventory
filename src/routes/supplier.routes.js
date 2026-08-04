const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');

// GET is accessible by any logged-in user (ADMIN or ENGINEER)
router.get('/', verifyToken, supplierController.getAllSuppliers);

// POST, PUT, DELETE are locked strictly to ADMINs
router.post('/', verifyToken, isAdmin, validate(createSupplierSchema), supplierController.createSupplier);
router.put('/:id', verifyToken, isAdmin, validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', verifyToken, isAdmin, supplierController.deleteSupplier);

module.exports = router;