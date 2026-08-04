const { z } = require('zod');

// Schema for user registration
const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name cannot exceed 100 characters" }),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email({ message: "Please provide a valid email address" }),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password cannot exceed 128 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),

  role: z
    .enum(['ADMIN', 'ENGINEER'], { message: "Role must be either ADMIN or ENGINEER" })
    .optional()
});

// Schema for user login
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email({ message: "Please provide a valid email address" }),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password is required" })
});

module.exports = {
  registerSchema,
  loginSchema
};
