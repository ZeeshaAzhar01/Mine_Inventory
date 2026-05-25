// controllers/auth.controller.js
const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');

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
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUser
};