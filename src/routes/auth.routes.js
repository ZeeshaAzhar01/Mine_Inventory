// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// Register endpoint with Zod schema validation
router.post('/register', validate(registerSchema), authController.registerUser);

// Login endpoint with Zod schema validation
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;