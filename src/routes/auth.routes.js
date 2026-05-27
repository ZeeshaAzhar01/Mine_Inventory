// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Map the POST request to the register controller function
router.post('/register', authController.registerUser);
// Map the POST request to the login controller function
router.post('/login', authController.login);
module.exports = router;