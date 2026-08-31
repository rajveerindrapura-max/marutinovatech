const { getDb } = require('../db/connection');

class Course {
  /**
   * Get all courses, optionally filtered by category.
   * @param {string|null} category - Filter by category (null or 'all' for no filter)
   * @returns {Array}
   */
  static findAll(category = null) {
    const db = getDb();

    if (category && category !== 'all') {
      const rows = db.prepare(
        'SELECT * FROM courses WHERE LOWER(category) = LOWER(?) ORDER BY id ASC'
      ).all(category);
      return rows.map(Course._deserialize);
    }

    const rows = db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
    return rows.map(Course._deserialize);
  }

  /**
   * Find a single course by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  static findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(String(id));
    return row ? Course._deserialize(row) : null;
  }

  /**
   * Safe JSON parse helper.
   * @private
   */
  static _safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Deserialize a SQLite row to a course object with parsed JSON fields.
   * Maps snake_case DB columns back to camelCase for API compatibility.
   * @private
   */
  static _deserialize(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      categoryLabel: row.category_label,
      level: row.level,
      duration: row.duration,
      schedule: row.schedule,
      tags: Course._safeJsonParse(row.tags, []),
      price: row.price,
      priceLabel: row.price_label,
      status: row.status,
      action: row.action,
      iconName: row.icon_name,
    };
  }
}

module.exports = Course;

