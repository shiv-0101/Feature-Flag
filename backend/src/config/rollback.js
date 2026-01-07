require('dotenv').config();
const { pool } = require('./database');

const rollback = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back migrations...');

    const indexes = [
      'DROP INDEX IF EXISTS idx_evaluations_evaluated_at',
      'DROP INDEX IF EXISTS idx_evaluations_user_id',
      'DROP INDEX IF EXISTS idx_evaluations_flag_key',
      'DROP INDEX IF EXISTS idx_flags_enabled',
      'DROP INDEX IF EXISTS idx_flags_key'
    ];

    for (const index of indexes) {
      await client.query(index);
    }
    console.log('✅ Dropped indexes');

    await client.query('DROP TABLE IF EXISTS flag_evaluations');
    console.log('✅ Dropped flag_evaluations table');
    
    await client.query('DROP TABLE IF EXISTS feature_flags');
    console.log('✅ Dropped feature_flags table');

    console.log('🎉 Rollback completed!');
  } catch (err) {
    console.error('❌ Rollback failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

rollback();
