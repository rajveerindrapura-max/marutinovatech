/**
 * Seed script — imports legacy JSON data into SQLite on first run.
 * Idempotent (skips if tables already have data). Creates admin user with bcrypt hash.
 * 
 * ℹ️ NOTE: Re-seeding data requires deleting data/marutinovatech.db first!
 */

function seed() {
  const db = getDb();
  createTables();

  // Seed admin user
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(config.admin.email);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(config.admin.password, 10);
    db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(
      config.admin.email,
      hash,
      'admin',
      'Admin'
    );
    console.log(`✅ Admin user seeded: ${config.admin.email}`);
  }

  // Seed students from legacy JSON
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  if (studentCount === 0) {
    const studentsPath = path.join(__dirname, '..', '..', 'data', 'students.json');
    if (fs.existsSync(studentsPath)) {
      const students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO students 
        (id, name, email, cohort, course, enrolled_date, total_study_time_hours,
         today_study_time, last_topic, last_topic_url, status, progress_percent,
         streak_days, completed_topics_count, total_topics_count,
         lab_breakdown_hours, topic_breakdown, completed_questions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((students) => {
        for (const s of students) {
          insert.run(
            s.id,
            s.name,
            s.email,
            s.cohort || null,
            s.course || null,
            s.enrolledDate || s.enrolled_date || null,
            s.totalStudyTimeHours || s.total_study_time_hours || 0,
            s.todayStudyTime || s.today_study_time || 0,
            s.lastTopic || s.last_topic || null,
            s.lastTopicUrl || s.last_topic_url || null,
            s.status || 'Active',
            s.progressPercent || s.progress_percent || 0,
            s.streakDays || s.streak_days || 0,
            s.completedTopicsCount || s.completed_topics_count || 0,
            s.totalTopicsCount || s.total_topics_count || 25,
            JSON.stringify(s.labBreakdownHours || s.lab_breakdown_hours || {}),
            JSON.stringify(s.topicBreakdown || s.topic_breakdown || []),
            JSON.stringify(s.completedQuestions || s.completed_questions || [])
          );
        }
      });

      insertMany(students);
      console.log(`✅ Seeded ${students.length} students from students.json`);
    }
  }

  // Seed courses from legacy JSON
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  if (courseCount === 0) {
    const coursesPath = path.join(__dirname, '..', '..', 'data', 'courses.json');
    if (fs.existsSync(coursesPath)) {
      const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO courses 
        (id, title, description, category, category_label, level, duration,
         schedule, tags, price, price_label, status, action, icon_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((courses) => {
        for (const c of courses) {
          insert.run(
            String(c.id),
            c.title,
            c.description || null,
            c.category || null,
            c.categoryLabel || c.category_label || null,
            c.level || null,
            c.duration || null,
            c.schedule || null,
            JSON.stringify(c.tags || []),
            c.price || null,
            c.priceLabel || c.price_label || null,
            c.status || 'soon',
            c.action || null,
            c.iconName || c.icon_name || null
          );
        }
      });

      insertMany(courses);
      console.log(`✅ Seeded ${courses.length} courses from courses.json`);
    }
  }

  console.log('✅ Database seeding complete');
}

// Allow running directly: node src/db/seed.js
if (require.main === module) {
  seed();
  process.exit(0);
}

module.exports = { seed };
