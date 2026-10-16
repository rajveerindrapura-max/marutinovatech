const config = require('./config');
const app = require('./app');
const { createTables } = require('./db/schema');
const { seed } = require('./db/seed');
const { closeDb } = require('./db/connection');

// ── Initialize Database ────────────────────────────────────────
try {
  createTables();
  seed();
  console.log('✅ Database initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err.message);
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    process.exit(1);
  }
}

// ── Start Server (Only when not in a Serverless environment like Vercel) ──
let server = null;
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  server = app.listen(config.port, () => {
    console.log(`🚀 MarutiNovaTech server running on http://localhost:${config.port}`);
    console.log(`📚 API v1 available at http://localhost:${config.port}/api/v1`);
    console.log(`💚 Health check: http://localhost:${config.port}/api/v1/health`);
    console.log(`🔐 Login: POST http://localhost:${config.port}/api/v1/auth/login`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
  });

  // ── Graceful Shutdown ──────────────────────────────────────────
  function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        closeDb();
        console.log('✅ Server closed');
        process.exit(0);
      });
    }

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Safety nets for uncaught errors ────────────────────────────
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    shutdown('unhandledRejection');
  });
}

module.exports = app;
