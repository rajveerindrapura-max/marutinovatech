const { z } = require('zod');

/**
 * Schema for POST /api/v1/auth/login request body.
 */
const loginSchema = z.object({
  email: z.string().email().max(254).trim(),
  password: z.string().min(6).max(128),
});

/**
 * Schema for POST /api/v1/auth/signup request body.
 */
const signupSchema = z.object({
  email: z.string().email().max(254).trim(),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(100).trim().optional(),
  fullName: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  course: z.union([z.string().max(200), z.array(z.string())]).optional(),
  courses: z.array(z.string()).optional(),
  cohort: z.string().max(50).optional(),
});

module.exports = { loginSchema, signupSchema };
