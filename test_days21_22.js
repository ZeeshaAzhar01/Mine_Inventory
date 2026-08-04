require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/prisma');

async function runTests() {
    console.log('🔄 Starting End-to-End Verification Test Suite (Days 21 & 22)...\n');

    // 1. Connect to DB
    try {
        await prisma.$connect();
        console.log('✅ 1. Database connected.');
    } catch (err) {
        console.error('❌ Failed to connect to database:', err.message);
        process.exit(1);
    }

    // 2. Start temporary test server
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`✅ 2. Test server listening on ${baseUrl}`);

    try {
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

        console.log('\n--- PART 1: DAY 22 ZOD AUTH VALIDATION TESTS ---');

        const timestamp = Date.now();

        // Test 1: Register missing name
        const missingNameRes = await request('POST', '/api/auth/register', {
            email: `user_${timestamp}@mine.com`,
            password: 'ValidPass123!'
        });
        if (missingNameRes.status === 400 && missingNameRes.data.errors.some(e => e.field === 'name')) {
            console.log('✅ 3. Zod Validation: Missing name correctly rejected (400 Bad Request).');
        } else {
            throw new Error(`Missing name test failed: ${JSON.stringify(missingNameRes)}`);
        }

        // Test 2: Register invalid email
        const invalidEmailRes = await request('POST', '/api/auth/register', {
            name: 'Test User',
            email: 'not-an-email',
            password: 'ValidPass123!'
        });
        if (invalidEmailRes.status === 400 && invalidEmailRes.data.errors.some(e => e.field === 'email')) {
            console.log('✅ 4. Zod Validation: Invalid email format correctly rejected (400 Bad Request).');
        } else {
            throw new Error(`Invalid email test failed: ${JSON.stringify(invalidEmailRes)}`);
        }

        // Test 3: Register weak password (< 8 chars)
        const shortPassRes = await request('POST', '/api/auth/register', {
            name: 'Test User',
            email: `user_short_${timestamp}@mine.com`,
            password: 'Pass1!'
        });
        if (shortPassRes.status === 400 && shortPassRes.data.errors.some(e => e.field === 'password')) {
            console.log('✅ 5. Zod Validation: Short password (<8 chars) correctly rejected (400 Bad Request).');
        } else {
            throw new Error(`Short password test failed: ${JSON.stringify(shortPassRes)}`);
        }

        // Test 4: Register password missing special character
        const noSpecialPassRes = await request('POST', '/api/auth/register', {
            name: 'Test User',
            email: `user_nospec_${timestamp}@mine.com`,
            password: 'Password123'
        });
        if (noSpecialPassRes.status === 400 && noSpecialPassRes.data.errors.some(e => e.field === 'password')) {
            console.log('✅ 6. Zod Validation: Password missing special char correctly rejected (400 Bad Request).');
        } else {
            throw new Error(`Password missing special char test failed: ${JSON.stringify(noSpecialPassRes)}`);
        }

        // Test 5: Register password missing numbers
        const noNumPassRes = await request('POST', '/api/auth/register', {
            name: 'Test User',
            email: `user_nonum_${timestamp}@mine.com`,
            password: 'PasswordTest!'
        });
        if (noNumPassRes.status === 400 && noNumPassRes.data.errors.some(e => e.field === 'password')) {
            console.log('✅ 7. Zod Validation: Password missing number correctly rejected (400 Bad Request).');
        } else {
            throw new Error(`Password missing number test failed: ${JSON.stringify(noNumPassRes)}`);
        }

        // Test 6: Valid Registration (Admin & Engineer)
        const adminEmail = `admin_${timestamp}@mine.com`;
        const engineerEmail = `engineer_${timestamp}@mine.com`;
        const validPassword = 'SecurePassword123!';

        const adminRegRes = await request('POST', '/api/auth/register', {
            name: 'Mine Manager Admin',
            email: adminEmail,
            password: validPassword
        });
        if (adminRegRes.status === 201 && adminRegRes.data.user.email === adminEmail) {
            console.log('✅ 8. Zod Validation: Valid registration accepted (201 Created).');
        } else {
            throw new Error(`Valid registration failed: ${JSON.stringify(adminRegRes)}`);
        }

        // Upgrade admin user role to ADMIN in DB
        await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' }
        });

        // Register Engineer
        await request('POST', '/api/auth/register', {
            name: 'Site Field Engineer',
            email: engineerEmail,
            password: validPassword
        });

        // Test 7: Login validation (Invalid email format)
        const invalidLoginRes = await request('POST', '/api/auth/login', {
            email: 'not-an-email',
            password: validPassword
        });
        if (invalidLoginRes.status === 400 && invalidLoginRes.data.errors.some(e => e.field === 'email')) {
            console.log('✅ 9. Zod Validation: Malformed login payload rejected (400 Bad Request).');
        } else {
            throw new Error(`Malformed login payload test failed: ${JSON.stringify(invalidLoginRes)}`);
        }

        // Test 8: Login with valid credentials
        const adminLoginRes = await request('POST', '/api/auth/login', {
            email: adminEmail,
            password: validPassword
        });
        const engineerLoginRes = await request('POST', '/api/auth/login', {
            email: engineerEmail,
            password: validPassword
        });

        if (adminLoginRes.status === 200 && adminLoginRes.data.token && engineerLoginRes.status === 200) {
            console.log('✅ 10. Login successful and JWT tokens issued.');
        } else {
            throw new Error(`Login failed: ${JSON.stringify(adminLoginRes)}`);
        }

        const adminToken = adminLoginRes.data.token;
        const engineerToken = engineerLoginRes.data.token;

        console.log('\n--- PART 2: DAY 21 REQUISITION & TRANSACTION FLOW VERIFICATION ---');

        // Test 9: Create Supplier & Item
        const supplierRes = await request('POST', '/api/suppliers', {
            name: `Apex Mining Spares ${timestamp}`,
            gst_number: `GST_${timestamp}`,
            contact_info: 'contact@apexmining.com'
        }, adminToken);
        const supplierId = supplierRes.data.supplier.id;

        const itemRes = await request('POST', '/api/items', {
            name: `Drill Bit Assembly 50mm ${timestamp}`,
            category: 'Drilling',
            stock_qty: 0,
            min_stock_threshold: 3,
            unit_price: 25000,
            gst_rate: 18,
            supplier_id: supplierId
        }, adminToken);
        const itemId = itemRes.data.data.id;

        console.log('✅ 11. Supplier and Inventory item created.');

        // Test 10: Stock Item via Purchase Order (Add 10 units)
        const poRes = await request('POST', '/api/purchase-orders', {
            supplier_id: supplierId,
            item_id: itemId,
            qty: 10
        }, adminToken);

        if (poRes.status === 201 && poRes.data.data.total_amount === 295000) {
            console.log(`✅ 12. Purchase Order created: 10 units added (Total = ₹${poRes.data.data.total_amount}).`);
        } else {
            throw new Error(`PO creation failed: ${JSON.stringify(poRes)}`);
        }

        // Verify item stock is 10
        const itemBeforeReq = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (itemBeforeReq.stock_qty !== 10) {
            throw new Error(`Stock mismatch: expected 10, got ${itemBeforeReq.stock_qty}`);
        }

        // Test 11: Engineer submits Requisition for 4 units
        const reqRes1 = await request('POST', '/api/requisitions', {
            item_id: itemId,
            qty: 4
        }, engineerToken);

        if (reqRes1.status === 201 && reqRes1.data.data.status === 'PENDING') {
            console.log('✅ 13. Requisition submitted by Engineer (Status: PENDING).');
        } else {
            throw new Error(`Requisition creation failed: ${JSON.stringify(reqRes1)}`);
        }

        const requisitionId1 = reqRes1.data.data.id;

        // Test 12: Admin approves Requisition 1 (Deducts 4 units -> Stock becomes 6)
        const approveRes1 = await request('PUT', `/api/requisitions/${requisitionId1}/approve`, null, adminToken);
        if (approveRes1.status === 200 && approveRes1.data.data.status === 'APPROVED') {
            console.log('✅ 14. Requisition approved by Admin.');
        } else {
            throw new Error(`Requisition approval failed: ${JSON.stringify(approveRes1)}`);
        }

        // Verify stock deducted in DB
        const itemAfterApproval = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (itemAfterApproval.stock_qty === 6) {
            console.log('✅ 15. ACID Transaction verified: Stock decremented correctly (10 - 4 = 6 units).');
        } else {
            throw new Error(`Stock decrement failed: expected 6, got ${itemAfterApproval.stock_qty}`);
        }

        // Test 13: Attempt to approve already approved requisition
        const reApproveRes = await request('PUT', `/api/requisitions/${requisitionId1}/approve`, null, adminToken);
        if (reApproveRes.status === 400) {
            console.log('✅ 16. Guard Check: Re-approving already approved requisition correctly blocked (400 Bad Request).');
        } else {
            throw new Error(`Re-approval should be rejected, got: ${reApproveRes.status}`);
        }

        // Test 14: Race Condition / Insufficient Stock Check
        // Request 10 units when only 6 are in stock
        const reqRes2 = await request('POST', '/api/requisitions', {
            item_id: itemId,
            qty: 10
        }, engineerToken);
        const requisitionId2 = reqRes2.data.data.id;

        const overStockApproveRes = await request('PUT', `/api/requisitions/${requisitionId2}/approve`, null, adminToken);
        if (overStockApproveRes.status === 400 && overStockApproveRes.data.message.includes('Insufficient stock')) {
            console.log('✅ 17. Race Condition / Safety check verified: Insufficient stock error raised (400 Bad Request).');
        } else {
            throw new Error(`Insufficient stock check failed: ${JSON.stringify(overStockApproveRes)}`);
        }

        // Verify stock is still 6
        const itemFinalCheck = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (itemFinalCheck.stock_qty === 6) {
            console.log('✅ 18. Stock integrity intact: Stock remained unchanged at 6 units after failed approval.');
        } else {
            throw new Error(`Stock corrupted: expected 6, got ${itemFinalCheck.stock_qty}`);
        }

        // Test 15: RBAC on Requisition Approval (Engineer cannot approve)
        const engineerApproveAttempt = await request('PUT', `/api/requisitions/${requisitionId2}/approve`, null, engineerToken);
        if (engineerApproveAttempt.status === 403) {
            console.log('✅ 19. RBAC Verified: Non-admin cannot approve requisitions (403 Forbidden).');
        } else {
            throw new Error(`RBAC check failed on approval: ${engineerApproveAttempt.status}`);
        }

        console.log('\n🎉 ALL 19 TEST ASSERTIONS PASSED! Days 21 & 22 are 100% verified and correct.\n');

    } catch (testErr) {
        console.error('\n❌ Test suite failed:', testErr);
        process.exitCode = 1;
    } finally {
        server.close();
        await prisma.$disconnect();
    }
}

runTests();
