const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

// GET all users
router.get("/", userController.getAllUsers);

// GET user by id (params)
router.get("/:id", userController.getUserById);

// POST new user
router.post("/", userController.createUser);

module.exports = router;