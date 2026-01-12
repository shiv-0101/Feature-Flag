# Database Models and Migrations - Phase 2

## Models Created

### FeatureFlag Model
**File**: `backend/src/models/FeatureFlag.js`

#### Methods:
- `create(flagData)` - Create a new feature flag
- `findAll(filters)` - Get all flags with optional filters
- `findByKey(key)` - Find flag by key
- `findById(id)` - Find flag by UUID
- `update(key, updates)` - Update flag fields
- `delete(key)` - Delete a flag
- `toggle(key)` - Toggle enabled state
- `exists(key)` - Check if flag key exists

### FlagEvaluation Model
**File**: `backend/src/models/FlagEvaluation.js`

#### Methods:
- `create(evaluationData)` - Log an evaluation
- `getStats(flagKey, options)` - Get evaluation statistics
- `findRecent(flagKey, limit)` - Get recent evaluations
- `deleteOldLogs(daysOld)` - Cleanup old logs

## Database Schema

### feature_flags Table
```sql
Column               | Type         | Constraints
---------------------|--------------|-------------
id                   | UUID         | PRIMARY KEY
key                  | VARCHAR(255) | UNIQUE NOT NULL
name                 | VARCHAR(255) | NOT NULL
description          | TEXT         |
enabled              | BOOLEAN      | DEFAULT false
rollout_percentage   | INTEGER      | DEFAULT 0, CHECK (0-100)
targeting_rules      | JSONB        | DEFAULT '[]'
created_at           | TIMESTAMP    | DEFAULT NOW()
updated_at           | TIMESTAMP    | DEFAULT NOW()
```

**Indexes**:
- `idx_flags_key` on `key`
- `idx_flags_enabled` on `enabled`

### flag_evaluations Table
```sql
Column        | Type         | Constraints
--------------|--------------|-------------
id            | UUID         | PRIMARY KEY
flag_key      | VARCHAR(255) | NOT NULL
user_id       | VARCHAR(255) |
result        | BOOLEAN      |
evaluated_at  | TIMESTAMP    | DEFAULT NOW()
```

**Indexes**:
- `idx_evaluations_flag_key` on `flag_key`
- `idx_evaluations_user_id` on `user_id`
- `idx_evaluations_evaluated_at` on `evaluated_at`

## Migration Commands

```bash
# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Rollback (drop all tables)
npm run db:rollback
```

## Sample Data (Seed)

The seed creates 4 example flags:
1. **dark_mode** - Disabled, 0% rollout
2. **new_dashboard** - Enabled, 10% rollout, targeted to admin users
3. **experimental_feature** - Disabled, 0% rollout
4. **premium_features** - Enabled, 100% rollout, targeted by subscription

## Targeting Rules Structure

```json
[
  {
    "type": "user_id",
    "operator": "in",
    "values": ["user-1", "user-2"]
  },
  {
    "type": "user_attribute",
    "key": "subscription",
    "operator": "equals",
    "value": "premium"
  }
]
```

## Usage Examples

```javascript
const { FeatureFlag } = require('./models');

// Create a flag
const flag = await FeatureFlag.create({
  key: 'my_feature',
  name: 'My Feature',
  enabled: true,
  rollout_percentage: 50
});

// Get all flags
const flags = await FeatureFlag.findAll();

// Update a flag
await FeatureFlag.update('my_feature', {
  rollout_percentage: 100
});

// Toggle a flag
await FeatureFlag.toggle('my_feature');

// Delete a flag
await FeatureFlag.delete('my_feature');
```

## Next Steps
With models complete, ready to build:
- Phase 2 (continued): REST API endpoints using these models
- Phase 3: Flag evaluation logic
