const express = require("express");

const app = express();

// 1. Middlewares (Must come before routes!)
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

// 4. Export the configured app
module.exports = app;