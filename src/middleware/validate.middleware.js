/**
 * Generic validation middleware for validating request bodies against a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const formattedErrors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors
    });
  }

  // Replace req.body with the parsed/sanitized data (e.g. trimmed strings, lowercased emails)
  req.body = result.data;
  next();
};

module.exports = validate;
