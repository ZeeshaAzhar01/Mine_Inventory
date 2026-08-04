const reportService = require('../services/report.service');

// GET /api/reports/monthly-spend
const getMonthlySpendReport = async (req, res) => {
    try {
        const { year } = req.query;

        // Fetch aggregated reporting data from service layer
        const reportData = await reportService.getMonthlySpend(year);

        res.status(200).json({
            success: true,
            filter: {
                year: year || "ALL"
            },
            data: reportData
        });
    } catch (error) {
        console.error("Monthly Spend Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate monthly spend report"
        });
    }
};

module.exports = {
    getMonthlySpendReport
};
