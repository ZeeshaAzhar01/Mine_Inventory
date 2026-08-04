const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Mining Inventory & Supply Chain Management API',
    version: '1.0.0',
    description: `
### Mining Spares, Procurement, Requisitions & GST Accounting API
Production-grade RESTful API built with Node.js, Express, PostgreSQL, Prisma ORM, and Zod.

#### Core Modules:
- **Auth & RBAC**: Stateless JWT authentication with Role-Based Access Control (\`ADMIN\` and \`ENGINEER\`).
- **Suppliers**: Full vendor lifecycle management with unique GST validation.
- **Inventory Items**: Mining spares catalog with automated low-stock detection, search, and pagination.
- **Purchase Orders**: Stock replenishment with automated financial math (Subtotal, ITC 18% GST calculation, Total) within ACID transactions.
- **Requisitions**: Site engineers requisition spares; managers approve requests with atomic race-condition-safe inventory deductions.
- **Analytics & Reports**: Monthly financial spend aggregations via database GROUP BY queries.
- **Observability & Error Handling**: Winston and Morgan logging pipeline with centralized operational error formats.
    `,
    contact: {
      name: 'Mining Inventory Support',
      email: 'support@mineinventory.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid JWT token. Example: Bearer eyJhbGciOi...',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4607-8e65-388a1005a909' },
          name: { type: 'string', example: 'Alex Stone' },
          email: { type: 'string', format: 'email', example: 'alex.engineer@mineinventory.com' },
          role: { type: 'string', enum: ['ADMIN', 'ENGINEER'], example: 'ENGINEER' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50, example: 'Alex Stone' },
          email: { type: 'string', format: 'email', example: 'alex.engineer@mineinventory.com' },
          password: { type: 'string', minLength: 6, maxLength: 100, example: 'SecurePass123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@mineinventory.com' },
          password: { type: 'string', example: 'AdminSecret123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Supplier: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          name: { type: 'string', example: 'Heavy Machinery Spares Ltd' },
          gst_number: { type: 'string', example: '29ABCDE1234F2Z5' },
          contact_info: { type: 'string', example: 'supplier@heavymachinery.com | +91-9876543210' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateSupplierInput: {
        type: 'object',
        required: ['name', 'gst_number', 'contact_info'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Heavy Machinery Spares Ltd' },
          gst_number: { type: 'string', minLength: 3, maxLength: 20, example: '29ABCDE1234F2Z5' },
          contact_info: { type: 'string', minLength: 3, maxLength: 255, example: 'supplier@heavymachinery.com' },
        },
      },
      UpdateSupplierInput: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Heavy Machinery Spares India Pvt Ltd' },
          gst_number: { type: 'string', minLength: 3, maxLength: 20, example: '29ABCDE1234F2Z5' },
          contact_info: { type: 'string', minLength: 3, maxLength: 255, example: 'newcontact@heavymachinery.com' },
        },
      },
      InventoryItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '6f9c8b74-1234-4567-89ab-cdef01234567' },
          name: { type: 'string', example: 'Excavator Hydraulic Pump' },
          category: { type: 'string', example: 'Hydraulics' },
          stock_qty: { type: 'integer', example: 15 },
          min_stock_threshold: { type: 'integer', example: 5 },
          unit_price: { type: 'number', format: 'float', example: 25000.0 },
          gst_rate: { type: 'number', format: 'float', example: 18.0 },
          supplier_id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          supplier: { $ref: '#/components/schemas/Supplier' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateItemInput: {
        type: 'object',
        required: ['name', 'category', 'unit_price', 'supplier_id'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Excavator Hydraulic Pump' },
          category: { type: 'string', minLength: 2, maxLength: 50, example: 'Hydraulics' },
          stock_qty: { type: 'integer', minimum: 0, default: 0, example: 15 },
          min_stock_threshold: { type: 'integer', minimum: 0, default: 10, example: 5 },
          unit_price: { type: 'number', minimum: 0.01, example: 25000.0 },
          gst_rate: { type: 'number', minimum: 0, maximum: 100, default: 18.0, example: 18.0 },
          supplier_id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
        },
      },
      PurchaseOrder: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
          qty: { type: 'integer', example: 5 },
          base_price: { type: 'number', example: 10000.0 },
          subtotal: { type: 'number', example: 50000.0 },
          itc_amount: { type: 'number', example: 9000.0 },
          total_amount: { type: 'number', example: 59000.0 },
          supplier_id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          item_id: { type: 'string', format: 'uuid', example: '6f9c8b74-1234-4567-89ab-cdef01234567' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreatePurchaseOrderInput: {
        type: 'object',
        required: ['supplier_id', 'item_id', 'qty'],
        properties: {
          supplier_id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          item_id: { type: 'string', format: 'uuid', example: '6f9c8b74-1234-4567-89ab-cdef01234567' },
          qty: { type: 'integer', minimum: 1, example: 5 },
        },
      },
      Requisition: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'e7a82914-94c6-4b95-a50d-85f00e9a7e02' },
          qty_requested: { type: 'integer', example: 2 },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
          user_id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4607-8e65-388a1005a909' },
          item_id: { type: 'string', format: 'uuid', example: '6f9c8b74-1234-4567-89ab-cdef01234567' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateRequisitionInput: {
        type: 'object',
        required: ['item_id', 'qty'],
        properties: {
          item_id: { type: 'string', format: 'uuid', example: '6f9c8b74-1234-4567-89ab-cdef01234567' },
          qty: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      MonthlySpendReport: {
        type: 'object',
        properties: {
          month: { type: 'string', example: '2026-08' },
          total_spend: { type: 'number', example: 118000.0 },
          total_itc: { type: 'number', example: 18000.0 },
          orders_count: { type: 'integer', example: 4 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Resource not found or unauthorized access' },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'qty' },
                message: { type: 'string', example: 'Quantity must be at least 1' },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.routes.js').replace(/\\/g, '/'),
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../app.js').replace(/\\/g, '/'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
