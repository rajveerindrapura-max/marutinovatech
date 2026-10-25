const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@marutinova.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },

  db: {
    path: process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.join(__dirname, '..', '..', 'data', 'marutinovatech.db'),
  },
};

// Validate critical config in production — warn rather than crash serverless functions
if (config.isProd) {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin123') {
    missing.push('ADMIN_PASSWORD (set custom password in production)');
  }
  if (missing.length > 0) {
    console.warn(`⚠️ Notice: Production environment recommendation: ${missing.join(', ')}`);
  }
}

module.exports = Object.freeze(config);
