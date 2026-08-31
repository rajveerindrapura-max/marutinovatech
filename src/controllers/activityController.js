const Student = require('../models/Student');
const { getDb } = require('../db/connection');

/**
 * POST /api/v1/activity
 * Logs study activity for a student.
 * Creates the student if they don't exist (preserves original behavior).
 * Also writes to activity_log table for audit trail.
 */
function logActivity(req, res) {
  const payload = req.body;
  const studentId = payload.id || 'rahul-sharma';

  let student = Student.findByIdOrEmail(studentId);
  if (!student && payload.email) {
    student = Student.findByIdOrEmail(payload.email);
  }

  // Create student if not found (preserves original server.js behavior)
  if (!student) {
    student = Student.create({
      id: studentId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: payload.name || 'New Student',
      email: payload.email || `${studentId}@marutinova.com`,
      cohort: 'Cohort 14',
      course: 'Data & Cloud Engineering',
      totalStudyTimeHours: 0,
      todayStudyTime: 0,
      status: 'Active',
      labBreakdownHours: { sqlLab: 0, pythonSandbox: 0, pysparkLab: 0 },
    });
  }

  // Calculate added hours and update
  const addedHours = payload.addedSeconds / 3600;

  const updatedStudent = Student.updateActivity(student.id, {
    addedHours,
    labType: payload.labType,
    lastTopic: payload.lastTopic,
    lastTopicUrl: payload.lastTopicUrl,
  });

  // Write to audit log
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO activity_log (student_id, seconds, lab_type, topic, topic_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      student.id,
      payload.addedSeconds,
      payload.labType || null,
      payload.lastTopic || null,
      payload.lastTopicUrl || null
    );
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
    // Non-fatal — don't block the response
  }

  res.json({ success: true, student: updatedStudent });
}

module.exports = { logActivity };
