const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;

function getDb() {
  if (db) return db;

  // On Vercel / Serverless, the root directory is read-only; use /tmp which is writable
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const targetPath = isServerless ? path.join('/tmp', 'marutinovatech.db') : config.db.path;

  // Ensure the database directory exists
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(targetPath);

  // Enable WAL mode for better concurrent read performance
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
  } catch (e) {
    // Suppress pragma errors in constrained serverless environments
  }

  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
