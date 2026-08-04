const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

/**
 * @openapi
 * /api/reports/monthly-spend:
 *   get:
 *     summary: Generate monthly procurement & ITC tax spend report
 *     description: Aggregates total spend, Input Tax Credit (ITC), and order count grouped by calendar month. Admin only.
 *     tags:
 *       - Analytics & Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated monthly spend report.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MonthlySpendReport'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin privileges required).
 */
router.get('/monthly-spend', verifyToken, isAdmin, reportController.getMonthlySpendReport);

module.exports = router;
