const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => console.log('📦 Connected to PostgreSQL'));
pool.on('error', (err) => console.error('PostgreSQL error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
