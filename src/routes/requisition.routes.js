const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisition.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Engineers can request
router.post('/', verifyToken, requisitionController.requestItems);

// Only Admins can approve
router.put('/:id/approve', verifyToken, isAdmin, requisitionController.approveRequest);

module.exports = router;