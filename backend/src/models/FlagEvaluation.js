const db = require('../config/database');

class FlagEvaluation {
  static async create(evaluationData) {
    const { flag_key, user_id, result: evalResult } = evaluationData;

    const query = `
      INSERT INTO flag_evaluations (flag_key, user_id, result)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const dbResult = await db.query(query, [flag_key, user_id, evalResult]);
    return dbResult.rows[0];
  }

  static async getStats(flagKey, options = {}) {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        COUNT(*) as total_evaluations,
        COUNT(CASE WHEN result = true THEN 1 END) as enabled_count,
        COUNT(CASE WHEN result = false THEN 1 END) as disabled_count,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(evaluated_at) as first_evaluation,
        MAX(evaluated_at) as last_evaluation
      FROM flag_evaluations
      WHERE flag_key = $1
    `;

    const values = [flagKey];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND evaluated_at >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND evaluated_at <= $${paramIndex}`;
      values.push(endDate);
    }

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findRecent(flagKey, limit = 100) {
    const query = `
      SELECT * FROM flag_evaluations
      WHERE flag_key = $1
      ORDER BY evaluated_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [flagKey, limit]);
    return result.rows;
  }

  static async deleteOldLogs(daysOld = 30) {
    // Validate input to prevent SQL injection
    const days = Math.max(1, Math.min(365, parseInt(daysOld) || 30));
    
    const query = `
      DELETE FROM flag_evaluations
      WHERE evaluated_at < NOW() - INTERVAL '1 day' * $1
      RETURNING id
    `;

    const result = await db.query(query, [days]);
    return result.rows.length;
  }
}

module.exports = FlagEvaluation;
