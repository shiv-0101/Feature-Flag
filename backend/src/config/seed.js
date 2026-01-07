require('dotenv').config();
const { FeatureFlag } = require('../models');

const seedFlags = [
  {
    key: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark theme across the application',
    enabled: false,
    rollout_percentage: 0,
    targeting_rules: [],
  },
  {
    key: 'new_dashboard',
    name: 'New Dashboard',
    description: 'Rollout the redesigned dashboard',
    enabled: true,
    rollout_percentage: 10,
    targeting_rules: [
      { type: 'user_id', operator: 'in', values: ['admin-user-1', 'admin-user-2'] }
    ],
  },
  {
    key: 'experimental_feature',
    name: 'Experimental Feature',
    description: 'Testing new experimental functionality',
    enabled: false,
    rollout_percentage: 0,
    targeting_rules: [],
  },
  {
    key: 'premium_features',
    name: 'Premium Features',
    description: 'Features available for premium users only',
    enabled: true,
    rollout_percentage: 100,
    targeting_rules: [
      { type: 'user_attribute', key: 'subscription', operator: 'equals', value: 'premium' }
    ],
  },
];

const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    for (const flagData of seedFlags) {
      const exists = await FeatureFlag.exists(flagData.key);
      
      if (exists) {
        console.log(`⏭️  Flag "${flagData.key}" already exists`);
      } else {
        await FeatureFlag.create(flagData);
        console.log(`✅ Created flag: ${flagData.key}`);
      }
    }

    console.log('🎉 Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
