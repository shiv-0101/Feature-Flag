require('dotenv').config();
const { pool } = require('./database');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT false,
        rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
        targeting_rules JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created feature_flags table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS flag_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flag_key VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        result BOOLEAN,
        evaluated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created flag_evaluations table');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_flags_key ON feature_flags(key)',
      'CREATE INDEX IF NOT EXISTS idx_flags_enabled ON feature_flags(enabled)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_flag_key ON flag_evaluations(flag_key)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON flag_evaluations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_evaluated_at ON flag_evaluations(evaluated_at)'
    ];

    for (const index of indexes) {
      await client.query(index);
    }
    console.log('✅ Created indexes');

    console.log('🎉 Migrations completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
