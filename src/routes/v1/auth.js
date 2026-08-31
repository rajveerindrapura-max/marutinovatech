const express = require('express');
const router = express.Router();
const { login, signup } = require('../../controllers/authController');
const { validate } = require('../../middleware/validate');
const { loginSchema, signupSchema } = require('../../validators/authSchema');
const { authLimiter } = require('../../middleware/rateLimiter');

/**
 * POST /api/v1/auth/login
 * Rate-limited + validated login endpoint.
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * POST /api/v1/auth/signup
 * Rate-limited + validated signup endpoint.
 */
router.post('/signup', authLimiter, validate(signupSchema), signup);

module.exports = router;
