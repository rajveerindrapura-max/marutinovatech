const { ZodError } = require('zod');

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // Replace with parsed/sanitized data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      next(err);
    }
  };
}

/**
 * Validates req.query against a Zod schema.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, validateQuery };
