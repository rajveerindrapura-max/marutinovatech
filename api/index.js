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
  try {
    ensureInitialized();
    return app(req, res);
  } catch (err) {
    console.error('Unhandled serverless API error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  }
};
