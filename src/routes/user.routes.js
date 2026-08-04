const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userController = require("../controllers/user.controller");

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Returns a list of all registered users in the mining inventory system.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registered users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (Token missing or invalid).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyToken, userController.getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves user details for a specific UUID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", verifyToken, userController.getUserById);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create user (Admin Only)
 *     description: Creates a user account directly with designated roles. Requires Admin privileges.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (Admin privileges required).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyToken, isAdmin, userController.createUser);

/**
 * @openapi
 * /api/users/admin-only:
 *   post:
 *     summary: Admin privilege test endpoint
 *     description: Protected diagnostic endpoint confirming caller possesses active Admin role.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin authorization confirmed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the Admin Lounge!
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Admin privileges required).
 */
router.post('/admin-only', verifyToken, isAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to the Admin Lounge!" });
});

module.exports = router;