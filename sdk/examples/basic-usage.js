import FeatureFlagClient from '../src/index.js';

const client = new FeatureFlagClient({
  apiUrl: 'http://localhost:3001/api',
  userId: 'user_123',
  userAttributes: {
    role: 'admin',
    plan: 'premium',
  },
  enableCache: true,
  cacheTTL: 60000,
  pollInterval: 30000,
});

client.on('ready', (flags) => {
  console.log('SDK initialized with flags:', flags);
});

client.on('flagsUpdated', (flags) => {
  console.log('Flags updated:', flags);
});

client.on('error', (error) => {
  console.error('SDK error:', error.message);
});

async function main() {
  await client.initialize();

  const darkModeEnabled = await client.isEnabled('dark_mode', false);
  console.log('Dark mode enabled:', darkModeEnabled);

  const newFeatureEnabled = await client.isEnabled('new_feature', false);
  console.log('New feature enabled:', newFeatureEnabled);

  const bulkResults = await client.evaluateFlags(['dark_mode', 'new_feature', 'beta_access']);
  console.log('Bulk evaluation:', bulkResults);

  const allFlags = client.getAllFlags();
  console.log('All flags:', allFlags);

  await client.updateUserAttributes({ plan: 'enterprise' });
  console.log('Updated user attributes');

  setTimeout(() => {
    client.destroy();
    console.log('SDK destroyed');
    process.exit(0);
  }, 65000);
}

main().catch(console.error);