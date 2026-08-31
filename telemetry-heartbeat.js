/**
 * MarutiNovaTech Universal Student Telemetry & Heartbeat Transmitter
 * Runs across all student-facing pages (sql.html, python.html, dashboard.html, etc.)
 */
(function initGlobalStudentHeartbeat() {
  function getStudentUser() {
    try {
      var raw = localStorage.getItem("currentUser") ||
                sessionStorage.getItem("currentUser") ||
                localStorage.getItem("mnt_user") ||
                sessionStorage.getItem("mnt_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isExcludedUser(email, name) {
    var e = (email || '').toLowerCase().trim();
    var n = (name || '').toLowerCase().trim();
    return (
      e.includes('admin@marutinova.com') ||
      e.includes('vikramaditya.rao@marutinova.com') ||
      e.includes('auth_user_test') ||
      e.includes('unregistered') ||
      n.includes('vikramaditya rao')
    );
  }

  window.recordHeartbeat = function(courseOverride, actionOverride, questionOverride, statusOverride) {
    var user = getStudentUser();
    if (!user || !user.email) return;
    if (isExcludedUser(user.email, user.fullName || user.name)) return;

    var path = window.location.pathname.toLowerCase();
    var defaultCourse = 'SQL Bootcamp';
    var defaultAction = 'Solving SQL Questions';

    if (path.includes('python')) {
      defaultCourse = 'Python Fundamentals';
      defaultAction = 'Solving Python Challenges';
    } else if (path.includes('dashboard')) {
      defaultCourse = 'Student Dashboard';
      defaultAction = 'Viewing Dashboard';
    }

    var course = courseOverride || defaultCourse;
    var action = actionOverride || defaultAction;
    var question = questionOverride || '';
    if (!question) {
      if (course === 'SQL Bootcamp') {
        var qTitleEl = document.querySelector('.qb-title') || document.getElementById('qb-pv-title');
        question = qTitleEl ? qTitleEl.textContent.trim() : 'SQL Joins & CTEs';
      } else if (course === 'Python Fundamentals') {
        var activeChal = document.querySelector('.chal-title');
        question = activeChal ? activeChal.textContent.trim() : 'Python Practice';
      } else {
        question = 'Overview';
      }
    }

    var uName = (user.fullName || user.name || (user.firstName ? (user.firstName + " " + (user.lastName || "")).trim() : user.email.split("@")[0]) || "Student").trim();
    var avatar = user.avatar || uName.split(/\s+/).map(function(w){return w[0];}).join("").toUpperCase().substring(0, 2) || "ST";

    var payload = {
      email: user.email.toLowerCase().trim(),
      name: uName,
      avatar: avatar,
      course: course,
      action: action,
      currentQuestion: question,
      status: statusOverride || 'Solving Now',
      timestamp: new Date().toISOString()
    };

    try {
      fetch('/api/v1/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function(){});
    } catch (e) {}

    // Broadcast across tabs for real-time local sync
    try {
      var liveChannel = new BroadcastChannel('student_activity_channel');
      liveChannel.postMessage({
        type: 'STUDENT_HEARTBEAT',
        studentName: uName,
        email: user.email,
        course: course,
        currentQuestion: question,
        status: statusOverride || 'Solving Now',
        timestamp: payload.timestamp
      });
    } catch(e) {}
  };

  // Immediate ping on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.recordHeartbeat(); });
  } else {
    window.recordHeartbeat();
  }

  // Ping every 15 seconds
  setInterval(function() {
    window.recordHeartbeat();
  }, 15000);

  // Ping on user visibility restore / tab focus
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      window.recordHeartbeat();
    }
  });

  // Listen for platform reset
  try {
    var ch = new BroadcastChannel('student_activity_channel');
    ch.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'CLEAR_ALL_DATA') {
        try {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('mnt_user');
        } catch(err) {}
      }
    });
  } catch(e) {}
})();
