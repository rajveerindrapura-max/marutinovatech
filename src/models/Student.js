const { getDb } = require('../db/connection');

class Student {
  /**
   * Get all students.
   * @returns {Array} Array of student objects with parsed JSON fields
   */
  static findAll() {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    return rows.map(Student._deserialize);
  }

  /**
   * Find a student by ID or email (case-insensitive).
   * @param {string} identifier - Student ID or email
   * @returns {Object|null}
   */
  static findByIdOrEmail(identifier) {
    const db = getDb();
    const row = db.prepare(
      'SELECT * FROM students WHERE LOWER(id) = LOWER(?) OR LOWER(email) = LOWER(?)'
    ).get(identifier, identifier);
    return row ? Student._deserialize(row) : null;
  }

  /**
   * Find a student by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  static findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    return row ? Student._deserialize(row) : null;
  }

  /**
   * Create a new student.
   * @param {Object} data
   * @returns {Object} Created student
   */
  /**
   * Create a new student.
   * @param {Object} data
   * @returns {Object} Created student
   */
  static create(data) {
    const db = getDb();
    const isSql = data.isSqlPaid || (Array.isArray(data.unlockedCourses) && data.unlockedCourses.includes('sql')) || (Array.isArray(data.enrolledCourses) && data.enrolledCourses.includes('sql'));
    const isPython = data.isPythonPaid || (Array.isArray(data.unlockedCourses) && data.unlockedCourses.includes('python')) || (Array.isArray(data.enrolledCourses) && data.enrolledCourses.includes('python'));
    const isPaid = data.isPaid || isSql || isPython ? 1 : 0;

    db.prepare(`
      INSERT INTO students 
      (id, name, email, cohort, course, enrolled_date, total_study_time_hours,
       today_study_time, last_topic, last_topic_url, status, progress_percent,
       streak_days, completed_topics_count, total_topics_count,
       lab_breakdown_hours, topic_breakdown, completed_questions,
       solved_questions, python_completed, unlocked_courses, unlocked_playgrounds,
       enrolled_courses, activity_log, is_paid, is_sql_paid, is_python_paid,
       is_analytics_paid, is_powerbi_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.name || data.fullName,
      data.email,
      data.cohort || null,
      data.course || null,
      data.enrolledDate || new Date().toISOString().split('T')[0],
      data.totalStudyTimeHours || 0,
      data.todayStudyTime || 0,
      data.lastTopic || null,
      data.lastTopicUrl || null,
      data.status || 'Active',
      data.progressPercent || 0,
      data.streakDays || data.streak || 0,
      data.completedTopicsCount || (Array.isArray(data.completedQuestions) ? data.completedQuestions.length : 0),
      data.totalTopicsCount || 25,
      JSON.stringify(data.labBreakdownHours || {}),
      JSON.stringify(data.topicBreakdown || []),
      JSON.stringify(data.completedQuestions || []),
      JSON.stringify(data.solvedQuestions || data.completedQuestions || []),
      JSON.stringify(data.pythonCompleted || []),
      JSON.stringify(data.unlockedCourses || []),
      JSON.stringify(data.unlockedPlaygrounds || []),
      JSON.stringify(data.enrolledCourses || ['sql']),
      JSON.stringify(data.activityLog || []),
      isPaid,
      isSql ? 1 : 0,
      isPython ? 1 : 0,
      data.isAnalyticsPaid ? 1 : 0,
      data.isPowerBIPaid ? 1 : 0
    );
    return Student.findById(data.id);
  }

  /**
   * Update study time and activity info for a student.
   * @param {string} id - Student ID
   * @param {Object} updates
   */
  static updateActivity(id, updates) {
    const db = getDb();
    const student = Student.findById(id);
    if (!student) return null;

    const setClauses = [];
    const params = [];

    if (updates.addedHours !== undefined) {
      const newTotal = Math.round((student.totalStudyTimeHours + updates.addedHours) * 10) / 10;
      setClauses.push('total_study_time_hours = ?');
      params.push(newTotal);

      // Compare last activity date vs today for today_study_time daily reset
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDate = student.lastActivityDate;
      let newToday;
      if (!lastDate || lastDate !== todayStr) {
        newToday = Math.round(updates.addedHours * 10) / 10;
      } else {
        newToday = Math.round(((student.todayStudyTime || 0) + updates.addedHours) * 10) / 10;
      }
      setClauses.push('today_study_time = ?', 'last_activity_date = ?');
      params.push(newToday, todayStr);

      // Update lab breakdown if applicable
      if (updates.labType && student.labBreakdownHours && student.labBreakdownHours[updates.labType] !== undefined) {
        const labHours = { ...student.labBreakdownHours };
        labHours[updates.labType] = Math.round((labHours[updates.labType] + updates.addedHours) * 10) / 10;
        setClauses.push('lab_breakdown_hours = ?');
        params.push(JSON.stringify(labHours));
      }
    }

    if (updates.lastTopic) {
      setClauses.push('last_topic = ?');
      params.push(updates.lastTopic);
    }

    if (updates.lastTopicUrl) {
      setClauses.push('last_topic_url = ?');
      params.push(updates.lastTopicUrl);
    }

    setClauses.push('updated_at = datetime(\'now\')');

    if (setClauses.length > 0) {
      params.push(id);
      db.prepare(`UPDATE students SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
    }

    return Student.findById(id);
  }

