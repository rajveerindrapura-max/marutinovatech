const { getDb } = require('./connection');

function createTables() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'student')),
      name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      cohort TEXT,
      course TEXT,
      enrolled_date TEXT,
      total_study_time_hours REAL DEFAULT 0,
      today_study_time REAL DEFAULT 0,
      last_topic TEXT,
      last_topic_url TEXT,
      status TEXT DEFAULT 'Active',
      progress_percent INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      completed_topics_count INTEGER DEFAULT 0,
      total_topics_count INTEGER DEFAULT 25,
      lab_breakdown_hours TEXT DEFAULT '{}',
      topic_breakdown TEXT DEFAULT '[]',
      completed_questions TEXT DEFAULT '[]',
      solved_questions TEXT DEFAULT '[]',
      python_completed TEXT DEFAULT '[]',
      unlocked_courses TEXT DEFAULT '[]',
      unlocked_playgrounds TEXT DEFAULT '[]',
      enrolled_courses TEXT DEFAULT '[]',
      activity_log TEXT DEFAULT '[]',
      is_paid INTEGER DEFAULT 0,
      is_sql_paid INTEGER DEFAULT 0,
      is_python_paid INTEGER DEFAULT 0,
      is_analytics_paid INTEGER DEFAULT 0,
      is_powerbi_paid INTEGER DEFAULT 0,
      last_activity_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      category_label TEXT,
      level TEXT,
      duration TEXT,
      schedule TEXT,
      tags TEXT DEFAULT '[]',
      price TEXT,
      price_label TEXT,
      status TEXT DEFAULT 'soon',
      action TEXT,
      icon_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      seconds INTEGER NOT NULL,
      lab_type TEXT,
      topic TEXT,
      topic_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_activity_log_student ON activity_log(student_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
  `);

  const extraCols = [
    'last_activity_date TEXT',
    'solved_questions TEXT DEFAULT \'[]\'',
    'python_completed TEXT DEFAULT \'[]\'',
    'unlocked_courses TEXT DEFAULT \'[]\'',
    'unlocked_playgrounds TEXT DEFAULT \'[]\'',
    'enrolled_courses TEXT DEFAULT \'[]\'',
    'activity_log TEXT DEFAULT \'[]\'',
    'is_paid INTEGER DEFAULT 0',
    'is_sql_paid INTEGER DEFAULT 0',
    'is_python_paid INTEGER DEFAULT 0',
    'is_analytics_paid INTEGER DEFAULT 0',
    'is_powerbi_paid INTEGER DEFAULT 0'
  ];
  extraCols.forEach(colDef => {
    try {
      db.exec(`ALTER TABLE students ADD COLUMN ${colDef};`);
    } catch(e) {}
  });
}

module.exports = { createTables };
