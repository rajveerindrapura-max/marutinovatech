const Course = require('../models/Course');

/**
 * GET /api/v1/courses
 * Returns all courses, optionally filtered by ?category=
 */
function getAll(req, res) {
  const category = req.query.category || null;
  const courses = Course.findAll(category);
  res.json(courses);
}

/**
 * GET /api/v1/courses/:id
 * Returns a single course by ID.
 */
function getById(req, res) {
  const { id } = req.params;
  const course = Course.findById(id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json(course);
}

module.exports = { getAll, getById };
