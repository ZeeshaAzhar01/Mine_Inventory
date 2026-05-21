const express = require("express");

const app = express();

// middleware to parse JSON
app.use(express.json());

// routes
const userRoutes = require("./src/routes/user.routes");

app.use("/api/users", userRoutes);

module.exports = app;