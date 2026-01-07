const db = require('../config/database');

class FeatureFlag {
  static async create(flagData) {
    const {
      key,
      name,
      description = '',
      enabled = false,
      rollout_percentage = 0,
      targeting_rules = []
    } = flagData;

    const query = `
      INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage, targeting_rules)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [key, name, description, enabled, rollout_percentage, JSON.stringify(targeting_rules)];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM feature_flags';
    const values = [];
    
    if (filters.enabled !== undefined) {
      query += ' WHERE enabled = $1';
      values.push(filters.enabled);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, values);
    return result.rows;
  }

  static async findByKey(key) {
    const result = await db.query('SELECT * FROM feature_flags WHERE key = $1', [key]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM feature_flags WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(key, updates) {
    const allowedFields = ['name', 'description', 'enabled', 'rollout_percentage', 'targeting_rules'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(field === 'targeting_rules' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(key);

    const query = `
      UPDATE feature_flags
      SET ${fields.join(', ')}
      WHERE key = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(key) {
    const result = await db.query('DELETE FROM feature_flags WHERE key = $1 RETURNING id', [key]);
    return result.rows.length > 0;
  }

  static async toggle(key) {
    const query = `
      UPDATE feature_flags
      SET enabled = NOT enabled, updated_at = NOW()
      WHERE key = $1
      RETURNING *
    `;
    const result = await db.query(query, [key]);
    return result.rows[0] || null;
  }

  static async exists(key) {
    const result = await db.query('SELECT 1 FROM feature_flags WHERE key = $1', [key]);
    return result.rows.length > 0;
  }
}

module.exports = FeatureFlag;
