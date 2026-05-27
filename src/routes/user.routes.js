const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const userController = require("../controllers/user.controller");

// GET all users
router.get("/", verifyToken,userController.getAllUsers);

// GET user by id (params)
router.get("/:id", verifyToken, userController.getUserById);

// POST new user(only admin is allowed to create new users)
router.post("/", verifyToken, isAdmin, userController.createUser);


// Only ADMINs can access this (Token AND Admin status required)
router.post('/admin-only', verifyToken, isAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to the Admin Lounge!" });
});

module.exports = router;