// controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Controller function to handle user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists (Industry standard practice)
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // 2. Hash the password (10 is the "salt rounds" - a good balance of security and speed)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Save the new user to the database
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password_hash: hashedPassword, // Store the hash, NOT the plain text
        // role defaults to ENGINEER based on our schema from Day 4
      }
    });

    // 4. Send success response (excluding the password hash for security)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// Controller function to handle user login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // 2. Find the user in the database
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" }); // 401 = Unauthorized
        }

        // 3. Compare the provided password with the hashed password in DB
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 4. Generate the JWT (The "Wristband")
        // Payload contains userId and role (crucial for Day 7 RBAC)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 5. Send the response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
  registerUser,
  login
};