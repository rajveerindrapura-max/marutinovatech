const express = require('express');
const router = express.Router();
const { getAll, getMe, getById, updateProgress, unlockCourse } = require('../../controllers/studentController');
const { logActivity } = require('../../controllers/activityController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../../middleware/auth');

/**
 * GET /api/v1/students
 * Protected — requires admin JWT.
 */
router.get('/', authenticateToken, requireAdmin, getAll);

/**
 * GET /api/v1/students/me
 * Protected — returns own student record for authenticated user.
 */
router.get('/me', authenticateToken, getMe);

/**
 * POST /api/v1/students/activity
 * Log activity for student. Optional auth.
 */
router.post('/activity', optionalAuth, logActivity);

/**
 * GET /api/v1/students/:id
 * Protected — requires admin JWT.
 */
router.get('/:id', authenticateToken, requireAdmin, getById);

/**
 * PATCH & POST /api/v1/students/:id/progress
 * Update completedQuestions / progress / unlocks for a student. Optional auth.
 */
router.patch('/:id/progress', optionalAuth, updateProgress);
router.post('/:id/progress', optionalAuth, updateProgress);

/**
 * POST & PATCH /api/v1/students/:id/unlock
 * Unlock courses for a student. Optional auth.
 */
router.post('/:id/unlock', optionalAuth, unlockCourse);
router.patch('/:id/unlock', optionalAuth, unlockCourse);

module.exports = router;

