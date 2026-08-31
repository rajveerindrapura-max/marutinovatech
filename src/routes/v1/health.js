const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/health
 * Health check endpoint for monitoring and load balancers.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

module.exports = router;
