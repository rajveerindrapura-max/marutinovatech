const express = require('express');
const router = express.Router();
const { logActivity } = require('../../controllers/activityController');
const { validate } = require('../../middleware/validate');
const { activitySchema } = require('../../validators/activitySchema');
const { optionalAuth } = require('../../middleware/auth');

/**
 * POST /api/v1/activity
 * Validated activity logging. Optional auth (doesn't block if no token).
 * This keeps backward compatibility — the frontend currently sends activity
 * without auth tokens, and we don't want to break that immediately.
 */
router.post('/', optionalAuth, validate(activitySchema), logActivity);

module.exports = router;
