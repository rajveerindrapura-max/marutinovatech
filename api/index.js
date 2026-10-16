const app = require('../src/app');
const { createTables } = require('../src/db/schema');
const { seed } = require('../src/db/seed');

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  try {
    createTables();
    seed();
    initialized = true;
  } catch (err) {
    console.warn('⚠️ Serverless DB initialization warning:', err.message);
  }
}

module.exports = (req, res) => {
  ensureInitialized();
  return app(req, res);
};
