const express = require("express");

const app = express();

// 1. Middlewares (Must come before routes!)
// HTTP Request Logging via Morgan & Winston
const morganMiddleware = require("./middleware/morgan.middleware");
app.use(morganMiddleware);

// This is required to parse req.body as JSON
app.use(express.json());

// 2. Import Routes
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes"); 

// 3. Wire Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); 

//supplier routes
const supplierRoutes = require('./routes/supplier.routes');
app.use('/api/suppliers', supplierRoutes);

//inventory routes
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/api/items', inventoryRoutes);

//purchase order routes
const poRoutes = require('./routes/purchaseOrder.routes');
app.use('/api/purchase-orders', poRoutes);

//requisition routes
const requisitionRoutes = require('./routes/requisition.routes');
app.use('/api/requisitions', requisitionRoutes);

//report routes (Day 20 Analytics)
const reportRoutes = require('./routes/report.routes');
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "UP", message: "Mining Inventory API is healthy" });
});

// 4. Handle Unhandled Routes (404 Not Found)
const AppError = require('./utils/AppError');
app.use((req, res, next) => {
    next(new AppError(`Cannot find route ${req.method} ${req.originalUrl} on this server`, 404));
});

// 5. Centralized Global Error Handler Middleware
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

// 6. Export the configured app
module.exports = app;