const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisition.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Both Engineers and Admins can submit requests
router.post('/', verifyToken, requisitionController.requestItems);

module.exports = router;