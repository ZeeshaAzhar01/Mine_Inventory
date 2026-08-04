const { z } = require('zod');

const createItemSchema = z.object({
  name: z
    .string({ required_error: "Item name is required" })
    .trim()
    .min(2, { message: "Item name must be at least 2 characters" })
    .max(100, { message: "Item name cannot exceed 100 characters" }),

  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .min(2, { message: "Category must be at least 2 characters" })
    .max(50, { message: "Category cannot exceed 50 characters" }),

  stock_qty: z
    .number({ invalid_type_error: "Stock quantity must be a number" })
    .int({ message: "Stock quantity must be an integer" })
    .min(0, { message: "Stock quantity cannot be negative" })
    .default(0)
    .optional(),

  min_stock_threshold: z
    .number({ invalid_type_error: "Min stock threshold must be a number" })
    .int({ message: "Min stock threshold must be an integer" })
    .min(0, { message: "Min stock threshold cannot be negative" })
    .default(10)
    .optional(),

  unit_price: z
    .number({ required_error: "Unit price is required", invalid_type_error: "Unit price must be a number" })
    .positive({ message: "Unit price must be greater than 0" }),

  gst_rate: z
    .number({ required_error: "GST rate is required", invalid_type_error: "GST rate must be a number" })
    .min(0, { message: "GST rate cannot be negative" })
    .max(100, { message: "GST rate cannot exceed 100%" }),

  supplier_id: z
    .string({ required_error: "Supplier ID is required" })
    .uuid({ message: "Invalid supplier ID format (must be UUID)" })
});

module.exports = {
  createItemSchema
};
