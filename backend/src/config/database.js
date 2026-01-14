const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for better reliability
  max: 10,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout after 10s if can't connect
  retryDelay: 1000,           // Wait 1s between retries
});

pool.on('connect', () => console.log('📦 Connected to PostgreSQL'));
pool.on('error', (err) => console.error('PostgreSQL pool error:', err.message));

// Query with automatic retry for transient errors
const queryWithRetry = async (text, params, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const isTransient = err.code === 'ENOTFOUND' || 
                          err.code === 'ECONNREFUSED' || 
                          err.code === 'ETIMEDOUT';
      
      if (isTransient && attempt < retries) {
        console.log(`Database query failed (attempt ${attempt}/${retries}), retrying...`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
};

module.exports = {
  query: queryWithRetry,
  pool,
};
