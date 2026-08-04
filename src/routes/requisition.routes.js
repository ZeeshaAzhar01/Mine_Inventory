const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisition.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createRequisitionSchema } = require('../validators/requisition.validator');

// Engineers can request
router.post('/', verifyToken, validate(createRequisitionSchema), requisitionController.requestItems);

// Only Admins can approve
router.put('/:id/approve', verifyToken, isAdmin, requisitionController.approveRequest);

module.exports = router;