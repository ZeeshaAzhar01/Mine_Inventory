const { z } = require('zod');

const createSupplierSchema = z.object({
  name: z
    .string({ required_error: "Supplier name is required" })
    .trim()
    .min(2, { message: "Supplier name must be at least 2 characters" })
    .max(100, { message: "Supplier name cannot exceed 100 characters" }),

  gst_number: z
    .string({ required_error: "GST number is required" })
    .trim()
    .min(3, { message: "GST number must be at least 3 characters" })
    .max(20, { message: "GST number cannot exceed 20 characters" }),

  contact_info: z
    .string({ required_error: "Contact information is required" })
    .trim()
    .min(3, { message: "Contact info must be at least 3 characters" })
    .max(255, { message: "Contact info cannot exceed 255 characters" })
});

const updateSupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Supplier name must be at least 2 characters" })
    .max(100, { message: "Supplier name cannot exceed 100 characters" })
    .optional(),

  gst_number: z
    .string()
    .trim()
    .min(3, { message: "GST number must be at least 3 characters" })
    .max(20, { message: "GST number cannot exceed 20 characters" })
    .optional(),

  contact_info: z
    .string()
    .trim()
    .min(3, { message: "Contact info must be at least 3 characters" })
    .max(255, { message: "Contact info cannot exceed 255 characters" })
    .optional()
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema
};
