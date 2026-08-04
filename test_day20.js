require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/prisma');

async function runTests() {
    console.log('🔄 Starting Day 20 Verification Test Suite...\n');

    // 1. Connect to DB
    try {
        await prisma.$connect();
        console.log('✅ 1. Database connection verified.');
    } catch (err) {
        console.error('❌ Failed to connect to database:', err.message);
        process.exit(1);
    }

    // 2. Start temporary server on a random port
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`✅ 2. Test server listening on ${baseUrl}`);

    try {
        // Helper function for making API requests
        const request = async (method, path, body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${baseUrl}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            const data = await res.json().catch(() => null);
            return { status: res.status, data };
        };

        // Test 1: Health Check
        const healthRes = await request('GET', '/api/health');
        if (healthRes.status === 200 && healthRes.data.status === 'UP') {
            console.log('✅ 3. Health Check: GET /api/health -> 200 OK');
        } else {
            throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
        }

        // Test 2: Create Admin & Engineer Users for Testing
        const timestamp = Date.now();
        const adminEmail = `admin_${timestamp}@mine.com`;
        const engineerEmail = `engineer_${timestamp}@mine.com`;
        const testPassword = 'SecurePassword123!';

        // Register Admin
        await request('POST', '/api/auth/register', {
            name: 'Mine Admin',
            email: adminEmail,
            password: testPassword
        });

        // Upgrade admin user role directly in DB for testing
        await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' }
        });

        // Register Engineer
        await request('POST', '/api/auth/register', {
            name: 'Site Engineer',
            email: engineerEmail,
            password: testPassword
        });

        // Login as Admin
        const adminLogin = await request('POST', '/api/auth/login', {
            email: adminEmail,
            password: testPassword
        });
        const adminToken = adminLogin.data.token;

        // Login as Engineer
        const engineerLogin = await request('POST', '/api/auth/login', {
            email: engineerEmail,
            password: testPassword
        });
        const engineerToken = engineerLogin.data.token;

        console.log('✅ 4. Auth & RBAC setup complete (Admin & Engineer tokens generated).');

        // Test 3: RBAC Protection on Report Endpoint
        const unauthReport = await request('GET', '/api/reports/monthly-spend');
        if (unauthReport.status === 401) {
            console.log('✅ 5. Security: Unauthenticated request to /api/reports/monthly-spend correctly returned 401.');
        } else {
            throw new Error(`Expected 401 for unauth report, got ${unauthReport.status}`);
        }

        const engineerReport = await request('GET', '/api/reports/monthly-spend', null, engineerToken);
        if (engineerReport.status === 403) {
            console.log('✅ 6. Security: Non-admin (Engineer) request to /api/reports/monthly-spend correctly returned 403 Forbidden.');
        } else {
            throw new Error(`Expected 403 for engineer report, got ${engineerReport.status}`);
        }

        // Test 4: Create Supplier and Inventory Item
        const supplierRes = await request('POST', '/api/suppliers', {
            name: `Heavy Spares Ltd ${timestamp}`,
            gst_number: `GSTIN_${timestamp}`,
            contact_info: 'procurement@heavyspares.com'
        }, adminToken);
        const supplierId = supplierRes.data.supplier.id;

        const itemRes = await request('POST', '/api/items', {
            name: `Crusher Liner Heavy Duty ${timestamp}`,
            category: 'Crushers',
            stock_qty: 0,
            min_stock_threshold: 5,
            unit_price: 10000,
            gst_rate: 18,
            supplier_id: supplierId
        }, adminToken);
        const itemId = itemRes.data.data.id;

        console.log('✅ 7. Supplier & Inventory Item created successfully.');

        // Test 5: Create Purchase Order (Day 15/16 GST logic)
        const poRes = await request('POST', '/api/purchase-orders', {
            supplier_id: supplierId,
            item_id: itemId,
            qty: 5
        }, adminToken);

        if (poRes.status === 201 && poRes.data.data.total_amount === 59000) {
            console.log(`✅ 8. Purchase Order created: Subtotal = ₹${poRes.data.data.subtotal}, Tax = ₹${poRes.data.data.itc_amount}, Total = ₹${poRes.data.data.total_amount} (Correct ₹59,000).`);
        } else {
            throw new Error(`PO math unexpected: ${JSON.stringify(poRes.data)}`);
        }

        // Test 6: Verify Day 20 Monthly Spend Aggregation
        const reportRes = await request('GET', '/api/reports/monthly-spend', null, adminToken);
        if (reportRes.status === 200 && reportRes.data.success) {
            const report = reportRes.data.data;
            console.log('\n📊 DAY 20 REPORT OUTPUT:');
            console.log('Summary:', JSON.stringify(report.summary, null, 2));
            console.log('Monthly Breakdown:', JSON.stringify(report.monthly_breakdown, null, 2));

            if (report.summary.total_spend >= 59000 && report.monthly_breakdown.length > 0) {
                console.log('\n✅ 9. Day 20 Monthly Spend aggregation verified successfully!');
            } else {
                throw new Error(`Report data verification failed: ${JSON.stringify(report)}`);
            }
        } else {
            throw new Error(`Report request failed with status ${reportRes.status}`);
        }

        // Test 7: Filter by current year
        const currentYear = new Date().getFullYear();
        const yearReportRes = await request('GET', `/api/reports/monthly-spend?year=${currentYear}`, null, adminToken);
        if (yearReportRes.status === 200 && yearReportRes.data.success) {
            console.log(`✅ 10. Year filter (?year=${currentYear}) verified successfully.`);
        } else {
            throw new Error(`Year filter failed: ${JSON.stringify(yearReportRes)}`);
        }

        console.log('\n🎉 ALL TESTS PASSED! Day 20 is completely verified and functional.\n');
    } catch (testError) {
        console.error('\n❌ Test failure:', testError);
        process.exitCode = 1;
    } finally {
        server.close();
        await prisma.$disconnect();
    }
}

runTests();
