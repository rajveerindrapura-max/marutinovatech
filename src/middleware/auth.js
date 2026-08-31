const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verifies JWT from Authorization header.
 * Sets req.user = { id, email, role } on success.
 * Returns 401 if token is missing or invalid.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Requires the authenticated user to have role === 'admin'.
 * Must be used AFTER authenticateToken.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      // Token invalid — proceed without user
    }
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, optionalAuth };
