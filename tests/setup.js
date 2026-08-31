// Set test environment variables before any modules load
process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test.db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_EMAIL = 'admin@marutinova.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.CORS_ORIGIN = 'http://localhost:3000';

const fs = require('fs');
const path = require('path');

// Clean up test database before each test run
const testDbPath = path.join(__dirname, '..', 'data', 'test.db');

afterAll(() => {
  // Close DB connection
  try {
    const { closeDb } = require('../src/db/connection');
    closeDb();
  } catch (e) {}

  // Remove test database
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  } catch (e) {}
});
