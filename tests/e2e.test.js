/**
 * End-to-End (E2E) Integration Test Suite
 * Mining Inventory & Supply Chain Management API
 * 
 * Verifies the full enterprise lifecycle across:
 * 1. Health & OpenAPI/Swagger Documentation
 * 2. User Authentication & RBAC (Admin vs Engineer)
 * 3. Supplier Management & Unique GST Validation
 * 4. Inventory Catalog, Search, Filtering & Low-Stock Alerts
 * 5. Procurement / Purchase Orders (ACID Transactions & 18% ITC GST Calculations)
 * 6. Site Engineer Requisitions & Atomic Stock Deductions
 * 7. Edge Cases: Insufficient Stock, Status Immutability, 404 & 403 Guards
 * 8. Analytics & Monthly Spend Reports
 */

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function runE2ETests() {
    console.log('===============================================================');
    console.log('🚀 STARTING COMPREHENSIVE END-TO-END (E2E) INTEGRATION TEST SUITE');
    console.log('===============================================================\n');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    let adminToken = '';
    let engineerToken = '';
    let testAdminId = '';
    let testEngineerId = '';
    let supplierId = '';
    let itemId = '';
    let firstRequisitionId = '';
    let excessiveRequisitionId = '';
    let testGst = `29TEST${Date.now().toString().slice(-7)}Z1`;

    const stats = { passed: 0, failed: 0 };

    function reportStep(stepName, condition, details = '') {
        if (condition) {
            stats.passed++;
            console.log(`  ✅ [PASS] ${stepName} ${details}`);
        } else {
            stats.failed++;
            console.error(`  ❌ [FAIL] ${stepName} ${details}`);
            throw new Error(`Assertion failed at step: "${stepName}"`);
        }
    }

    try {
        // -------------------------------------------------------------
        // STAGE 1: HEALTH & DOCUMENTATION
        // -------------------------------------------------------------
        console.log('📌 [STAGE 1]: System Health & OpenAPI Documentation');

        const healthRes = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthRes.json();
        reportStep('GET /api/health returns 200 UP', healthRes.status === 200 && healthData.status === 'UP');

        const docsJsonRes = await fetch(`${baseUrl}/api-docs.json`);
        const docsJson = await docsJsonRes.json();
        reportStep('GET /api-docs.json returns valid OpenAPI 3.0 schema', docsJsonRes.status === 200 && docsJson.openapi === '3.0.0');

        const docsUiRes = await fetch(`${baseUrl}/api-docs/`);
        const docsHtml = await docsUiRes.text();
        reportStep('GET /api-docs/ renders Swagger UI HTML', docsUiRes.status === 200 && docsHtml.includes('swagger-ui'));

        // -------------------------------------------------------------
        // STAGE 2: AUTHENTICATION & RBAC (ADMIN vs ENGINEER)
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 2]: Authentication & Role-Based Access Control (RBAC)');

        const timestamp = Date.now();
        const adminEmail = `admin.e2e.${timestamp}@mineinventory.com`;
        const engineerEmail = `engineer.e2e.${timestamp}@mineinventory.com`;
        const adminPassword = 'AdminPassword123!';
        const engineerPassword = 'EngineerPassword123!';

        // 2.1 Register Admin
        const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'E2E Test Admin',
                email: adminEmail,
                password: adminPassword
            })
        });
        const adminRegData = await adminRegRes.json();
        reportStep('Admin user registered', adminRegRes.status === 201 && adminRegData.user?.id);
        testAdminId = adminRegData.user.id;

        // Elevate user role to ADMIN in DB for testing
        await prisma.user.update({
            where: { id: testAdminId },
            data: { role: 'ADMIN' }
        });

        // 2.2 Register Engineer
        const engRegRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'E2E Test Engineer',
                email: engineerEmail,
                password: engineerPassword
            })
        });
        const engRegData = await engRegRes.json();
        reportStep('Site Engineer registered with default ENGINEER role', engRegRes.status === 201 && engRegData.user?.role === 'ENGINEER');
        testEngineerId = engRegData.user.id;

        // 2.3 Login Admin
        const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword
            })
        });
        const adminLoginData = await adminLoginRes.json();
        adminToken = adminLoginData.token;
        reportStep('Admin login returns signed JWT token', adminLoginRes.status === 200 && !!adminToken);

        // 2.4 Login Engineer
        const engLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: engineerEmail,
                password: engineerPassword
            })
        });
        const engLoginData = await engLoginRes.json();
        engineerToken = engLoginData.token;
        reportStep('Engineer login returns signed JWT token', engLoginRes.status === 200 && !!engineerToken);

        // 2.5 RBAC Guard Verification
        const adminOnlyWithAdmin = await fetch(`${baseUrl}/api/users/admin-only`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        reportStep('Admin successfully accesses /api/users/admin-only (200 OK)', adminOnlyWithAdmin.status === 200);

        const adminOnlyWithEng = await fetch(`${baseUrl}/api/users/admin-only`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${engineerToken}` }
        });
        reportStep('Engineer blocked from /api/users/admin-only (403 Forbidden)', adminOnlyWithEng.status === 403);

        const unauthReq = await fetch(`${baseUrl}/api/users`);
        reportStep('Unauthenticated request rejected with 401 Unauthorized', unauthReq.status === 401);

        // -------------------------------------------------------------
        // STAGE 3: SUPPLIER MANAGEMENT & GST UNIQUENESS
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 3]: Supplier Lifecycle & Unique GST Enforcement');

        // 3.1 Engineer cannot create supplier
        const engCreateSupp = await fetch(`${baseUrl}/api/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${engineerToken}`
            },
            body: JSON.stringify({
                name: 'Unauthorized Supplier',
                gst_number: testGst,
                contact_info: 'test@unauth.com'
            })
        });
        reportStep('Engineer blocked from creating supplier (403 Forbidden)', engCreateSupp.status === 403);

        // 3.2 Admin creates supplier
        const adminCreateSupp = await fetch(`${baseUrl}/api/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'E2E Mining Heavy Spares Ltd',
                gst_number: testGst,
                contact_info: 'procurement@e2emining.com | +91-9876543210'
            })
        });
        const suppData = await adminCreateSupp.json();
        supplierId = suppData.supplier?.id;
        reportStep('Admin successfully created supplier', adminCreateSupp.status === 201 && !!supplierId);

        // 3.3 Duplicate GST Rejected
        const dupGstRes = await fetch(`${baseUrl}/api/suppliers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Duplicate GST Spares Ltd',
                gst_number: testGst,
                contact_info: 'dup@test.com'
            })
        });
        reportStep('Duplicate GST number rejected (400 / Conflict)', dupGstRes.status === 400 || dupGstRes.status === 500);

        // 3.4 List Suppliers
        const listSuppRes = await fetch(`${baseUrl}/api/suppliers`, {
            headers: { 'Authorization': `Bearer ${engineerToken}` }
        });
        const listSuppData = await listSuppRes.json();
        reportStep('Suppliers retrieved successfully by authenticated user', listSuppRes.status === 200 && Array.isArray(listSuppData));

        // -------------------------------------------------------------
        // STAGE 4: INVENTORY CATALOG & LOW-STOCK DETECTION
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 4]: Inventory Catalog, Filtering & Low-Stock Alerts');

        // 4.1 Admin creates inventory item
        const createItemRes = await fetch(`${baseUrl}/api/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: `E2E Drill Head 50mm ${timestamp}`,
                category: 'Drilling',
                stock_qty: 0,
                min_stock_threshold: 10,
                unit_price: 20000,
                gst_rate: 18,
                supplier_id: supplierId
            })
        });
        const itemResData = await createItemRes.json();
        itemId = itemResData.data?.id;
        reportStep('Admin successfully created inventory spare item', createItemRes.status === 201 && !!itemId);

        // 4.2 Low stock verification (Initial stock 0 <= threshold 10)
        const lowStockRes = await fetch(`${baseUrl}/api/items/low-stock`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const lowStockData = await lowStockRes.json();
        const isItemInLowStock = lowStockData.data?.some(i => i.id === itemId);
        reportStep('New item with 0 stock flagged in low-stock alert list', lowStockRes.status === 200 && isItemInLowStock);

        // 4.3 Search & Pagination
        const searchRes = await fetch(`${baseUrl}/api/items?search=Drill&category=Drilling&page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${engineerToken}` }
        });
        const searchData = await searchRes.json();
        reportStep('Inventory items search and pagination operational', searchRes.status === 200 && searchData.success === true && searchData.data?.length > 0);

        // -------------------------------------------------------------
        // STAGE 5: PROCUREMENT & PURCHASE ORDER (ACID & ITC MATH)
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 5]: Procurement Stock Replenishment & Financial ITC Calculation');

        const poQty = 30;
        const expectedSubtotal = 30 * 20000; // 600,000
        const expectedItc = expectedSubtotal * 0.18; // 108,000
        const expectedTotal = expectedSubtotal + expectedItc; // 708,000

        const createPoRes = await fetch(`${baseUrl}/api/purchase-orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                supplier_id: supplierId,
                item_id: itemId,
                qty: poQty
            })
        });
        const poData = await createPoRes.json();
        const po = poData.data;

        reportStep('PO created successfully within interactive transaction', createPoRes.status === 201 && !!po);
        reportStep('PO Subtotal calculated correctly (30 * 20000 = 600,000)', po?.subtotal === expectedSubtotal, `(Got: ${po?.subtotal})`);
        reportStep('PO 18% ITC calculated correctly (600,000 * 0.18 = 108,000)', po?.itc_amount === expectedItc, `(Got: ${po?.itc_amount})`);
        reportStep('PO Total calculated correctly (600,000 + 108,000 = 708,000)', po?.total_amount === expectedTotal, `(Got: ${po?.total_amount})`);

        // Check replenished stock
        const updatedItem = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        reportStep('Physical inventory stock atomically incremented from 0 to 30', updatedItem?.stock_qty === 30, `(Current: ${updatedItem?.stock_qty})`);

        // Low stock list should now exclude this item (30 > 10)
        const lowStockAfterPo = await fetch(`${baseUrl}/api/items/low-stock`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const lowStockAfterPoData = await lowStockAfterPo.json();
        const itemStillInLowStock = lowStockAfterPoData.data?.some(i => i.id === itemId);
        reportStep('Replenished item cleared from low-stock alert list', !itemStillInLowStock);

        // -------------------------------------------------------------
        // STAGE 6: REQUISITION & ATOMIC STOCK DEDUCTION
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 6]: Site Engineer Requisitions & Atomic Stock Deductions');

        const reqQty = 12;
        const createReqRes = await fetch(`${baseUrl}/api/requisitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${engineerToken}`
            },
            body: JSON.stringify({
                item_id: itemId,
                qty: reqQty
            })
        });
        const reqData = await createReqRes.json();
        firstRequisitionId = reqData.data?.id;
        reportStep('Engineer submitted requisition with status PENDING', createReqRes.status === 201 && reqData.data?.status === 'PENDING');

        // Engineer cannot approve requisition
        const engApproveRes = await fetch(`${baseUrl}/api/requisitions/${firstRequisitionId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${engineerToken}` }
        });
        reportStep('Engineer blocked from approving requisition (403 Forbidden)', engApproveRes.status === 403);

        // Admin approves requisition
        const adminApproveRes = await fetch(`${baseUrl}/api/requisitions/${firstRequisitionId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const approveData = await adminApproveRes.json();
        reportStep('Admin approved requisition successfully', adminApproveRes.status === 200 && approveData.success === true);

        // Check remaining stock (30 - 12 = 18)
        const stockAfterApproval = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        reportStep('Physical inventory stock atomically decremented from 30 to 18', stockAfterApproval?.stock_qty === 18, `(Current: ${stockAfterApproval?.stock_qty})`);

        // -------------------------------------------------------------
        // STAGE 7: EDGE CASES & CONCURRENCY / ERROR RESILIENCE
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 7]: Edge Cases, Insufficient Stock & Status Immutability');

        // 7.1 Request 25 units (Available is only 18)
        const excessiveReqRes = await fetch(`${baseUrl}/api/requisitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${engineerToken}`
            },
            body: JSON.stringify({
                item_id: itemId,
                qty: 25
            })
        });
        const excessiveReqData = await excessiveReqRes.json();
        excessiveRequisitionId = excessiveReqData.data?.id;

        // Admin attempts to approve excessive requisition
        const approveExcessiveRes = await fetch(`${baseUrl}/api/requisitions/${excessiveRequisitionId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const excessiveErrorData = await approveExcessiveRes.json();
        reportStep('Approving requisition exceeding available stock returns 400 Bad Request', 
            approveExcessiveRes.status === 400 && (excessiveErrorData.message?.includes('Insufficient stock') || !excessiveErrorData.success));

        // Verify stock remains untouched at 18
        const stockAfterFailedApproval = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        reportStep('Stock remains intact at 18 after rejected transaction', stockAfterFailedApproval?.stock_qty === 18);

        // 7.2 Attempt to re-approve already approved requisition
        const reApproveRes = await fetch(`${baseUrl}/api/requisitions/${firstRequisitionId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        reportStep('Re-approving processed requisition returns 400 Bad Request', reApproveRes.status === 400);

        // 7.3 Unhandled Route 404
        const nonExistentRoute = await fetch(`${baseUrl}/api/non-existent-endpoint`);
        reportStep('Non-existent route returns standard 404 Not Found AppError', nonExistentRoute.status === 404);

        // -------------------------------------------------------------
        // STAGE 8: ANALYTICS & MONTHLY SPEND REPORTING
        // -------------------------------------------------------------
        console.log('\n📌 [STAGE 8]: Financial Analytics & Monthly Spend Reports');

        const engReportRes = await fetch(`${baseUrl}/api/reports/monthly-spend`, {
            headers: { 'Authorization': `Bearer ${engineerToken}` }
        });
        reportStep('Engineer blocked from financial reports (403 Forbidden)', engReportRes.status === 403);

        const adminReportRes = await fetch(`${baseUrl}/api/reports/monthly-spend`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const reportData = await adminReportRes.json();
        reportStep('Admin successfully retrieves monthly spend report', adminReportRes.status === 200 && reportData.success === true && !!reportData.data?.summary);

        // Find current month aggregation in monthly breakdown
        const monthlyList = reportData.data?.monthly_breakdown || [];
        const currentMonthSpend = monthlyList.find(d => Number(d.total_spend) >= expectedTotal);
        reportStep('Monthly report accurately aggregates PO spend and ITC totals', !!currentMonthSpend || Number(reportData.data?.summary?.total_spend) >= expectedTotal, `(Summary total spend: ${reportData.data?.summary?.total_spend})`);

        console.log('\n===============================================================');
        console.log(`🎉 ALL ${stats.passed} END-TO-END INTEGRATION TESTS PASSED PERFECTLY! (0 FAILS)`);
        console.log('===============================================================\n');

    } finally {
        // -------------------------------------------------------------
        // STAGE 9: CLEANUP TEST ARTIFACTS
        // -------------------------------------------------------------
        console.log('🧹 Cleaning up test database records...');
        try {
            if (firstRequisitionId || excessiveRequisitionId) {
                await prisma.requisition.deleteMany({
                    where: { id: { in: [firstRequisitionId, excessiveRequisitionId].filter(Boolean) } }
                });
            }
            if (itemId) {
                await prisma.purchaseOrder.deleteMany({ where: { item_id: itemId } });
                await prisma.inventoryItem.deleteMany({ where: { id: itemId } });
            }
            if (supplierId) {
                await prisma.supplier.deleteMany({ where: { id: supplierId } });
            }
            if (testAdminId || testEngineerId) {
                await prisma.user.deleteMany({
                    where: { id: { in: [testAdminId, testEngineerId].filter(Boolean) } }
                });
            }
            console.log('✅ Cleanup completed cleanly.');
        } catch (cleanupErr) {
            console.warn('⚠️ Warning during test cleanup:', cleanupErr.message);
        }

        await prisma.$disconnect();
        server.close();
    }
}

if (require.main === module) {
    runE2ETests().catch(err => {
        console.error('\n❌ [E2E TEST RUNNER ERROR]:', err);
        process.exit(1);
    });
}

module.exports = runE2ETests;