  /**
   * Update progress, unlocks, and activity for a student.
   * @param {string} id - Student ID
   * @param {Object} updates
   * @returns {Object|null} Updated student
   */
  static updateProgress(id, updates) {
    const db = getDb();
    const student = Student.findById(id);
    if (!student) return null;

    const setClauses = [];
    const params = [];

    if (updates.completedQuestions && Array.isArray(updates.completedQuestions)) {
      setClauses.push('completed_questions = ?');
      params.push(JSON.stringify(updates.completedQuestions));
      setClauses.push('completed_topics_count = ?');
      params.push(updates.completedQuestions.length);
    }

    if (updates.solvedQuestions && Array.isArray(updates.solvedQuestions)) {
      setClauses.push('solved_questions = ?');
      params.push(JSON.stringify(updates.solvedQuestions));
    }

    if (updates.pythonCompleted && Array.isArray(updates.pythonCompleted)) {
      setClauses.push('python_completed = ?');
      params.push(JSON.stringify(updates.pythonCompleted));
    }

    if (updates.unlockedCourses && Array.isArray(updates.unlockedCourses)) {
      setClauses.push('unlocked_courses = ?');
      params.push(JSON.stringify(updates.unlockedCourses));
    }

    if (updates.unlockedPlaygrounds && Array.isArray(updates.unlockedPlaygrounds)) {
      setClauses.push('unlocked_playgrounds = ?');
      params.push(JSON.stringify(updates.unlockedPlaygrounds));
    }

    if (updates.enrolledCourses && Array.isArray(updates.enrolledCourses)) {
      setClauses.push('enrolled_courses = ?');
      params.push(JSON.stringify(updates.enrolledCourses));
    }

    if (updates.activityLog && Array.isArray(updates.activityLog)) {
      setClauses.push('activity_log = ?');
      params.push(JSON.stringify(updates.activityLog));
    }

    if (typeof updates.isPaid === 'boolean') {
      setClauses.push('is_paid = ?');
      params.push(updates.isPaid ? 1 : 0);
    }

    if (typeof updates.isSqlPaid === 'boolean') {
      setClauses.push('is_sql_paid = ?');
      params.push(updates.isSqlPaid ? 1 : 0);
    }

    if (typeof updates.isPythonPaid === 'boolean') {
      setClauses.push('is_python_paid = ?');
      params.push(updates.isPythonPaid ? 1 : 0);
    }

    if (typeof updates.isAnalyticsPaid === 'boolean') {
      setClauses.push('is_analytics_paid = ?');
      params.push(updates.isAnalyticsPaid ? 1 : 0);
    }

    if (typeof updates.isPowerBIPaid === 'boolean') {
      setClauses.push('is_powerbi_paid = ?');
      params.push(updates.isPowerBIPaid ? 1 : 0);
    }

    if (updates.streakDays !== undefined || updates.streak !== undefined) {
      setClauses.push('streak_days = ?');
      params.push(updates.streakDays !== undefined ? updates.streakDays : updates.streak);
    }

    if (updates.progressPercent !== undefined) {
      setClauses.push('progress_percent = ?');
      params.push(updates.progressPercent);
    }

    if (updates.lastTopic) {
      setClauses.push('last_topic = ?');
      params.push(updates.lastTopic);
    }

    if (updates.lastTopicUrl) {
      setClauses.push('last_topic_url = ?');
      params.push(updates.lastTopicUrl);
    }

    if (updates.topicBreakdown && Array.isArray(updates.topicBreakdown)) {
      setClauses.push('topic_breakdown = ?');
      params.push(JSON.stringify(updates.topicBreakdown));
    }

    setClauses.push('updated_at = datetime(\'now\')');

    if (setClauses.length > 0) {
      params.push(id);
      db.prepare(`UPDATE students SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
    }

    return Student.findById(id);
  }

  /**
   * Enrich a student object with computed question metrics.
   * If completedQuestions is present and non-empty, recomputes from that array.
   * Otherwise preserves DB fields (progress_percent, completed_topics_count).
   */
  static enrichMetrics(student) {
    if (!student) return student;

    const totalQuestions = student.totalTopicsCount || 145;
    let rawDone = [];
    if (student.completedQuestions && Array.isArray(student.completedQuestions)) {
      rawDone = student.completedQuestions;
    } else if (student.solvedQuestions && Array.isArray(student.solvedQuestions)) {
      rawDone = student.solvedQuestions;
    }

    const set = new Set();
    rawDone.forEach(item => {
      const norm = Student._normalizeQuestionId(item);
      if (norm) set.add(norm);
    });

    const solvedCount = set.size > 0 ? set.size : (student.completedTopicsCount || 0);
    const pythonSolved = Array.isArray(student.pythonCompleted) ? student.pythonCompleted.length : 0;
    const remainingQuestions = Math.max(0, totalQuestions - solvedCount);
    const progressPercent = student.progressPercent !== undefined && student.progressPercent !== null && student.progressPercent > 0
      ? student.progressPercent
      : (totalQuestions > 0 ? Math.min(100, Math.round(((solvedCount + pythonSolved) / (145 + 10)) * 100)) : 0);

    return {
      ...student,
      totalQuestions,
      solvedQuestions: solvedCount,
      solvedList: Array.from(set),
      completedQuestions: rawDone,
      pythonCompleted: Array.isArray(student.pythonCompleted) ? student.pythonCompleted : [],
      pythonSolved,
      remainingQuestions,
      completedTopicsCount: solvedCount,
      totalTopicsCount: totalQuestions,
      progressPercent,
    };
  }

  /**
   * Safe JSON parse helper to prevent DB corruption from crashing the API.
   * @private
   */
  static _safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Normalize a question ID to canonical form (e.g. 'q01', 'q14').
   * @private
   */
  static _normalizeQuestionId(item) {
    if (item === null || item === undefined) return '';
    const str = String(item).trim();
    if (!str) return '';
    const m = str.match(/\d+/);
    if (m) {
      const num = parseInt(m[0], 10);
      if (!isNaN(num) && num >= 1 && num <= 145) {
        return 'q' + (num < 10 ? '0' : '') + num;
      }
    }
    return str.toLowerCase();
  }

  /**
   * Deserialize a SQLite row to a student object with parsed JSON fields.
   * Also maps snake_case DB columns back to camelCase for API compatibility.
   * @private
   */
  static _deserialize(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      fullName: row.name,
      email: row.email,
      cohort: row.cohort,
      course: row.course,
      enrolledDate: row.enrolled_date,
      totalStudyTimeHours: row.total_study_time_hours || 0,
      todayStudyTime: row.today_study_time || 0,
      lastTopic: row.last_topic,
      lastTopicUrl: row.last_topic_url,
      status: row.status || 'Active',
      progressPercent: row.progress_percent || 0,
      streakDays: row.streak_days || 0,
      streak: row.streak_days || 0,
      completedTopicsCount: row.completed_topics_count || 0,
      totalTopicsCount: row.total_topics_count || 25,
      labBreakdownHours: Student._safeJsonParse(row.lab_breakdown_hours, {}),
      topicBreakdown: Student._safeJsonParse(row.topic_breakdown, []),
      completedQuestions: Student._safeJsonParse(row.completed_questions, []),
      solvedQuestions: Student._safeJsonParse(row.solved_questions, []),
      pythonCompleted: Student._safeJsonParse(row.python_completed, []),
      unlockedCourses: Student._safeJsonParse(row.unlocked_courses, []),
      unlockedPlaygrounds: Student._safeJsonParse(row.unlocked_playgrounds, []),
      enrolledCourses: Student._safeJsonParse(row.enrolled_courses, ['sql']),
      activityLog: Student._safeJsonParse(row.activity_log, []),
      isPaid: Boolean(row.is_paid),
      isSqlPaid: Boolean(row.is_sql_paid),
      isPythonPaid: Boolean(row.is_python_paid),
      isAnalyticsPaid: Boolean(row.is_analytics_paid),
      isPowerBIPaid: Boolean(row.is_powerbi_paid),
      lastActivityDate: row.last_activity_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = Student;
