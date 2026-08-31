const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
};

const ROUTE_ALIASES = {
  '/sql-lab': '/sql.html',
  '/sql': '/sql.html',
  '/playground': '/sql.html',
  '/dashboard': '/dashboard.html',
  '/python': '/python.html',
  '/python-lab': '/python.html',
};

const BASE_SEED_STUDENTS = [];

const studentsPath = path.join(ROOT_DIR, 'data', 'students.json');
let RUNTIME_STUDENTS = [];
const RUNTIME_TELEMETRY = {};
const RUNTIME_HEARTBEATS = new Map(); // email -> presence record

function upsertHeartbeat(record) {
  if (!record) return;
  const email = String(record.email || record.studentEmail || record.studentId || record.id || "").toLowerCase().trim();
  if (!email) return;

  const isExcluded = email.includes("admin@marutinova.com") ||
                     email.includes("vikramaditya.rao@marutinova.com") ||
                     email.includes("auth_user_test") ||
                     email.includes("unregistered");
  if (isExcluded) return;

  const now = Date.now();
  const name = String(record.name || record.studentName || (email.split("@")[0]) || "Student").trim();
  const avatar = record.avatar || name.split(/\s+/).map(w => w[0]).join("").toUpperCase().substring(0, 2) || "ST";
  const course = record.course || record.courseName || "SQL Bootcamp";
  const action = record.action || record.currentQuestion || record.questionTitle || "Solving Questions";
  const currentQuestion = record.currentQuestion || record.questionTitle || action || "SQL Practice";
  const status = record.status || "Solving Now";

  RUNTIME_HEARTBEATS.set(email, {
    email: email,
    name: name,
    avatar: avatar,
    course: course,
    action: action,
    currentQuestion: currentQuestion,
    status: status,
    lastActiveMs: now,
    timestamp: new Date(now).toISOString()
  });
}

function getActiveTelemetryResponse() {
  const now = Date.now();
  const THIRTY_MINUTES_MS = 30 * 60 * 1000;
  const THREE_MINUTES_MS = 3 * 60 * 1000;

  // Prune entries older than 30 minutes
  for (const [email, record] of RUNTIME_HEARTBEATS.entries()) {
    if (now - record.lastActiveMs > THIRTY_MINUTES_MS) {
      RUNTIME_HEARTBEATS.delete(email);
    }
  }

  const activeList = [];
  let onlineCount = 0;

  for (const record of RUNTIME_HEARTBEATS.values()) {
    const diffMs = now - record.lastActiveMs;
    const isOnline = diffMs <= THREE_MINUTES_MS;
    if (isOnline) onlineCount++;

    let relTime = "Just now";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 30) {
      relTime = "Just now";
    } else if (sec < 60) {
      relTime = sec + "s ago";
    } else {
      const min = Math.floor(sec / 60);
      if (min < 60) {
        relTime = min + "m ago";
      } else {
        const hr = Math.floor(min / 60);
        relTime = hr + "h ago";
      }
    }

    activeList.push({
      email: record.email,
      name: record.name,
      studentName: record.name,
      avatar: record.avatar,
      course: record.course,
      action: record.action,
      currentQuestion: record.currentQuestion,
      status: isOnline ? "Solving Now" : "Idle / Away",
      online: isOnline,
      lastActive: record.timestamp,
      timestamp: record.timestamp,
      relativeTime: relTime,
      lastActiveMs: record.lastActiveMs
    });
  }

  activeList.sort((a, b) => b.lastActiveMs - a.lastActiveMs);

  return {
    success: true,
    activeCount: onlineCount,
    totalRecent: activeList.length,
    students: activeList
  };
}

