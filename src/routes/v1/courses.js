const express = require('express');
const router = express.Router();
const { getAll, getById } = require('../../controllers/courseController');

/**
 * GET /api/v1/courses
 * Public — no auth required.
 */
router.get('/', getAll);

/**
 * GET /api/v1/courses/:id
 * Public — no auth required.
 */
router.get('/:id', getById);

module.exports = router;
