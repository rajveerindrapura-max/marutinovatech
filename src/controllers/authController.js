const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const config = require('../config');

/**
 * Helper to generate stable slug ID from email.
 */
function getSlugFromEmail(email) {
  if (!email) return 'student-' + Date.now();
  const prefix = email.split('@')[0];
  return prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns a JWT token.
 */
function login(req, res) {
  const { email, password } = req.body;

  const user = User.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Account not found. Please create an account first.' });
  }

  if (!User.verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password. Please check your credentials and try again.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  });
}

/**
 * POST /api/v1/auth/signup
 * Registers a new student user and student record, returning JWT + user.
 */
function signup(req, res) {
  const { email, password, name, fullName, course, courses, cohort } = req.body;
  const studentName = (fullName || name || 'New Student').trim();

  const existingUser = User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const coursesArr = Array.isArray(courses) && courses.length > 0 ? courses : (Array.isArray(course) ? course : [course || 'sql']);
  
  // Normalize selected courses into platform keys ['sql', 'python']
  const normalizedEnrolled = [];
  coursesArr.forEach(c => {
    const lower = String(c).toLowerCase().trim();
    if (lower === 'sql' || lower.includes('sql')) {
      if (!normalizedEnrolled.includes('sql')) normalizedEnrolled.push('sql');
    }
    if (lower === 'python' || lower.includes('python')) {
      if (!normalizedEnrolled.includes('python')) normalizedEnrolled.push('python');
    }
  });
  const finalEnrolled = normalizedEnrolled.length > 0 ? normalizedEnrolled : ['sql'];

  const courseTitleMap = {
    'sql': 'SQL Bootcamp',
    'python': 'Python Fundamentals'
  };
  const primaryCourse = finalEnrolled.map(c => courseTitleMap[c] || c).join(', ');

  // Always assign 'student' role for public signup (admin role is restricted to DB seeding/admin assignment)
  const newUser = User.create({
    email,
    password,
    role: 'student',
    name: studentName,
  });

  const slugId = getSlugFromEmail(email);
  let existingStudent = Student.findByIdOrEmail(slugId) || Student.findByIdOrEmail(email);
  if (!existingStudent) {
    Student.create({
      id: slugId,
      name: studentName,
      fullName: studentName,
      email: email.toLowerCase().trim(),
      cohort: cohort || 'Cohort 14',
      course: primaryCourse,
      courses: coursesArr,
      totalStudyTimeHours: 0,
      todayStudyTime: 0,
      status: 'Active',
      streak: 0,
      streakDays: 0,
      solvedQuestions: [],
      completedQuestions: [],
      pythonCompleted: [],
      enrolledCourses: finalEnrolled,
      unlockedPlaygrounds: [],
      unlockedCourses: [],
      isPaid: false,
      isSqlPaid: false,
      isPythonPaid: false,
      labBreakdownHours: { sqlLab: 0, pythonSandbox: 0, pysparkLab: 0 },
      createdAt: new Date().toISOString()
    });
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: 'student' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({
    success: true,
    token,
    user: {
      id: slugId,
      email: newUser.email,
      role: 'student',
      name: studentName,
      fullName: studentName,
      cohort: cohort || 'Cohort 14',
      course: primaryCourse,
      solvedQuestions: [],
      pythonCompleted: [],
      enrolledCourses: finalEnrolled,
      isPaid: false,
      isSqlPaid: finalEnrolled.includes('sql'),
      isPythonPaid: finalEnrolled.includes('python'),
      createdAt: new Date().toISOString()
    },
  });
}

module.exports = { login, signup };
