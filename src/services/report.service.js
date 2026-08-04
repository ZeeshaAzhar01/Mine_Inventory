const prisma = require('../config/prisma');

/**
 * Service to aggregate Purchase Orders by month and calculate total spending & taxes.
 * Uses PostgreSQL raw aggregation with DATE / TO_CHAR functions for performant grouping.
 */
const getMonthlySpend = async (year) => {
    let monthlyData;

    if (year) {
        const parsedYear = parseInt(year);
        monthlyData = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(id)::int AS total_orders,
                COALESCE(SUM(subtotal), 0)::float AS total_subtotal,
                COALESCE(SUM(itc_amount), 0)::float AS total_itc,
                COALESCE(SUM(total_amount), 0)::float AS total_spend
            FROM "PurchaseOrder"
            WHERE EXTRACT(YEAR FROM created_at) = ${parsedYear}
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month DESC;
        `;
    } else {
        monthlyData = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(id)::int AS total_orders,
                COALESCE(SUM(subtotal), 0)::float AS total_subtotal,
                COALESCE(SUM(itc_amount), 0)::float AS total_itc,
                COALESCE(SUM(total_amount), 0)::float AS total_spend
            FROM "PurchaseOrder"
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month DESC;
        `;
    }

    // Compute cumulative totals across all grouped months
    const grandTotals = monthlyData.reduce(
        (acc, curr) => {
            acc.total_orders += Number(curr.total_orders || 0);
            acc.total_subtotal += Number(curr.total_subtotal || 0);
            acc.total_itc += Number(curr.total_itc || 0);
            acc.total_spend += Number(curr.total_spend || 0);
            return acc;
        },
        { total_orders: 0, total_subtotal: 0, total_itc: 0, total_spend: 0 }
    );

    grandTotals.total_subtotal = Math.round(grandTotals.total_subtotal * 100) / 100;
    grandTotals.total_itc = Math.round(grandTotals.total_itc * 100) / 100;
    grandTotals.total_spend = Math.round(grandTotals.total_spend * 100) / 100;

    return {
        summary: grandTotals,
        monthly_breakdown: monthlyData
    };
};

module.exports = {
    getMonthlySpend
};
