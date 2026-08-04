const { z } = require('zod');

const createRequisitionSchema = z.object({
  item_id: z
    .string({ required_error: "Item ID is required" })
    .uuid({ message: "Invalid item ID format (must be UUID)" }),

  qty: z
    .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
    .int({ message: "Quantity must be an integer" })
    .positive({ message: "Quantity must be greater than 0" })
    .min(1, { message: "Quantity must be at least 1" })
});

module.exports = {
  createRequisitionSchema
};
