const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/reports/monthly-spend (Restricted to Admins / Mine Management)
router.get('/monthly-spend', verifyToken, isAdmin, reportController.getMonthlySpendReport);

module.exports = router;
