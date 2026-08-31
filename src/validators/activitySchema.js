const { z } = require('zod');

/**
 * Schema for POST /api/v1/activity request body.
 * Validates and bounds all fields to prevent data corruption.
 */
const activitySchema = z.object({
  id: z.string().min(1).max(100).trim(),
  name: z.string().min(1).max(200).trim().optional(),
  email: z.string().email().max(254).optional(),
  addedSeconds: z.number().int().min(0).max(86400), // Max 24 hours (1 day)
  labType: z.enum(['sqlLab', 'pythonSandbox', 'pysparkLab', 'index']).optional(),
  lastTopic: z.string().max(500).trim().optional(),
  lastTopicUrl: z.string().max(500).trim().optional(),
});

module.exports = { activitySchema };
