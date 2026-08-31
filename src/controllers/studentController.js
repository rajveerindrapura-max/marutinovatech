const Student = require('../models/Student');

/**
 * GET /api/v1/students
 * Returns all students with enriched metrics.
 */
function getAll(req, res) {
  const students = Student.findAll();
  const enriched = students.map(s => Student.enrichMetrics(s));
  res.json(enriched);
}

/**
 * GET /api/v1/students/me
 * Returns authenticated student's profile with enriched metrics.
 */
function getMe(req, res) {
  const email = req.user ? req.user.email : null;
  const id = req.user ? req.user.id : null;

  let student = null;
  if (id) student = Student.findByIdOrEmail(String(id));
  if (!student && email) student = Student.findByIdOrEmail(email);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(Student.enrichMetrics(student));
}

/**
 * GET /api/v1/students/:id
 * Returns a single student by ID or email, with enriched metrics.
 */
function getById(req, res) {
  const { id } = req.params;
  const student = Student.findByIdOrEmail(id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(Student.enrichMetrics(student));
}

/**
 * PATCH or POST /api/v1/students/:id/progress
 * Updates progress, solved questions, unlocks, or topics for a student.
 */
function updateProgress(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  // Check authorization if user token is present
  if (req.user && req.user.role !== 'admin') {
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const userId = String(req.user.id || '').toLowerCase().trim();
    const targetId = String(id).toLowerCase().trim();

    let targetStudent = Student.findByIdOrEmail(id);
    if (targetStudent) {
      const sEmail = (targetStudent.email || '').toLowerCase().trim();
      const sId = String(targetStudent.id || '').toLowerCase().trim();
      if (sEmail !== userEmail && sId !== userId && targetId !== sEmail && targetId !== sId) {
        return res.status(403).json({ error: 'Forbidden: Cannot modify another student profile' });
      }
    }
  }

  let student = Student.findByIdOrEmail(id);
  if (!student && (body.email || id.includes('@'))) {
    const sEmail = (body.email || id).toLowerCase().trim();
    student = Student.create({
      id: sEmail.split('@')[0].replace(/[^a-z0-9]+/g, '-'),
      name: body.name || sEmail.split('@')[0],
      fullName: body.fullName || body.name || sEmail.split('@')[0],
      email: sEmail,
      cohort: body.cohort || 'Cohort 14',
      course: body.course || 'Data & Cloud Engineering',
      enrolledCourses: body.enrolledCourses || ['sql'],
      unlockedCourses: body.unlockedCourses || [],
      unlockedPlaygrounds: body.unlockedPlaygrounds || [],
      completedQuestions: body.completedQuestions || body.solvedQuestions || [],
      solvedQuestions: body.solvedQuestions || body.completedQuestions || [],
      pythonCompleted: body.pythonCompleted || [],
      isPaid: body.isPaid || false,
      isSqlPaid: body.isSqlPaid || false,
      isPythonPaid: body.isPythonPaid || false
    });
  }

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const updated = Student.updateProgress(student.id, body);
  res.json({ success: true, student: Student.enrichMetrics(updated) });
}

/**
 * POST /api/v1/students/:id/unlock
 * Unlocks a specific course or playgrounds for a student.
 */
function unlockCourse(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  let student = Student.findByIdOrEmail(id);
  if (!student && (body.email || id.includes('@'))) {
    const sEmail = (body.email || id).toLowerCase().trim();
    student = Student.create({
      id: sEmail.split('@')[0].replace(/[^a-z0-9]+/g, '-'),
      name: body.name || sEmail.split('@')[0],
      fullName: body.fullName || body.name || sEmail.split('@')[0],
      email: sEmail,
      cohort: body.cohort || 'Cohort 14',
      course: body.course || 'Data & Cloud Engineering',
      enrolledCourses: body.enrolledCourses || ['sql'],
      unlockedCourses: body.unlockedCourses || [],
      unlockedPlaygrounds: body.unlockedPlaygrounds || [],
      isPaid: true
    });
  }

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const currentUnlockedCourses = Array.isArray(student.unlockedCourses) ? [...student.unlockedCourses] : [];
  const currentUnlockedPlaygrounds = Array.isArray(student.unlockedPlaygrounds) ? [...student.unlockedPlaygrounds] : [];

  if (Array.isArray(body.unlockedCourses)) {
    body.unlockedCourses.forEach(c => {
      if (!currentUnlockedCourses.includes(c)) currentUnlockedCourses.push(c);
    });
  }
  if (body.courseId && !currentUnlockedCourses.includes(body.courseId)) {
    currentUnlockedCourses.push(body.courseId);
  }

  if (Array.isArray(body.unlockedPlaygrounds)) {
    body.unlockedPlaygrounds.forEach(p => {
      if (!currentUnlockedPlaygrounds.includes(p)) currentUnlockedPlaygrounds.push(p);
    });
  }
  if (body.playgroundId && !currentUnlockedPlaygrounds.includes(body.playgroundId)) {
    currentUnlockedPlaygrounds.push(body.playgroundId);
  }

  const isSqlPaid = body.isSqlPaid !== undefined ? body.isSqlPaid : (currentUnlockedCourses.includes('sql') || student.isSqlPaid);
  const isPythonPaid = body.isPythonPaid !== undefined ? body.isPythonPaid : (currentUnlockedCourses.includes('python') || student.isPythonPaid);

  const updated = Student.updateProgress(student.id, {
    unlockedCourses: currentUnlockedCourses,
    unlockedPlaygrounds: currentUnlockedPlaygrounds,
    isSqlPaid: Boolean(isSqlPaid),
    isPythonPaid: Boolean(isPythonPaid),
    isPaid: true
  });

  res.json({ success: true, student: Student.enrichMetrics(updated) });
}

module.exports = { getAll, getMe, getById, updateProgress, unlockCourse };

