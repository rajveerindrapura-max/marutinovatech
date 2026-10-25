const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('../config');

let Database = null;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // better-sqlite3 native addon not available (e.g. AWS Lambda / Vercel Serverless)
}

let db = null;

function createFallbackDb() {
  const studentsPath = path.join(__dirname, '..', '..', 'data', 'students.json');
  const coursesPath = path.join(__dirname, '..', '..', 'data', 'courses.json');

  let rawStudents = [];
  try {
    rawStudents = require('../../data/students.json');
  } catch (e) {
    try {
      if (fs.existsSync(studentsPath)) {
        rawStudents = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
      }
    } catch (e2) {}
  }

  let rawCourses = [];
  try {
    rawCourses = require('../../data/courses.json');
  } catch (e) {
    try {
      if (fs.existsSync(coursesPath)) {
        rawCourses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      }
    } catch (e2) {}
  }

  let students = rawStudents.map(s => ({
    id: s.id,
    name: s.name || s.fullName || s.id,
    email: s.email || '',
    cohort: s.cohort || 'Cohort 14',
    course: s.course || 'SQL Bootcamp',
    enrolled_date: s.enrolledDate || '2026-08-25',
    total_study_time_hours: s.totalStudyTimeHours || 0,
    today_study_time: s.todayStudyTime || 0,
    last_topic: s.lastTopic || 'Getting Started',
    last_topic_url: s.lastTopicUrl || 'index.html',
    status: s.status || 'Active',
    progress_percent: s.progressPercent || 0,
    streak_days: s.streakDays || s.streak || 0,
    completed_topics_count: s.completedTopicsCount || 0,
    total_topics_count: s.totalTopicsCount || 25,
    lab_breakdown_hours: JSON.stringify(s.labBreakdownHours || {}),
    topic_breakdown: JSON.stringify(s.topicBreakdown || []),
    completed_questions: JSON.stringify(s.completedQuestions || s.solvedQuestions || []),
    solved_questions: JSON.stringify(s.solvedQuestions || s.completedQuestions || []),
    python_completed: JSON.stringify(s.pythonCompleted || []),
    data_analyst_completed: JSON.stringify(s.dataAnalystCompleted || []),
    unlocked_playgrounds: JSON.stringify(s.unlockedPlaygrounds || ['sql']),
    unlocked_courses: JSON.stringify(s.unlockedCourses || ['sql']),
    enrolled_courses: JSON.stringify(s.enrolledCourses || ['sql']),
    activity_log: JSON.stringify(s.activityLog || []),
    is_paid: s.isPaid ? 1 : 0,
    is_sql_paid: s.isSqlPaid ? 1 : 0,
    is_python_paid: s.isPythonPaid ? 1 : 0,
    is_analytics_paid: s.isAnalyticsPaid ? 1 : 0,
    is_power_bi_paid: s.isPowerBIPaid ? 1 : 0,
    created_at: s.createdAt || new Date().toISOString()
  }));

  let courses = rawCourses.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    category: c.category || 'all',
    category_label: c.categoryLabel || '',
    level: c.level || 'Beginner',
    duration: c.duration || '',
    schedule: c.schedule || '',
    tags: JSON.stringify(c.tags || []),
    price: c.price || 0,
    price_label: c.priceLabel || '',
    status: c.status || 'available',
    action: c.action || 'Enroll',
    icon_name: c.iconName || ''
  }));

  const adminHash = bcrypt.hashSync(config.admin.password || 'admin123', 10);
  let users = [
    {
      id: 1,
      email: config.admin.email || 'admin@marutinova.com',
      password_hash: adminHash,
      role: 'admin',
      name: 'Admin'
    }
  ];

  return {
    pragma: () => {},
    exec: () => {},
    transaction: (fn) => (items) => items.forEach(fn),
    close: () => {},
    prepare: (sql) => {
      const s = sql.trim().replace(/\s+/g, ' ');

      if (/SELECT COUNT\(\*\)/i.test(s)) {
        if (/FROM students/i.test(s)) return { get: () => ({ count: students.length }) };
        if (/FROM courses/i.test(s)) return { get: () => ({ count: courses.length }) };
        if (/FROM users/i.test(s)) return { get: () => ({ count: users.length }) };
      }

      if (/FROM users/i.test(s)) {
        return {
          get: (email) => users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null,
          all: () => [...users]
        };
      }

      if (/INSERT INTO users/i.test(s)) {
        return {
          run: (email, hash, role, name) => {
            const newUser = { id: users.length + 1, email, password_hash: hash, role, name };
            users.push(newUser);
            return { changes: 1, lastInsertRowid: newUser.id };
          }
        };
      }

      if (/FROM courses/i.test(s)) {
        if (/WHERE id = \?/i.test(s)) {
          return {
            get: (id) => courses.find(c => String(c.id) === String(id)) || null
          };
        }
        if (/WHERE LOWER\(category\) = LOWER\(\?\)/i.test(s)) {
          return {
            all: (cat) => courses.filter(c => String(c.category).toLowerCase() === String(cat).toLowerCase())
          };
        }
        return {
          all: () => [...courses]
        };
      }

      if (/FROM students/i.test(s)) {
        if (/WHERE LOWER\(id\) = LOWER\(\?\) OR LOWER\(email\) = LOWER\(\?\)/i.test(s)) {
          return {
            get: (idOrEmail) => {
              const q = String(idOrEmail).toLowerCase().trim();
              return students.find(s => s.id.toLowerCase() === q || s.email.toLowerCase() === q) || null;
            }
          };
        }
        if (/WHERE id = \?/i.test(s)) {
          return {
            get: (id) => {
              const q = String(id).toLowerCase().trim();
              return students.find(s => s.id.toLowerCase() === q) || null;
            }
          };
        }
        return {
          all: () => [...students]
        };
      }

      if (/INSERT (OR IGNORE )?INTO students/i.test(s)) {
        return {
          run: (...args) => {
            const newStudent = { id: args[0], name: args[1], email: args[2] };
            const existing = students.find(x => x.id === newStudent.id);
            if (!existing) students.push(newStudent);
            return { changes: 1 };
          }
        };
      }

      if (/UPDATE students/i.test(s)) {
        return {
          run: (...args) => {
            const id = args[args.length - 1];
            const student = students.find(x => x.id === id);
            return { changes: student ? 1 : 0 };
          }
        };
      }

      return {
        get: () => null,
        all: () => [],
        run: () => ({ changes: 0 })
      };
    }
  };
}

function getDb() {
  if (db) return db;

  if (Database) {
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const targetPath = isServerless ? path.join('/tmp', 'marutinovatech.db') : config.db.path;
      const dbDir = path.dirname(targetPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      db = new Database(targetPath);
      try {
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        db.pragma('busy_timeout = 5000');
      } catch (e) {}
      return db;
    } catch (err) {
      console.warn('⚠️ SQLite initialization failed, falling back to in-memory store:', err.message);
    }
  }

  // Pure JavaScript fallback for serverless / Vercel
  db = createFallbackDb();
  return db;
}

function closeDb() {
  if (db) {
    try {
      db.close();
    } catch (e) {}
    db = null;
  }
}

module.exports = { getDb, closeDb };
