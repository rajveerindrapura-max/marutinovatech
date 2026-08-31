const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const authRoutes = require('./auth');
const studentRoutes = require('./students');
const courseRoutes = require('./courses');
const activityRoutes = require('./activity');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/activity', activityRoutes);

module.exports = router;