function findStudentByAnyIdentifier(students, idOrEmail) {
  if (!idOrEmail) return null;
  const target = String(idOrEmail).trim().toLowerCase();
  
  // 1. Exact match on ID
  let match = students.find(s => String(s.id || '').toLowerCase().trim() === target);
  if (match) return match;

  // 2. Exact match on Email
  match = students.find(s => s.email && s.email.toLowerCase().trim() === target);
  if (match) return match;

  // 3. Exact match on Name / FullName
  match = students.find(s => {
    const sName = String(s.name || s.fullName || '').toLowerCase().trim();
    return sName === target;
  });
  if (match) return match;

  // 4. Exact match on Email prefix
  match = students.find(s => s.email && s.email.split('@')[0].toLowerCase().trim() === target);
  if (match) return match;

  // 5. Normalized slug exact match
  const cleanTarget = target.replace(/^(user|student)-+/i, '').replace(/[^a-z0-9]/g, '');
  match = students.find(s => {
    const sId = String(s.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const sEmailPrefix = (s.email ? s.email.split('@')[0] : '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const sName = String(s.name || s.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return sId === cleanTarget || sEmailPrefix === cleanTarget || sName === cleanTarget;
  });
  if (match) return match;

  return null;
}

function loadStudentsDataset() {
  try {
    if (fs.existsSync(studentsPath)) {
      const fileData = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
      if (Array.isArray(fileData)) {
        RUNTIME_STUDENTS = fileData.filter(diskStudent => {
          const diskEmail = (diskStudent.email || '').trim().toLowerCase();
          const isTestAccount = diskEmail.includes('rajveersingh333307') || diskEmail.includes('auth_user_test') || diskEmail.includes('unregistered');
          return diskEmail && !isTestAccount;
        });
      } else {
        RUNTIME_STUDENTS = [];
      }
    } else {
      RUNTIME_STUDENTS = [];
    }
  } catch (e) {
    RUNTIME_STUDENTS = [];
  }
  return RUNTIME_STUDENTS;
}

// Initial load
loadStudentsDataset();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // API Routes
  if (urlPath.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    if (urlPath === '/api/v1/health' || urlPath === '/api/health') {
      res.writeHead(200);
      return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), server: 'MarutiNovaTech Zero-Dep Server' }));
    }

    // Presence Heartbeat
    if ((urlPath === '/api/v1/telemetry/heartbeat' || urlPath === '/api/telemetry/heartbeat') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const record = JSON.parse(body);
          upsertHeartbeat(record);
        } catch (e) {}
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
      });
      return;
    }

    // Purge / Clear all student data & active telemetry
    if (urlPath === '/api/v1/admin/clear-all-data' || urlPath === '/api/admin/clear-all-data' || ((urlPath === '/api/v1/students' || urlPath === '/api/students') && req.method === 'DELETE')) {
      RUNTIME_STUDENTS = [];
      RUNTIME_HEARTBEATS.clear();
      for (const k in RUNTIME_TELEMETRY) delete RUNTIME_TELEMETRY[k];
      try {
        fs.writeFileSync(studentsPath, '[]', 'utf8');
      } catch (e) {}
      res.writeHead(200);
      return res.end(JSON.stringify({ success: true, message: 'All student records and active telemetry sessions successfully purged.' }));
    }

    // Active Student Monitor Roster
    if (urlPath === '/api/v1/telemetry/active' || urlPath === '/api/telemetry/active') {
      res.writeHead(200);
      return res.end(JSON.stringify(getActiveTelemetryResponse()));
    }

    // General / legacy telemetry endpoint
    if (urlPath === '/api/v1/telemetry' || urlPath === '/api/telemetry') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const record = JSON.parse(body);
            upsertHeartbeat(record);
            const key = (record.studentEmail || record.email || record.studentId || record.id || 'anon').toLowerCase();
            RUNTIME_TELEMETRY[key] = {
              ...record,
              timestamp: new Date().toISOString()
            };
          } catch (e) {}
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        });
        return;
      } else {
        res.writeHead(200);
        return res.end(JSON.stringify(getActiveTelemetryResponse().students));
      }
    }

    if (urlPath === '/api/v1/courses' || urlPath === '/api/courses') {
      res.writeHead(200);
      return res.end(JSON.stringify({
        status: 'success',
        data: [
          { id: 'data-engineering', title: 'Data Engineering Track', level: 'Intermediate' },
          { id: 'data-analytics', title: 'Data Analytics Track', level: 'Beginner' }
        ]
      }));
    }

    if (urlPath === '/api/v1/questions' || urlPath === '/api/questions') {
      const qPath = path.join(ROOT_DIR, 'data', 'questions.json');
      if (fs.existsSync(qPath)) {
        res.writeHead(200);
        return res.end(fs.readFileSync(qPath, 'utf8'));
      } else {
        res.writeHead(200);
        return res.end(JSON.stringify([]));
      }
    }

    if (urlPath === '/api/v1/students' || urlPath === '/api/students') {
      try {
        const dataPath = path.join(ROOT_DIR, 'data', 'students.json');
        let students = [];
        if (fs.existsSync(dataPath)) {
          const rawData = fs.readFileSync(dataPath, 'utf8');
          students = JSON.parse(rawData || '[]');
        } else {
          students = loadStudentsDataset();
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.writeHead(200);
        return res.end(JSON.stringify(students));
      } catch (err) {
        console.error('API Error:', err);
        res.writeHead(500);
        return res.end(JSON.stringify({ error: 'Failed to read student data' }));
      }
    }

    if ((urlPath === '/api/v1/students/activity' || urlPath === '/api/v1/activity' || urlPath === '/api/activity') && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let studentEmail = '', activity = null, parsed = {};
        try {
          parsed = JSON.parse(body);
          studentEmail = (parsed.studentEmail || parsed.email || (parsed.user && parsed.user.email) || '').trim().toLowerCase();
          activity = parsed.activity || parsed;
          if (activity && !activity.itemId && parsed.itemId) activity = parsed;
        } catch (e) {}

        if (!studentEmail || !activity) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Missing studentEmail or activity data' }));
        }

        const students = loadStudentsDataset();
        let student = students.find(s => s.email && s.email.trim().toLowerCase() === studentEmail);
        if (!student) {
          student = findStudentByAnyIdentifier(students, studentEmail);
        }

        if (student) {
          upsertHeartbeat({
            email: studentEmail,
            name: student.name || student.fullName,
            course: activity.courseId === 'sql' ? 'SQL Bootcamp' : (activity.courseId === 'python' ? 'Python Fundamentals' : 'SQL Bootcamp'),
            action: 'Solved ' + (activity.itemTitle || activity.itemId),
            currentQuestion: activity.itemTitle || activity.itemId,
            status: 'Solving Now'
          });
          if (!student.activityLog) student.activityLog = [];

          // Add or update entry
          const existingIndex = student.activityLog.findIndex(a => a.itemId === activity.itemId);
          if (existingIndex > -1) {
            student.activityLog[existingIndex].solvedAt = activity.solvedAt;
            student.activityLog[existingIndex].itemTitle = activity.itemTitle || student.activityLog[existingIndex].itemTitle;
            student.activityLog[existingIndex].status = activity.status || student.activityLog[existingIndex].status || 'PASSED';
          } else {
            student.activityLog.unshift(activity);
          }

          // Sync course-specific lists
          if (activity.courseId === 'sql') {
            if (!student.solvedQuestions) student.solvedQuestions = [];
            if (!student.solvedQuestions.includes(activity.itemId)) student.solvedQuestions.push(activity.itemId);
            if (!student.completedQuestions) student.completedQuestions = [];
            if (!student.completedQuestions.includes(activity.itemId)) student.completedQuestions.push(activity.itemId);
            const sqlList = Array.isArray(parsed.solvedQuestions) ? parsed.solvedQuestions : (Array.isArray(parsed.solvedList) ? parsed.solvedList : []);
            sqlList.forEach(id => {
              if (!student.solvedQuestions.includes(id)) student.solvedQuestions.push(id);
              if (!student.completedQuestions.includes(id)) student.completedQuestions.push(id);
            });
          } else if (activity.courseId === 'python') {
            if (!student.pythonCompleted) student.pythonCompleted = [];
            if (activity.itemId && !student.pythonCompleted.includes(activity.itemId)) {
              student.pythonCompleted.push(activity.itemId);
            }
            const pyList = Array.isArray(parsed.pythonCompleted) ? parsed.pythonCompleted : (Array.isArray(parsed.solvedList) ? parsed.solvedList : []);
            pyList.forEach(id => {
              if (!student.pythonCompleted.includes(id)) student.pythonCompleted.push(id);
            });
          }

          try {
            fs.writeFileSync(studentsPath, JSON.stringify(RUNTIME_STUDENTS, null, 2), 'utf8');
          } catch (e) {}

          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, count: student.activityLog.length, activityLog: student.activityLog }));
        }

        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Student not found' }));
      });
      return;
    }

    if (urlPath.startsWith('/api/v1/students/')) {
      const parts = urlPath.replace('/api/v1/students/', '').split('/');
      const studentId = decodeURIComponent(parts[0]).trim().toLowerCase();
      const routeAction = parts[1];
      const isProgressOrUnlockRoute = routeAction === 'progress' || routeAction === 'unlock' || studentId === 'progress' || studentId === 'unlock';

      if (isProgressOrUnlockRoute && (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          let completedQuestions = null;
          let solvedQuestions = null;
          let pythonCompleted = null;
          let unlockedPlaygrounds = null;
          let unlockedCourses = null;
          let enrolledCourses = null;
          let activityLog = null;
          let topicBreakdown = null;
          let lastTopic = null;
          let isPaid = null;
          let isSqlPaid = null;
          let isAnalyticsPaid = null;
          let isPowerBIPaid = null;
          let isPythonPaid = null;
          let email = null;

          try {
            const parsed = JSON.parse(body);
            if (Array.isArray(parsed.completedQuestions)) completedQuestions = parsed.completedQuestions;
            if (Array.isArray(parsed.solvedQuestions)) solvedQuestions = parsed.solvedQuestions;
            if (Array.isArray(parsed.pythonCompleted)) pythonCompleted = parsed.pythonCompleted;
            if (Array.isArray(parsed.unlockedPlaygrounds)) unlockedPlaygrounds = parsed.unlockedPlaygrounds;
            if (Array.isArray(parsed.unlockedCourses)) unlockedCourses = parsed.unlockedCourses;
            if (Array.isArray(parsed.enrolledCourses)) enrolledCourses = parsed.enrolledCourses;
            if (Array.isArray(parsed.activityLog)) activityLog = parsed.activityLog;
            if (typeof parsed.isPaid === 'boolean') isPaid = parsed.isPaid;
            if (typeof parsed.isSqlPaid === 'boolean') isSqlPaid = parsed.isSqlPaid;
            if (typeof parsed.isAnalyticsPaid === 'boolean') isAnalyticsPaid = parsed.isAnalyticsPaid;
            if (typeof parsed.isPowerBIPaid === 'boolean') isPowerBIPaid = parsed.isPowerBIPaid;
            if (typeof parsed.isPythonPaid === 'boolean') isPythonPaid = parsed.isPythonPaid;
            if (parsed.topicBreakdown) topicBreakdown = parsed.topicBreakdown;
            if (parsed.lastTopic) lastTopic = parsed.lastTopic;
            if (parsed.email || parsed.studentEmail) email = (parsed.email || parsed.studentEmail).toLowerCase().trim();
          } catch (e) {}

          const students = loadStudentsDataset();
          let found = null;
          if (email) {
            found = students.find(s => s.email && s.email.toLowerCase().trim() === email);
          }
          if (!found) {
            found = findStudentByAnyIdentifier(students, studentId);
          }

          if (!found && email) {
            found = {
              id: (studentId && studentId !== 'progress' && studentId !== 'unlock') ? studentId : (email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')),
              name: email.split('@')[0],
              email: email,
              cohort: "Cohort 14",
              course: "Data & Cloud Engineering",
              enrolledDate: new Date().toISOString().split('T')[0],
              status: "Active",
              progressPercent: 0,
              streakDays: 1,
              completedQuestions: [],
              solvedQuestions: [],
              pythonCompleted: [],
              enrolledCourses: ["sql"],
              unlockedPlaygrounds: [],
              unlockedCourses: []
            };
            RUNTIME_STUDENTS.push(found);
          }

          if (found) {
            if (unlockedPlaygrounds !== null) {
              found.unlockedPlaygrounds = unlockedPlaygrounds;
            }
            if (unlockedCourses !== null) {
              found.unlockedCourses = unlockedCourses;
            }
            if (enrolledCourses !== null) {
              found.enrolledCourses = enrolledCourses;
            }
            if (solvedQuestions !== null) {
              found.solvedQuestions = solvedQuestions;
              if (completedQuestions === null) completedQuestions = solvedQuestions;
            }
            if (pythonCompleted !== null) {
              found.pythonCompleted = pythonCompleted;
            }
            if (completedQuestions !== null) {
              found.completedQuestions = completedQuestions;
              found.completedTopicsCount = completedQuestions.length;
              found.progressPercent = Math.min(100, Math.round((completedQuestions.length / (found.totalTopicsCount || 25)) * 100));
            }
            if (activityLog !== null) found.activityLog = activityLog;
            if (isSqlPaid !== null) found.isSqlPaid = isSqlPaid;
            if (isAnalyticsPaid !== null) found.isAnalyticsPaid = isAnalyticsPaid;
            if (isPowerBIPaid !== null) found.isPowerBIPaid = isPowerBIPaid;
            if (isPythonPaid !== null) found.isPythonPaid = isPythonPaid;
            if (isPaid !== null) found.isPaid = isPaid;
            if (found.isSqlPaid || found.isPythonPaid) found.isPaid = true;
            if (topicBreakdown !== null) found.topicBreakdown = topicBreakdown;
            if (lastTopic !== null) found.lastTopic = lastTopic;

            try {
              fs.writeFileSync(studentsPath, JSON.stringify(RUNTIME_STUDENTS, null, 2), 'utf8');
            } catch (e) {}

            res.writeHead(200);
            return res.end(JSON.stringify({ success: true, student: found }));
          } else {
            res.writeHead(404);
            return res.end(JSON.stringify({ error: 'Student not found' }));
          }
        });
        return;
      }

      const students = loadStudentsDataset();
      const found = students.find(s =>
        String(s.id).toLowerCase() === studentId ||
        String(s.email).toLowerCase() === studentId
      );

      if (found) {
        res.writeHead(200);
        return res.end(JSON.stringify(found));
      } else {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Student not found' }));
      }
    }

    if (urlPath === '/api/v1/auth/signup' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let email = '', password = '', fullName = '', name = '', course = '', courses = [], cohort = '';
        try {
          const parsed = JSON.parse(body);
          email = (parsed.email || '').trim().toLowerCase();
          password = parsed.password || '';
          fullName = parsed.fullName || parsed.name || '';
          course = parsed.course || '';
          courses = parsed.courses || [];
          cohort = parsed.cohort || 'Cohort 14';
        } catch (e) {}

        if (!email) {
          res.writeHead(400);
          return res.end(JSON.stringify({ success: false, error: 'Email address is required.' }));
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const students = loadStudentsDataset();

        // Check for duplicate account
        const existing = students.find(s => s.email && s.email.trim().toLowerCase() === sanitizedEmail);
        if (existing) {
          res.writeHead(400);
          return res.end(JSON.stringify({ success: false, error: 'An account with this email address already exists.' }));
        }

        const nameStr = (fullName || name || sanitizedEmail.split('@')[0] || 'Student').trim();
        const slugId = sanitizedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
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

        const newStudent = {
          id: slugId,
          name: nameStr,
          fullName: nameStr,
          email: sanitizedEmail,
          password: password,
          cohort: cohort || 'Cohort 14',
          course: primaryCourse,
          enrolledDate: new Date().toISOString().split('T')[0],
          totalStudyTimeHours: 0,
          todayStudyTime: 0,
          lastTopic: 'Getting Started',
          lastTopicUrl: 'index.html',
          status: 'Active',
          progressPercent: 0,
          streak: 0,
          streakDays: 0,
          completedTopicsCount: 0,
          totalTopicsCount: 25,
          avatar: nameStr.split(/\s+/).map(w=>w[0]).join('').toUpperCase().substring(0, 2) || 'ST',
          labBreakdownHours: { sqlLab: 0, pythonSandbox: 0, pysparkLab: 0 },
          topicBreakdown: [],
          completedQuestions: [],
          solvedQuestions: [],
          pythonCompleted: [],
          dataAnalystCompleted: [],
          enrolledCourses: finalEnrolled,
          unlockedPlaygrounds: [],
          unlockedCourses: [],
          isPaid: false,
          isSqlPaid: false,
          isPythonPaid: false,
          isAnalyticsPaid: false,
          createdAt: new Date().toISOString()
        };

        // Append non-destructively to runtime array
        RUNTIME_STUDENTS.push(newStudent);

        try {
          fs.writeFileSync(studentsPath, JSON.stringify(RUNTIME_STUDENTS, null, 2), 'utf8');
        } catch (e) {
          console.warn('Note: File write skipped or failed, account active in runtime state:', e.message);
        }

        const userResponse = {
          id: newStudent.id,
          email: newStudent.email,
          name: newStudent.name,
          fullName: newStudent.name,
          role: 'student',
          avatar: newStudent.avatar,
          cohort: newStudent.cohort,
          course: newStudent.course,
          solvedQuestions: newStudent.solvedQuestions,
          pythonCompleted: newStudent.pythonCompleted,
          dataAnalystCompleted: newStudent.dataAnalystCompleted,
          enrolledCourses: newStudent.enrolledCourses,
          unlockedPlaygrounds: [],
          unlockedCourses: [],
          isPaid: false,
          isSqlPaid: false,
          isPythonPaid: false,
          isAnalyticsPaid: false,
          createdAt: newStudent.createdAt
        };

        res.writeHead(201);
        return res.end(JSON.stringify({
          success: true,
          message: 'Account created successfully',
          token: 'jwt-token-' + Date.now(),
          user: userResponse
        }));
      });
      return;
    }

    if (urlPath === '/api/v1/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let email = '', password = '';
        try {
          const parsed = JSON.parse(body);
          email = (parsed.email || '').trim().toLowerCase();
          password = parsed.password || '';
        } catch (e) {}

        const sanitizedEmail = email.trim().toLowerCase();

        if (!sanitizedEmail || !password) {
          res.writeHead(401);
          return res.end(JSON.stringify({
            success: false,
            error: 'Invalid email or password. Please check your credentials and try again.'
          }));
        }

        // Platform Admin Credentials
        if (sanitizedEmail === 'admin@marutinova.com') {
          if (password === 'admin123' || password === 'Pass12345!') {
            res.writeHead(200);
            return res.end(JSON.stringify({
              success: true,
              message: 'Authentication successful',
              token: 'jwt-admin-token-' + Date.now(),
              user: {
                id: 'admin-user',
                email: 'admin@marutinova.com',
                name: 'Vikramaditya Rao',
                role: 'admin',
                avatar: '👑'
              }
            }));
          } else {
            res.writeHead(401);
            return res.end(JSON.stringify({
              success: false,
              error: 'Invalid email or password. Please check your credentials and try again.'
            }));
          }
        }

        const students = loadStudentsDataset();
        const matchedStudent = students.find(s => s.email && s.email.trim().toLowerCase() === sanitizedEmail);

        if (!matchedStudent) {
          res.writeHead(401);
          return res.end(JSON.stringify({
            success: false,
            error: 'Account not found. Please create an account first.'
          }));
        }

        // Strict password check if password recorded on account
        if (matchedStudent.password && matchedStudent.password !== password) {
          res.writeHead(401);
          return res.end(JSON.stringify({
            success: false,
            error: 'Invalid email or password. Please check your credentials and try again.'
          }));
        }

        const userResponse = {
          id: matchedStudent.id,
          email: matchedStudent.email,
          name: matchedStudent.name,
          fullName: matchedStudent.name,
          role: 'student',
          avatar: matchedStudent.avatar || 'ST',
          cohort: matchedStudent.cohort || 'Cohort 14',
          course: matchedStudent.course || 'Data Analytics'
        };

        res.writeHead(200);
        return res.end(JSON.stringify({
          success: true,
          message: 'Authentication successful',
          token: 'jwt-token-' + Date.now(),
          user: userResponse
        }));
      });
      return;
    }

    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }

  // Handle Route Aliases
  let targetPath = ROUTE_ALIASES[urlPath] || urlPath;
  if (targetPath === '/') targetPath = '/index.html';

  let filePath = path.join(ROOT_DIR, targetPath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback to index.html for unknown routes
      filePath = path.join(ROOT_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 MarutiNovaTech backend running on http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 Web App: http://localhost:${PORT}`);
});
