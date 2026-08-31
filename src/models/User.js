const bcrypt = require('bcryptjs');
const { getDb } = require('../db/connection');

class User {
  /**
   * Find a user by email (case-insensitive).
   * @param {string} email
   * @returns {Object|null}
   */
  static findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) || null;
  }

  /**
   * Verify a password against the stored hash.
   * @param {string} plainPassword
   * @param {string} hash
   * @returns {boolean}
   */
  static verifyPassword(plainPassword, hash) {
    return bcrypt.compareSync(plainPassword, hash);
  }

  /**
   * Create a new user.
   * @param {Object} data - { email, password, role, name }
   * @returns {Object} Created user (without password_hash)
   */
  static create(data) {
    const db = getDb();
    const hash = bcrypt.hashSync(data.password, 10);
    db.prepare(
      'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
    ).run(data.email, hash, data.role || 'student', data.name || null);

    const user = User.findByEmail(data.email);
    if (user) {
      delete user.password_hash;
    }
    return user;
  }
}

module.exports = User;
